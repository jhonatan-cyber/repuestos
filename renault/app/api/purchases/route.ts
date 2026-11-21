import { prisma } from "@/lib/prisma"
import { hasOpenCashRecord } from "@/lib/cash-guard"
import { logAudit } from "@/lib/audit-log"
import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import {
  createErrorResponse,
  createSuccessResponse,
  handleApiError,
  isPrismaKnownRequestError,
  getPaginationParams,
  buildPaginatedResponse,
} from "@/lib/api-utils"
import { logger } from "@/lib/logger"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"
import { createNotification } from "@/lib/notifications"
import { PurchaseSchema } from "@/lib/validations"
import { z } from "zod"
import { parseDateStartLocal, parseDateEndLocal, formatDateLocal } from "@/lib/dates"

// El proveedor puede omitirse (se usa "Proveedor no registrado"); el resto lo valida Zod.
const RelaxedPurchaseSchema = PurchaseSchema.extend({
  supplierId: z.string().min(1).optional().or(z.literal("")),
})

export async function GET(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)
    if (
      !hasAnyPermission(actor, ["purchases.read", "purchases.list", "purchases.all", "purchases"])
    ) {
      return createErrorResponse("Sin permisos para ver compras", 403)
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const status = searchParams.get("status")
    const { page, limit, skip } = getPaginationParams(searchParams)

    const where: Prisma.PurchaseWhereInput = { isDeleted: false }
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = parseDateStartLocal(startDate)
      if (endDate) where.date.lte = parseDateEndLocal(endDate)
    }

    if (status && status !== "all") where.status = status

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        include: {
          supplier: true,
          buyer: true,
          credit: true,
          items: { include: { product: true } },
        },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.purchase.count({ where }),
    ])

    const transformed = purchases.map((purchase) => ({
      purchaseType: purchase.credit ? "credito" : "contado",
      id: purchase.id,
      date: formatDateLocal(purchase.date),
      supplierId: purchase.supplierId,
      supplierName: purchase.supplier.name,
      buyerUserId: purchase.buyerUserId,
      buyerName: `${purchase.buyer.firstName} ${purchase.buyer.lastName}`,
      items: purchase.items.map((item) => ({
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal: purchase.subtotal,
      tax: purchase.tax,
      total: purchase.total,
      initialPayment: purchase.credit
        ? Math.max(purchase.total - purchase.credit.total, 0)
        : purchase.total,
      initialDebt: purchase.credit ? purchase.credit.total : 0,
      debtAmount: purchase.credit ? purchase.credit.balance : 0,
      status: purchase.status,
      paymentMethod: purchase.paymentMethod || "efectivo",
      createdAt: formatDateLocal(purchase.createdAt),
    }))

    return createSuccessResponse(buildPaginatedResponse(transformed, total, page, limit))
  } catch (error) {
    logger.error("Error al obtener compras", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al obtener compras")
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)
    if (!hasAnyPermission(actor, ["purchases.create", "purchases.all", "purchases"])) {
      return createErrorResponse("Sin permisos para registrar compras", 403)
    }

    const hasOpenCash = await hasOpenCashRecord()
    if (!hasOpenCash) {
      return createErrorResponse(
        "No hay una caja abierta. Debes abrir caja antes de registrar transacciones.",
        400,
      )
    }

    const body = await request.json()
    const parsed = RelaxedPurchaseSchema.safeParse({
      ...body,
      supplierId: body.supplierId ? String(body.supplierId) : undefined,
      buyerUserId: body.buyerUserId ? String(body.buyerUserId) : undefined,
      items: Array.isArray(body.items)
        ? body.items.map((item: { productId?: unknown; quantity?: unknown; price?: unknown }) => ({
            productId: String(item?.productId || ""),
            quantity: Number(item?.quantity || 0),
            price: Number(item?.price || 0),
          }))
        : [],
    })
    if (!parsed.success) {
      return createErrorResponse(
        parsed.error.issues[0]?.message || "Datos de compra inválidos",
        400,
      )
    }
    const { date, supplierId, buyerUserId, items, subtotal, tax, total, status, paymentMethod } =
      parsed.data
    const { purchaseType, initialPaymentMethod, initialPayment } = body as {
      purchaseType?: unknown
      initialPaymentMethod?: unknown
      initialPayment?: unknown
    }

    const normalizedItems = items.map(
      (item: { productId: string; quantity: string | number; price: string | number }) => ({
        productId: String(item.productId || ""),
        quantity: Number(item.quantity || 0),
        price: Number(item.price || 0),
      }),
    )

    if (normalizedItems.some((item) => !item.productId || item.quantity <= 0 || item.price < 0)) {
      return createErrorResponse("Los items de la compra son inválidos", 400)
    }

    const normalizedSupplierId = String(supplierId || "").trim()

    const [supplier, buyer, products] = await Promise.all([
      normalizedSupplierId
        ? prisma.supplier.findUnique({ where: { id: normalizedSupplierId }, select: { id: true } })
        : Promise.resolve(null),
      prisma.user.findUnique({
        where: { id: String(buyerUserId) },
        select: { id: true, status: true },
      }),
      prisma.product.findMany({
        where: { id: { in: normalizedItems.map((item) => item.productId) } },
        select: { id: true, isDeleted: true },
      }),
    ])

    if (normalizedSupplierId && !supplier)
      return createErrorResponse("El proveedor seleccionado no existe", 400)
    if (!buyer) return createErrorResponse("El usuario comprador no existe", 400)
    if (buyer.status !== "active")
      return createErrorResponse("El usuario comprador está inactivo", 400)

    const validProductIds = new Set(
      products.filter((product) => !product.isDeleted).map((product) => product.id),
    )
    const missingProducts = normalizedItems.filter((item) => !validProductIds.has(item.productId))
    if (missingProducts.length > 0) {
      return createErrorResponse(
        "Uno o más productos seleccionados no existen o están inactivos",
        400,
      )
    }

    const finalStatus = status || "pendiente"
    const finalSubtotal = Number(subtotal)
    const finalTax = Number(tax) || 0
    const finalTotal = Number(total)
    const normalizedType = String(purchaseType || "").toLowerCase()
    const isCreditPurchase =
      normalizedType === "credito" ||
      normalizedType === "crédito" ||
      String(paymentMethod || "").toLowerCase() === "crédito" ||
      String(paymentMethod || "").toLowerCase() === "credito"
    const finalPaymentMethod = String(
      isCreditPurchase
        ? initialPaymentMethod || paymentMethod || "efectivo"
        : paymentMethod || "efectivo",
    )
    const safeInitialPayment = Math.max(0, Number(initialPayment || 0))

    if (
      !Number.isFinite(finalSubtotal) ||
      !Number.isFinite(finalTotal) ||
      finalSubtotal < 0 ||
      finalTotal < 0
    ) {
      return createErrorResponse("Los montos de la compra son inválidos", 400)
    }
    if (safeInitialPayment > finalTotal) {
      return createErrorResponse("El monto inicial no puede ser mayor al total de la compra", 400)
    }

    const purchase = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Re-validar dentro de la tx (evita TOCTOU: el producto pudo borrarse tras el check previo)
      const txProducts = await tx.product.findMany({
        where: { id: { in: normalizedItems.map((i) => i.productId) } },
        select: { id: true, isDeleted: true },
      })
      const txValid = new Set(txProducts.filter((p) => !p.isDeleted).map((p) => p.id))
      const txMissing = normalizedItems.filter((i) => !txValid.has(i.productId))
      if (txMissing.length > 0) {
        throw new Error("Uno o más productos seleccionados no existen o están inactivos")
      }

      let resolvedSupplierId = normalizedSupplierId

      if (!resolvedSupplierId) {
        const defaultSupplierName = "Proveedor no registrado"
        const defaultSupplierPhone = "Sin teléfono"
        const existingDefaultSupplier = await tx.supplier.findFirst({
          where: { name: defaultSupplierName },
          select: { id: true },
          orderBy: { createdAt: "asc" },
        })

        if (existingDefaultSupplier) {
          resolvedSupplierId = existingDefaultSupplier.id
        } else {
          const createdDefaultSupplier = await tx.supplier.create({
            data: {
              name: defaultSupplierName,
              phone: defaultSupplierPhone,
            },
            select: { id: true },
          })
          resolvedSupplierId = createdDefaultSupplier.id
        }
      }

      const createdPurchase = await tx.purchase.create({
        data: {
          date: date instanceof Date ? date : parseDateStartLocal(date),
          supplierId: resolvedSupplierId,
          buyerUserId: String(buyerUserId),
          subtotal: finalSubtotal,
          tax: finalTax,
          total: finalTotal,
          paymentMethod: finalPaymentMethod,
          status: finalStatus,
          items: {
            create: normalizedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      })

      if (finalStatus === "recibida") {
        for (const item of normalizedItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          })
        }
      }

      await tx.supplier.update({
        where: { id: resolvedSupplierId },
        data: { totalPurchases: { increment: finalTotal } },
      })

      const creditBalance = Math.max(finalTotal - safeInitialPayment, 0)

      if (isCreditPurchase && finalStatus !== "cancelada" && creditBalance > 0) {
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 30)
        await tx.purchaseCredit.create({
          data: {
            purchaseId: createdPurchase.id,
            supplierId: resolvedSupplierId,
            total: creditBalance,
            balance: creditBalance,
            status: "pending",
            dueDate,
          },
        })
      }

      return tx.purchase.findUniqueOrThrow({
        where: { id: createdPurchase.id },
        include: {
          supplier: true,
          buyer: true,
          items: { include: { product: true } },
        },
      })
    })

    logAudit({
      action: "CREATE",
      entity: "purchase",
      entityId: purchase.id,
      userId: actor.userId,
      changes: {
        date,
        supplierId: purchase.supplierId,
        paymentMethod: finalPaymentMethod,
        subtotal: finalSubtotal,
        tax: finalTax,
        total: finalTotal,
        status: finalStatus,
        itemsCount: normalizedItems.length,
        itemIds: normalizedItems.map((item) => item.productId),
      },
      metadata: {
        supplierName: purchase.supplier.name,
        buyerName: `${purchase.buyer.firstName} ${purchase.buyer.lastName}`,
        cashImpact: 0,
      },
    }).catch((err) => {})

    createNotification({
      type: "info",
      title: "Compra registrada",
      message: `Se registró una compra por Bs ${purchase.total.toFixed(2)} a ${purchase.supplier.name}.`,
      entity: "purchase",
      entityId: purchase.id,
      url: "/purchases",
      metadata: { status: purchase.status, paymentMethod: purchase.paymentMethod },
    }).catch(() => {})

    return createSuccessResponse(purchase, 201)
  } catch (error) {
    if (isPrismaKnownRequestError(error)) {
      return createErrorResponse("No se pudo registrar la compra por un conflicto de datos", 400)
    }
    const msg = error instanceof Error ? error.message : "No se pudo registrar la compra"
    logger.error("Error al registrar compra", { error: msg })
    return createErrorResponse(msg, 500)
  }
}
