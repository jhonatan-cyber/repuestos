import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { logger } from "@/lib/logger"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"
import { logAudit } from "@/lib/audit-log"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getApiActor(request)
    if (!actor) {
      return createErrorResponse("No autenticado", 401)
    }
    if (!hasAnyPermission(actor, ["sales.cancel", "sales.update", "sales.all", "sales"])) {
      return createErrorResponse("Sin permisos para anular ventas", 403)
    }

    const { id } = await params

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        items: true,
      },
    })

    if (!sale) {
      return createErrorResponse("Venta no encontrada", 404)
    }

    if (sale.status === "cancelada") {
      return createErrorResponse("La venta ya está anulada", 400)
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Reversar caja de forma atómica para cualquier venta que movió efectivo:
      // contado total o crédito con pago inicial. Antes solo "efectivo".
      if (sale.status === "completada") {
        const credit = await tx.credit.findUnique({
          where: { saleId: sale.id },
          select: { id: true, total: true },
        })
        const cashIncomeFromSale = credit ? Math.max(sale.total - credit.total, 0) : sale.total
        if (cashIncomeFromSale > 0) {
          const openCash = await tx.cashRecord.findFirst({
            where: { status: "open", isDeleted: false },
            orderBy: { updatedAt: "desc" },
          })
          if (openCash) {
            await tx.cashRecord.update({
              where: { id: openCash.id },
              data: {
                cashIncome: { decrement: cashIncomeFromSale },
                closingBalance: { decrement: cashIncomeFromSale },
              },
            })
          }
        }
        // Anular el crédito asociado para que no quede deuda de una venta cancelada
        if (credit) {
          await tx.credit.update({
            where: { id: credit.id },
            data: { status: "cancelled", balance: 0 },
          })
        }
      }

      await tx.sale.update({
        where: { id: sale.id },
        data: { status: "cancelada" },
      })

      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        })
      }
    })

    logAudit({
      action: "UPDATE",
      entity: "sale",
      entityId: sale.id,
      userId: actor.userId,
      changes: {
        status: "cancelada",
      },
      metadata: {
        previousStatus: sale.status,
        restoredItems: sale.items.length,
        total: sale.total,
      },
    }).catch(() => {})

    return createSuccessResponse({ ok: true })
  } catch (error) {
    logger.error("Error al anular venta", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "No se pudo anular la venta")
  }
}
