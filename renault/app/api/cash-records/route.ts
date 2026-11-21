import { logger } from "@/lib/logger"
import { prisma } from "@/lib/prisma"
import { type NextRequest, NextResponse } from "next/server"
import {
  createErrorResponse,
  createSuccessResponse,
  handleApiError,
  getPaginationParams,
  buildPaginatedResponse,
} from "@/lib/api-utils"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"
import { logAudit } from "@/lib/audit-log"
import { createNotification } from "@/lib/notifications"
import { formatDateLocal } from "@/lib/dates"
export async function GET(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) {
      return createErrorResponse("No autenticado", 401)
    }
    if (!hasAnyPermission(actor, ["cash.read", "cash.list", "cash.all", "cash"])) {
      return createErrorResponse("Sin permisos para ver caja", 403)
    }

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = getPaginationParams(searchParams)
    const [cashRecords, total] = await Promise.all([
      prisma.cashRecord.findMany({
        where: { isDeleted: false },
        include: {
          user: true,
          withdrawals: {
            where: { isDeleted: false },
            orderBy: { createdAt: "desc" },
            include: { user: true },
          },
        },
        orderBy: [{ status: "asc" }, { date: "desc" }, { updatedAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.cashRecord.count({ where: { isDeleted: false } }),
    ])

    const transformed = cashRecords.map(
      (record: {
        id: string
        date: Date
        openingBalance: number
        cashIncome: number
        cashExpenses: number
        closingBalance: number
        notes: string | null
        userId: string
        user: { firstName: string; lastName: string }
        status: string
        closedAt: Date | null
        withdrawals: {
          id: string
          amount: number
          reason: string | null
          createdAt: Date
          userId: string
          user: { firstName: string; lastName: string }
        }[]
      }) => ({
        id: record.id,
        date: formatDateLocal(record.date),
        openingBalance: record.openingBalance,
        cashIncome: record.cashIncome,
        cashExpenses: record.cashExpenses,
        closingBalance: record.closingBalance,
        notes: record.notes,
        userId: record.userId,
        userName: `${record.user.firstName} ${record.user.lastName}`,
        status: record.status as "open" | "closed",
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
      }),
    )

    return createSuccessResponse(buildPaginatedResponse(transformed, total, page, limit))
  } catch (error) {
    logger.error("Error al obtener registros de caja", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al obtener registros de caja")
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) {
      return createErrorResponse("No autenticado", 401)
    }
    if (!hasAnyPermission(actor, ["cash.open", "cash.create", "cash.all", "cash"])) {
      return createErrorResponse("Sin permisos para abrir caja", 403)
    }

    const body = await request.json()
    const { date, openingBalance, notes } = body

    if (!date || openingBalance === undefined) {
      return createErrorResponse("Faltan campos requeridos", 400)
    }
    if (!Number.isFinite(Number(openingBalance)) || Number(openingBalance) < 0) {
      return createErrorResponse("Saldo inicial inválido", 400)
    }
    if (Number.isNaN(new Date(date).getTime())) {
      return createErrorResponse("Fecha inválida", 400)
    }

    const cashRecord = await prisma.$transaction(async (tx) => {
      const existing = await tx.cashRecord.findFirst({
        where: { status: "open", isDeleted: false },
        orderBy: { updatedAt: "desc" },
        select: { id: true },
      })
      if (existing) {
        throw new Error("OPEN_CASH_EXISTS")
      }
      return tx.cashRecord.create({
        data: {
          date: new Date(date),
          openingBalance: parseFloat(openingBalance),
          cashIncome: 0,
          cashExpenses: 0,
          closingBalance: parseFloat(openingBalance),
          notes: notes || null,
          userId: actor.userId,
          status: "open",
        },
        include: {
          user: true,
          withdrawals: true,
        },
      })
    })

    const response = createSuccessResponse(
      {
        id: cashRecord.id,
        date: formatDateLocal(cashRecord.date),
        openingBalance: cashRecord.openingBalance,
        cashIncome: cashRecord.cashIncome,
        cashExpenses: cashRecord.cashExpenses,
        closingBalance: cashRecord.closingBalance,
        notes: cashRecord.notes,
        userId: cashRecord.userId,
        userName: `${cashRecord.user.firstName} ${cashRecord.user.lastName}`,
        status: cashRecord.status,
        closedAt: cashRecord.closedAt,
        withdrawals: [],
      },
      201,
    )

    logAudit({
      action: "CREATE",
      entity: "cashRecord",
      entityId: cashRecord.id,
      userId: actor.userId,
      changes: {
        openingBalance: cashRecord.openingBalance,
        status: cashRecord.status,
      },
      metadata: {
        date,
      },
    }).catch(() => {})

    createNotification({
      type: "info",
      title: "Caja abierta",
      message: `Se abrió caja con saldo inicial Bs ${cashRecord.openingBalance.toFixed(2)}.`,
      entity: "cashRecord",
      entityId: cashRecord.id,
      url: "/cash",
    }).catch(() => {})

    return response
  } catch (error) {
    if (error instanceof Error && error.message === "OPEN_CASH_EXISTS") {
      return createErrorResponse(
        "Ya existe una caja abierta. Debes cerrarla antes de abrir una nueva.",
        409,
      )
    }
    logger.error("Error al crear registro de caja", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al crear registro de caja")
  }
}
