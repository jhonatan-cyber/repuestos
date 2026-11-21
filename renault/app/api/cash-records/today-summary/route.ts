import { logger } from "@/lib/logger"
import { prisma } from "@/lib/prisma"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"
import { NextRequest, NextResponse } from "next/server"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { formatDateLocal } from "@/lib/dates"

export async function GET(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) {
      return createErrorResponse("No autenticado", 401)
    }
    if (!hasAnyPermission(actor, ["cash.read", "cash.list", "cash.summary", "cash.all", "cash"])) {
      return createErrorResponse("Sin permisos para ver resumen de caja", 403)
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const openCash = await prisma.cashRecord.findFirst({
      where: {
        status: "open",
        isDeleted: false,
      },
      orderBy: { date: "desc" },
    })

    if (!openCash) {
      return createSuccessResponse({
        date: formatDateLocal(today),
        openingBalance: 0,
        cashIncome: 0,
        cashExpenses: 0,
        expectedClosingBalance: 0,
        salesCount: 0,
        expensesCount: 0,
      })
    }

    const salesCount = await prisma.sale.count({
      where: {
        date: { gte: openCash.date },
        status: "completada",
        paymentMethod: "efectivo",
      },
    })

    const expensesCount = await prisma.expense.count({
      where: {
        date: { gte: openCash.date },
        isDeleted: false,
      },
    })

    return createSuccessResponse({
      date: formatDateLocal(openCash.date),
      openingBalance: openCash.openingBalance,
      cashIncome: openCash.cashIncome,
      cashExpenses: openCash.cashExpenses,
      expectedClosingBalance: openCash.closingBalance,
      salesCount,
      expensesCount,
    })
  } catch (error) {
    logger.error("Error al obtener resumen del día", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al obtener resumen del día")
  }
}
