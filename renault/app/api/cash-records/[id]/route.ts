import { logger } from "@/lib/logger"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"
import { formatDateLocal } from "@/lib/dates"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getApiActor(request)
    if (!actor) {
      return createErrorResponse("No autenticado", 401)
    }
    if (!hasAnyPermission(actor, ["cash.read", "cash.list", "cash.all", "cash"])) {
      return createErrorResponse("Sin permisos para ver caja", 403)
    }

    const { id } = await params

    const record = await prisma.cashRecord.findFirst({
      where: {
        id,
        isDeleted: false,
      },
      include: {
        user: true,
        withdrawals: {
          where: { isDeleted: false },
          orderBy: { createdAt: "desc" },
          include: { user: true },
        },
      },
    })

    if (!record) {
      return createErrorResponse("Caja no encontrada", 404)
    }

    return createSuccessResponse({
      id: record.id,
      date: formatDateLocal(record.date),
      openingBalance: record.openingBalance,
      cashIncome: record.cashIncome,
      cashExpenses: record.cashExpenses,
      closingBalance: record.closingBalance,
      notes: record.notes,
      userId: record.userId,
      userName: `${record.user.firstName} ${record.user.lastName}`,
      status: record.status,
      closedAt: record.closedAt ? record.closedAt.toISOString() : null,
      withdrawals: record.withdrawals.map(
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
    logger.error("Error al obtener detalle de caja", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al obtener detalle de caja")
  }
}
