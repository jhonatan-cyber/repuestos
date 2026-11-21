import { logger } from "@/lib/logger"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"
import { logAudit } from "@/lib/audit-log"
import { createNotification } from "@/lib/notifications"
import { formatDateLocal } from "@/lib/dates"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getApiActor(request)
    if (!actor) {
      return createErrorResponse("No autenticado", 401)
    }
    if (!hasAnyPermission(actor, ["cash.close", "cash.update", "cash.all", "cash"])) {
      return createErrorResponse("Sin permisos para cerrar caja", 403)
    }

    const { id } = await params
    const body = await request.json()
    const { cashIncome, cashExpenses, notes } = body

    const record = await prisma.cashRecord.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    })

    if (!record) {
      return createErrorResponse("Caja no encontrada", 404)
    }

    if (record.status !== "open") {
      return createErrorResponse("La caja ya está cerrada", 400)
    }

    const finalIncome = cashIncome !== undefined ? Number(cashIncome) : record.cashIncome
    const finalExpenses = cashExpenses !== undefined ? Number(cashExpenses) : record.cashExpenses
    const finalClosing = record.openingBalance + finalIncome - finalExpenses

    const updated = await prisma.cashRecord.update({
      where: { id },
      data: {
        cashIncome: finalIncome,
        cashExpenses: finalExpenses,
        closingBalance: finalClosing,
        notes: notes ?? record.notes,
        status: "closed",
        closedAt: new Date(),
      },
      include: { user: true },
    })

    logAudit({
      action: "UPDATE",
      entity: "cashRecord",
      entityId: updated.id,
      userId: actor.userId,
      changes: {
        status: updated.status,
        cashIncome: updated.cashIncome,
        cashExpenses: updated.cashExpenses,
        closingBalance: updated.closingBalance,
      },
      metadata: {
        closedAt: updated.closedAt?.toISOString(),
      },
    }).catch(() => {})

    createNotification({
      type: "success",
      title: "Caja cerrada",
      message: `Caja cerrada con saldo final Bs ${updated.closingBalance.toFixed(2)}.`,
      entity: "cashRecord",
      entityId: updated.id,
      url: "/cash",
      metadata: { cashIncome: updated.cashIncome, cashExpenses: updated.cashExpenses },
    }).catch(() => {})

    return createSuccessResponse({
      id: updated.id,
      date: formatDateLocal(updated.date),
      openingBalance: updated.openingBalance,
      cashIncome: updated.cashIncome,
      cashExpenses: updated.cashExpenses,
      closingBalance: updated.closingBalance,
      notes: updated.notes,
      userId: updated.userId,
      userName: `${updated.user.firstName} ${updated.user.lastName}`,
      status: updated.status,
      closedAt: updated.closedAt ? updated.closedAt.toISOString() : null,
    })
  } catch (error) {
    logger.error("Error al cerrar caja", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al cerrar caja")
  }
}
