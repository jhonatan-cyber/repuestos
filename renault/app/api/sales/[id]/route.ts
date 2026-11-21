import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { logger } from "@/lib/logger"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"
import { logAudit } from "@/lib/audit-log"
import { formatDateLocal } from "@/lib/sales-utils"
import { parseJsonField, type PaymentSplit } from "@/lib/json-field"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getApiActor(request)
    if (!actor) {
      return createErrorResponse("No autenticado", 401)
    }
    if (!hasAnyPermission(actor, ["sales.read", "sales.list", "sales.all", "sales"])) {
      return createErrorResponse("Sin permisos para ver ventas", 403)
    }

    const { id } = await params

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        client: true,
        seller: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!sale) {
      return createErrorResponse("Venta no encontrada", 404)
    }

    const transformed = {
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
      paymentMethod: sale.paymentMethod,
      paymentSplits: parseJsonField<PaymentSplit[] | null>(sale.paymentSplits, null) ?? undefined,
      notes: sale.notes || undefined,
      status: sale.status,
      createdAt: formatDateLocal(sale.createdAt),
    }

    return createSuccessResponse(transformed)
  } catch (error) {
    logger.error("Error al obtener venta", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al obtener venta")
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getApiActor(request)
    if (!actor) {
      return createErrorResponse("No autenticado", 401)
    }
    if (!hasAnyPermission(actor, ["sales.update", "sales.all", "sales"])) {
      return createErrorResponse("Sin permisos para editar ventas", 403)
    }

    const { id } = await params
    const body = await request.json()
    const { paymentMethod, paymentSplits, notes, status } = body

    const existingSale = await prisma.sale.findUnique({
      where: { id },
    })

    if (!existingSale) {
      return createErrorResponse("Venta no encontrada", 404)
    }

    // Validar que los splits sumen el total si existen
    if (paymentSplits && Array.isArray(paymentSplits) && paymentSplits.length > 0) {
      const splitsTotal = paymentSplits.reduce(
        (sum: number, split: { amount: string | number }) => sum + Number(split.amount || 0),
        0,
      )
      if (Math.abs(splitsTotal - existingSale.total) > 0.01) {
        return createErrorResponse(
          "La suma de los métodos de pago debe ser igual al total de la venta",
          400,
        )
      }
    }

    const finalPaymentMethod =
      paymentSplits && paymentSplits.length > 0
        ? "mixto"
        : paymentMethod || existingSale.paymentMethod
    const finalPaymentSplits =
      paymentSplits && paymentSplits.length > 0
        ? JSON.stringify(paymentSplits)
        : existingSale.paymentSplits

    const updatedSale = await prisma.sale.update({
      where: { id },
      data: {
        paymentMethod: finalPaymentMethod,
        paymentSplits: finalPaymentSplits,
        notes: notes !== undefined ? notes || null : existingSale.notes,
        ...(status && { status }),
      },
    })

    logAudit({
      action: "UPDATE",
      entity: "sale",
      entityId: updatedSale.id,
      userId: actor.userId,
      changes: {
        paymentMethod: updatedSale.paymentMethod,
        status: updatedSale.status,
        notes: updatedSale.notes,
      },
      metadata: {
        hasSplits: Boolean(updatedSale.paymentSplits),
      },
    }).catch(() => {})

    return createSuccessResponse({
      id: updatedSale.id,
      paymentMethod: updatedSale.paymentMethod,
      paymentSplits:
        parseJsonField<PaymentSplit[] | null>(updatedSale.paymentSplits, null) ?? undefined,
      notes: updatedSale.notes || undefined,
      status: updatedSale.status,
    })
  } catch (error) {
    logger.error("Error al actualizar venta", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al actualizar venta")
  }
}
