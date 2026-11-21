import { prisma } from "@/lib/prisma"
import { hasOpenCashRecord } from "@/lib/cash-guard"
import type { Prisma } from "@prisma/client"
import { NextRequest } from "next/server"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { logger } from "@/lib/logger"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"
import { normalizePaymentMethod, normalizeSaleType, safeInitialPayment } from "@/lib/sales-utils"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)
    if (!hasAnyPermission(actor, ["sales.create", "sales.all", "sales"])) {
      return createErrorResponse("Sin permisos para convertir cotizaciones", 403)
    }
    const hasOpenCash = await hasOpenCashRecord()
    if (!hasOpenCash) {
      return createErrorResponse(
        "No hay una caja abierta. Debes abrir caja antes de registrar transacciones.",
        400,
      )
    }

    const { id } = await params

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        items: true,
      },
    })

    if (!quotation) {
      return createErrorResponse("Cotización no encontrada", 404)
    }

    if (quotation.status === "convertida") {
      return createErrorResponse("La cotización ya fue convertida", 400)
    }

    let body: {
      saleType?: unknown
      paymentMethod?: unknown
      initialPaymentMethod?: unknown
      initialPayment?: unknown
    } = {}
    try {
      body = await request.json()
    } catch {
      // sin body: valores por defecto
    }

    const normalizedSaleType = normalizeSaleType(body.saleType)
    const isCreditSale = normalizedSaleType === "credito"
    const rawMethod = String(
      isCreditSale
        ? body.initialPaymentMethod || body.paymentMethod || "efectivo"
        : body.paymentMethod || "efectivo",
    )
    const normalizedRawMethod = normalizePaymentMethod(rawMethod)
    const paymentMethod =
      normalizedRawMethod === "efectivo" ||
      normalizedRawMethod === "transferencia" ||
      normalizedRawMethod === "qr"
        ? normalizedRawMethod
        : "efectivo"
    const initialPayment = safeInitialPayment(body.initialPayment, quotation.total)

    if (isCreditSale && !quotation.clientId) {
      const externalName = quotation.externalClientName?.trim()
      if (!externalName || externalName === "Sin cliente registrado") {
        return createErrorResponse("Para ventas a crédito debés seleccionar un cliente", 400)
      }
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Resolver/crear cliente DENTRO de la tx (evita duplicados en carrera)
      let txClientId: string | null = quotation.clientId
      const externalName = quotation.externalClientName?.trim()
      if (!txClientId && externalName && externalName !== "Sin cliente registrado") {
        const existing = await tx.client.findFirst({
          where: {
            name: externalName,
            phone: quotation.externalClientPhone || "",
            isDeleted: false,
          },
        })
        const client =
          existing ??
          (await tx.client.create({
            data: {
              name: externalName,
              phone: quotation.externalClientPhone || "",
            },
          }))
        txClientId = client.id
        await tx.quotation.update({
          where: { id },
          data: { clientId: client.id },
        })
      }

      if (isCreditSale && !txClientId) {
        throw new Error("Para ventas a crédito debés seleccionar un cliente")
      }
      const creditClientId = txClientId as string
      // Validar stock dentro de la tx (evita vender sin existencias)
      const stocks = await tx.product.findMany({
        where: { id: { in: quotation.items.map((i) => i.productId) } },
        select: { id: true, name: true, stock: true, isDeleted: true },
      })
      const byId = new Map(stocks.map((s) => [s.id, s]))
      for (const item of quotation.items) {
        const s = byId.get(item.productId)
        if (!s || s.isDeleted) throw new Error(`Producto no encontrado: ${item.productId}`)
        if (s.stock < item.quantity) throw new Error(`Stock insuficiente para ${s.name}`)
      }

      const sale = await tx.sale.create({
        data: {
          clientId: txClientId,
          sellerUserId: quotation.sellerUserId,
          date: new Date(),
          subtotal: quotation.subtotal,
          tax: quotation.tax,
          discount: quotation.discount,
          total: quotation.total,
          paymentMethod: paymentMethod,
          status: "completada",
          items: {
            create: quotation.items.map(
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

      await tx.quotation.update({
        where: { id },
        data: {
          status: "convertida",
          convertedToSaleId: sale.id,
        },
      })

      for (const item of quotation.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        })
      }

      // LÓGICA DE CRÉDITO
      const creditAmount = isCreditSale ? Math.max(quotation.total - initialPayment, 0) : 0
      if (creditAmount > 0) {
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 15)
        await tx.credit.create({
          data: {
            saleId: sale.id,
            clientId: creditClientId,
            total: creditAmount,
            balance: creditAmount,
            status: "pending",
            dueDate: dueDate,
          },
        })
      }

      // Actualizar caja con el ingreso (atómico)
      const cashIncomeFromSale = isCreditSale ? initialPayment : quotation.total
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

      return sale
    })

    return createSuccessResponse({
      message: "Cotización convertida a venta exitosamente",
      saleId: result.id,
    })
  } catch (error) {
    logger.error("Error al convertir cotización", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "No se pudo convertir la cotización")
  }
}
