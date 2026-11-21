import { prisma } from "@/lib/prisma"
import { hasOpenCashRecord } from "@/lib/cash-guard"
import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import {
  createErrorResponse,
  createSuccessResponse,
  handleApiError,
  getPaginationParams,
  buildPaginatedResponse,
} from "@/lib/api-utils"
import { logger } from "@/lib/logger"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"
import { logAudit } from "@/lib/audit-log"
import { createNotification } from "@/lib/notifications"
import { parseJsonField, type PaymentSplit } from "@/lib/json-field"
import {
  parseDateStartLocal,
  parseDateEndLocal,
  formatDateLocal,
  normalizePaymentMethod,
  normalizeSaleType,
  safeInitialPayment,
  validateSalePayload,
} from "@/lib/sales-utils"

export async function GET(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) {
      return createErrorResponse("No autenticado", 401)
    }
    if (!hasAnyPermission(actor, ["sales.read", "sales.list", "sales.all", "sales"])) {
      return createErrorResponse("Sin permisos para ver ventas", 403)
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const status = searchParams.get("status")
    const clientId = searchParams.get("clientId")
    const { page, limit, skip } = getPaginationParams(searchParams)

    const where: Prisma.SaleWhereInput = { isDeleted: false }
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = parseDateStartLocal(startDate)
      if (endDate) where.date.lte = parseDateEndLocal(endDate)
    }

    if (status && status !== "all") {
      where.status = status
    }

    if (clientId) {
      where.clientId = clientId
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          client: true,
          seller: true,
          credit: true,
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.sale.count({ where }),
    ])

    const transformed = sales.map((sale) => ({
      id: sale.id,
      date: formatDateLocal(sale.date),
      clientId: sale.clientId,
      clientName: sale.client?.name ?? "Cliente no registrado",
      sellerUserId: sale.sellerUserId,
      sellerName: `${sale.seller.firstName} ${sale.seller.lastName}`,
      items: sale.items.map((item) => ({
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
      })),
      subtotal: sale.subtotal,
      tax: sale.tax,
      discount: sale.discount,
      total: sale.total,
      saleType: sale.credit ? "credito" : "contado",
      paymentMethod: sale.paymentMethod,
      paymentSplits: parseJsonField<PaymentSplit[] | null>(sale.paymentSplits, null) ?? undefined,
      notes: sale.notes || undefined,
      status: sale.status,
      createdAt: formatDateLocal(sale.createdAt),
    }))

    return createSuccessResponse(buildPaginatedResponse(transformed, total, page, limit))
  } catch (error) {
    logger.error("Error al obtener ventas", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al obtener ventas")
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) {
      return createErrorResponse("No autenticado", 401)
    }
    if (!hasAnyPermission(actor, ["sales.create", "sales.all", "sales"])) {
      return createErrorResponse("Sin permisos para crear ventas", 403)
    }

    const hasOpenCash = await hasOpenCashRecord()
    if (!hasOpenCash) {
      return createErrorResponse(
        "No hay una caja abierta. Debes abrir caja antes de registrar transacciones.",
        400,
      )
    }

    const body = await request.json()
    const {
      date,
      clientId,
      sellerUserId,
      items,
      subtotal,
      tax,
      discount,
      total,
      saleType,
      paymentMethod,
      initialPaymentMethod,
      initialPayment,
      notes,
      status,
    } = body

    const validationError = validateSalePayload(body)
    if (validationError) {
      return createErrorResponse(validationError, 400)
    }
    // Endurecer montos: rechazar NaN/Infinity y métodos fuera del enum
    const ALLOWED_METHODS = ["efectivo", "transferencia", "qr", "tarjeta", "credito", "crédito"]
    if (!ALLOWED_METHODS.includes(String(paymentMethod || "efectivo").toLowerCase()) && !saleType) {
      return createErrorResponse("Método de pago inválido", 400)
    }
    for (const key of ["subtotal", "tax", "discount", "total"] as const) {
      const v = body[key]
      if (v !== undefined && v !== null && v !== "" && !Number.isFinite(Number(v))) {
        return createErrorResponse(`Monto inválido: ${key}`, 400)
      }
    }
    if (!Array.isArray(items) || items.length === 0) {
      return createErrorResponse("Debe agregar al menos un producto", 400)
    }
    for (const item of items) {
      if (
        !item?.productId ||
        !Number.isFinite(Number(item.quantity)) ||
        Number(item.quantity) <= 0
      ) {
        return createErrorResponse("Item de venta inválido (producto/cantidad)", 400)
      }
      if (!Number.isFinite(Number(item.price)) || Number(item.price) < 0) {
        return createErrorResponse("Item de venta inválido (precio)", 400)
      }
    }
    const resolvedClientId = String(clientId ?? "").trim() || null

    const finalStatus = status || "completada"
    const normalizedSaleType = normalizeSaleType(saleType || paymentMethod)
    const isCreditSale = normalizedSaleType === "credito"
    const rawMethod = String(
      isCreditSale
        ? initialPaymentMethod || paymentMethod || "efectivo"
        : paymentMethod || "efectivo",
    )
    const normalizedRawMethod = normalizePaymentMethod(rawMethod)
    const safeBaseMethod =
      normalizedRawMethod === "efectivo" ||
      normalizedRawMethod === "transferencia" ||
      normalizedRawMethod === "qr"
        ? normalizedRawMethod
        : "efectivo"
    const finalTotal = parseFloat(total)
    const finalPaymentMethod = safeBaseMethod
    const initialAmount = safeInitialPayment(initialPayment, finalTotal)

    const sale = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Validar stock suficiente antes de decrementar (evita stock negativo)
      const productStocks = await tx.product.findMany({
        where: { id: { in: items.map((i: { productId: string }) => i.productId) } },
        select: { id: true, name: true, stock: true, isDeleted: true },
      })
      const stockById = new Map(productStocks.map((p) => [p.id, p]))
      for (const item of items) {
        const p = stockById.get(item.productId)
        if (!p || p.isDeleted) throw new Error(`Producto no encontrado: ${item.productId}`)
        if (p.stock < parseInt(item.quantity)) {
          throw new Error(`Stock insuficiente para ${p.name} (disponible ${p.stock})`)
        }
      }

      const createdSale = await tx.sale.create({
        data: {
          date: parseDateStartLocal(date),
          clientId: resolvedClientId,
          sellerUserId: sellerUserId,
          subtotal: parseFloat(subtotal),
          tax: parseFloat(tax) || 0,
          discount: parseFloat(discount) || 0,
          total: finalTotal,
          paymentMethod: finalPaymentMethod,
          paymentSplits: null,
          notes: notes || null,
          status: finalStatus,
          items: {
            create: items.map(
              (item: { productId: string; quantity: number; price: number; subtotal: number }) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.subtotal,
              }),
            ),
          },
        },
      })

      // Actualizar stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: parseInt(item.quantity),
            },
          },
        })
      }

      // LÓGICA DE CRÉDITO
      const isCredit = isCreditSale
      const creditAmount = isCredit ? Math.max(finalTotal - initialAmount, 0) : 0

      if (creditAmount > 0) {
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 15) // 15 días por defecto
        await tx.credit.create({
          data: {
            saleId: createdSale.id,
            // validateSalePayload garantiza que en crédito hay cliente
            clientId: resolvedClientId!,
            total: creditAmount,
            balance: creditAmount,
            status: "pending",
            dueDate: dueDate,
          },
        })
      }

      // Actualizar caja si hay ingreso en efectivo/otros (atómico, evita lost update)
      if (finalStatus === "completada") {
        const cashIncomeFromSale = isCredit ? initialAmount : finalTotal
        if (cashIncomeFromSale > 0) {
          const openCash = await tx.cashRecord.findFirst({
            where: { status: "open", isDeleted: false },
          })
          if (openCash) {
            await tx.cashRecord.update({
              where: { id: openCash.id },
              data: {
                cashIncome: { increment: cashIncomeFromSale },
                closingBalance: { increment: cashIncomeFromSale },
              },
            })
          }
        }
      }

      return tx.sale.findUniqueOrThrow({
        where: { id: createdSale.id },
        include: {
          client: true,
          seller: true,
          items: {
            include: { product: true },
          },
        },
      })
    })

    logAudit({
      action: "CREATE",
      entity: "sale",
      entityId: sale.id,
      userId: actor.userId,
      changes: {
        subtotal: sale.subtotal,
        tax: sale.tax,
        discount: sale.discount,
        total: sale.total,
        status: sale.status,
        paymentMethod: sale.paymentMethod,
      },
      metadata: {
        itemCount: sale.items.length,
        hasSplits: Boolean(sale.paymentSplits),
      },
    }).catch(() => {})

    // Notificaciones fuera del request (fire-and-forget, no bloquean la venta)
    createNotification({
      type: "success",
      title: "Venta registrada",
      message: `Se registró una venta por Bs ${sale.total.toFixed(2)}.`,
      entity: "sale",
      entityId: sale.id,
      url: "/sales",
      metadata: { paymentMethod: sale.paymentMethod, status: sale.status },
    }).catch(() => {})

    const productIds = sale.items.map((i) => i.productId)
    if (productIds.length > 0) {
      const lowStockProducts = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          isDeleted: false,
        },
        select: { id: true, name: true, stock: true, minimumStock: true },
      })

      for (const product of lowStockProducts.filter((p) => p.stock <= p.minimumStock)) {
        createNotification({
          type: "warning",
          title: "Stock bajo",
          message: `${product.name} quedó en ${product.stock} unidades (mínimo ${product.minimumStock}).`,
          entity: "product",
          entityId: product.id,
          url: "/inventory",
        }).catch(() => {})
      }
    }

    return createSuccessResponse(sale, 201)
  } catch (error) {
    logger.error("Error al crear venta", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al crear venta")
  }
}
