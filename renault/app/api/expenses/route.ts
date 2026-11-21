import { logger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"
import { ExpenseSchema } from "@/lib/validations"
import { hasOpenCashRecord } from "@/lib/cash-guard"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
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
import { parseDateStartLocal, parseDateEndLocal, formatDateLocal } from "@/lib/dates"

export async function GET(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)
    if (!hasAnyPermission(actor, ["expenses.read", "expenses.list", "expenses.all", "expenses"])) {
      return createErrorResponse("Sin permisos para ver gastos", 403)
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const { page, limit, skip } = getPaginationParams(searchParams)

    const where: Prisma.ExpenseWhereInput = { isDeleted: false }
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = parseDateStartLocal(startDate)
      if (endDate) where.date.lte = parseDateEndLocal(endDate)
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({ where, orderBy: { date: "desc" }, skip, take: limit }),
      prisma.expense.count({ where }),
    ])

    return createSuccessResponse(
      buildPaginatedResponse(
        expenses.map((expense) => ({
          id: expense.id,
          name: expense.notes || expense.description,
          amount: expense.amount,
          description: expense.description,
          category: expense.category,
          date: formatDateLocal(expense.date),
          createdAt: expense.createdAt.toISOString(),
        })),
        total,
        page,
        limit,
      ),
    )
  } catch (error) {
    logger.error("Error al obtener gastos", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al obtener gastos")
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)
    if (!hasAnyPermission(actor, ["expenses.create", "expenses.all", "expenses"])) {
      return createErrorResponse("Sin permisos para registrar gastos", 403)
    }

    const hasOpenCash = await hasOpenCashRecord()
    if (!hasOpenCash) {
      return createErrorResponse(
        "No hay una caja abierta. Debes abrir caja antes de registrar transacciones.",
        400,
      )
    }

    const body = await request.json()
    const validatedData = ExpenseSchema.parse(body)

    const normalizedDate =
      typeof validatedData.date === "string"
        ? parseDateStartLocal(validatedData.date)
        : validatedData.date

    const amount = Number(validatedData.amount || 0)

    const createdExpense = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const openCash = await tx.cashRecord.findFirst({
        where: { status: "open", isDeleted: false },
        orderBy: { date: "desc" },
      })

      const responsibleUserId = actor.userId || openCash?.userId
      if (!responsibleUserId) {
        throw new Error("No se pudo resolver el usuario responsable para registrar el gasto")
      }

      const expense = await tx.expense.create({
        data: {
          date: normalizedDate,
          description: validatedData.description || validatedData.name,
          amount,
          category: validatedData.category || "General",
          responsibleUserId,
          notes: validatedData.name || null,
        },
      })

      if (openCash) {
        await tx.cashRecord.update({
          where: { id: openCash.id },
          data: {
            cashExpenses: { increment: amount },
            closingBalance: { decrement: amount },
          },
        })
      }

      return expense
    })

    logAudit({
      action: "CREATE",
      entity: "expense",
      entityId: createdExpense.id,
      userId: actor.userId,
      changes: {
        amount: createdExpense.amount,
        category: createdExpense.category,
        date: createdExpense.date.toISOString(),
      },
    }).catch(() => {})

    const highExpenseThreshold = Number(process.env.HIGH_EXPENSE_THRESHOLD || 1000)
    createNotification({
      type: createdExpense.amount >= highExpenseThreshold ? "warning" : "info",
      title:
        createdExpense.amount >= highExpenseThreshold
          ? "Gasto alto registrado"
          : "Gasto registrado",
      message:
        createdExpense.amount >= highExpenseThreshold
          ? `Se registró un gasto alto de Bs ${createdExpense.amount.toFixed(2)} en ${createdExpense.category}.`
          : `Se registró un gasto de Bs ${createdExpense.amount.toFixed(2)} en ${createdExpense.category}.`,
      entity: "expense",
      entityId: createdExpense.id,
      url: "/expenses",
    }).catch(() => {})

    return createSuccessResponse(
      {
        id: createdExpense.id,
        name: createdExpense.notes || createdExpense.description,
        amount: createdExpense.amount,
        description: createdExpense.description,
        category: createdExpense.category,
        date: formatDateLocal(createdExpense.date),
        createdAt: createdExpense.createdAt.toISOString(),
      },
      201,
    )
  } catch (error) {
    logger.error("Error al crear gasto", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al crear gasto")
  }
}
