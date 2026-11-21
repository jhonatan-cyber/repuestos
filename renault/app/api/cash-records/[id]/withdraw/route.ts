import { logger } from "@/lib/logger"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"
import { logAudit } from "@/lib/audit-log"
import { createNotification } from "@/lib/notifications"
import { formatDateLocal } from "@/lib/dates"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getApiActor(request)
    if (!actor) {
      return createErrorResponse("No autenticado", 401)
    }
    if (!hasAnyPermission(actor, ["cash.withdraw", "cash.update", "cash.all", "cash"])) {
      return createErrorResponse("Sin permisos para registrar retiros de caja", 403)
    }

    const { id } = await params
    const body = await request.json()
    const amount = Number(body.amount)
    const reason = String(body.reason || "Retiro de caja")
    const userId = body.userId ? String(body.userId) : null

    if (!amount || amount <= 0) {
      return createErrorResponse("El monto del retiro debe ser mayor a 0", 400)
    }

    const record = await prisma.cashRecord.findFirst({
      where: {
        id,
        isDeleted: false,
      },
      include: { user: true },
    })

    if (!record) {
      return createErrorResponse("Caja no encontrada", 404)
    }

    if (record.status !== "open") {
      return createErrorResponse("Solo se puede retirar de una caja abierta", 400)
    }

    const actorUserId = userId || actor.userId || record.userId

    if (!Number.isFinite(amount) || amount <= 0) {
      return createErrorResponse("El monto del retiro debe ser mayor a 0", 400)
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.cashWithdrawal.create({
        data: {
          cashRecordId: record.id,
          userId: actorUserId,
          amount,
          reason,
        },
      })

      await tx.cashRecord.update({
        where: { id },
        data: {
          cashExpenses: { increment: amount },
          closingBalance: { decrement: amount },
        },
      })
    })

    const updated = await prisma.cashRecord.findFirst({
      where: { id },
      include: {
        user: true,
        withdrawals: {
          where: { isDeleted: false },
          orderBy: { createdAt: "desc" },
          include: { user: true },
        },
      },
    })

    if (!updated) {
      return createErrorResponse("Caja no encontrada", 404)
    }

    logAudit({
      action: "UPDATE",
      entity: "cashRecord",
      entityId: updated.id,
      userId: actor.userId,
      changes: {
        cashExpenses: updated.cashExpenses,
        closingBalance: updated.closingBalance,
      },
      metadata: {
        withdrawalAmount: amount,
        withdrawalReason: reason,
        withdrawalUserId: actorUserId,
      },
    }).catch(() => {})

    createNotification({
      type: "warning",
      title: "Retiro de caja",
      message: `Se registró retiro por Bs ${amount.toFixed(2)}. Motivo: ${reason}.`,
      entity: "cashRecord",
      entityId: updated.id,
      url: "/cash",
      metadata: { withdrawalUserId: actorUserId },
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
      withdrawals: updated.withdrawals.map(
        (w: {
          id: string
          amount: number
          reason: string | null
          createdAt: Date
          userId: string
          user: { firstName: string; lastName: string }
        }) => ({
          id: w.id,
          amount: w.amount,
          reason: w.reason,
          createdAt: w.createdAt.toISOString(),
          userId: w.userId,
          userName: `${w.user.firstName} ${w.user.lastName}`,
        }),
      ),
    })
  } catch (error) {
    logger.error("Error al crear retiro de caja", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al crear retiro de caja")
  }
}
