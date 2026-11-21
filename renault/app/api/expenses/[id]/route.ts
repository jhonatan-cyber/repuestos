import { requireApiActor } from "@/lib/api-security"
import { logger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"
import { ExpenseSchema } from "@/lib/validations"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { parseDateStartLocal, formatDateLocal } from "@/lib/dates"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authError } = await requireApiActor(request, [
      "expenses.read",
      "expenses.all",
      "expenses",
      "expenses.list",
    ])
    if (authError) return authError
    const { id } = await params
    const expense = await prisma.expense.findFirst({
      where: { id, isDeleted: false },
    })

    if (!expense) {
      return createErrorResponse("Gasto no encontrado", 404)
    }

    return createSuccessResponse({
      id: expense.id,
      name: expense.notes || expense.description,
      amount: expense.amount,
      description: expense.description,
      category: expense.category,
      date: formatDateLocal(expense.date),
      createdAt: expense.createdAt.toISOString(),
    })
  } catch (error) {
    logger.error("Error al obtener gasto", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al obtener gasto")
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authError } = await requireApiActor(request, [
      "expenses.update",
      "expenses.all",
      "expenses",
    ])
    if (authError) return authError
    const { id } = await params
    const body = await request.json()
    const validatedData = ExpenseSchema.parse(body)

    const current = await prisma.expense.findFirst({
      where: { id, isDeleted: false },
    })

    if (!current) {
      return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 })
    }

    const normalizedDate =
      typeof validatedData.date === "string"
        ? parseDateStartLocal(validatedData.date)
        : validatedData.date

    const newAmount = Number(validatedData.amount || 0)
    const amountDiff = newAmount - current.amount

    const updatedExpense = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const expense = await tx.expense.update({
        where: { id },
        data: {
          date: normalizedDate,
          description: validatedData.description || validatedData.name,
          amount: newAmount,
          category: validatedData.category || "General",
          notes: validatedData.name || null,
        },
      })

      if (amountDiff !== 0) {
        const openCash = await tx.cashRecord.findFirst({
          where: { status: "open", isDeleted: false },
        })

        if (openCash) {
          const newCashExpenses = Math.max(0, openCash.cashExpenses + amountDiff)
          const newClosingBalance = openCash.openingBalance + openCash.cashIncome - newCashExpenses
          await tx.cashRecord.update({
            where: { id: openCash.id },
            data: {
              cashExpenses: newCashExpenses,
              closingBalance: newClosingBalance,
            },
          })
        }
      }

      return expense
    })

    return createSuccessResponse({
      id: updatedExpense.id,
      name: updatedExpense.notes || updatedExpense.description,
      amount: updatedExpense.amount,
      description: updatedExpense.description,
      category: updatedExpense.category,
      date: formatDateLocal(updatedExpense.date),
      createdAt: updatedExpense.createdAt.toISOString(),
    })
  } catch (error) {
    logger.error("Error al actualizar gasto", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al actualizar gasto")
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { error: authError } = await requireApiActor(request, [
      "expenses.delete",
      "expenses.all",
      "expenses",
    ])
    if (authError) return authError
    const { id } = await params

    const current = await prisma.expense.findFirst({
      where: { id, isDeleted: false },
    })

    if (!current) {
      return createErrorResponse("Gasto no encontrado", 404)
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.expense.update({
        where: { id },
        data: { isDeleted: true },
      })

      const openCash = await tx.cashRecord.findFirst({
        where: { status: "open", isDeleted: false },
      })

      if (openCash) {
        const newCashExpenses = Math.max(0, openCash.cashExpenses - current.amount)
        const newClosingBalance = openCash.openingBalance + openCash.cashIncome - newCashExpenses
        await tx.cashRecord.update({
          where: { id: openCash.id },
          data: {
            cashExpenses: newCashExpenses,
            closingBalance: newClosingBalance,
          },
        })
      }
    })

    return createSuccessResponse({ message: "Gasto eliminado exitosamente" })
  } catch (error) {
    logger.error("Error al eliminar gasto", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al eliminar gasto")
  }
}
