import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { logger } from "@/lib/logger"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"
import { formatDateLocal } from "@/lib/dates"

export async function GET(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)
    if (!hasAnyPermission(actor, ["reports.read", "cash.read", "dashboard", "reports", "cash"])) {
      return createErrorResponse("Sin permisos para ver resumen operativo", 403)
    }

    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)

    const openCashPromise = prisma.cashRecord.findFirst({
      where: { status: "open", isDeleted: false },
      orderBy: { date: "desc" },
    })
    const lowStockPromise = prisma.product.count({ where: { isDeleted: false, stock: { lte: 0 } } })
    const todaySalesPromise = prisma.sale.aggregate({
      _sum: { total: true },
      where: { isDeleted: false, status: "completada", date: { gte: todayStart } },
    })
    const todayExpensesPromise = prisma.expense.aggregate({
      _sum: { amount: true },
      where: { isDeleted: false, date: { gte: todayStart } },
    })
    const overdueCreditsPromise = prisma.credit
      .count({
        where: { status: { in: ["pending", "overdue"] }, dueDate: { lt: now }, isDeleted: false },
      })
      .catch(() => 0)

    const [openCash, overdueCredits, lowStockProducts, todaySales, todayExpenses] =
      await Promise.all([
        openCashPromise,
        overdueCreditsPromise,
        lowStockPromise,
        todaySalesPromise,
        todayExpensesPromise,
      ])

    return createSuccessResponse({
      date: formatDateLocal(todayStart),
      cash: {
        isOpen: Boolean(openCash),
        openingBalance: openCash?.openingBalance || 0,
        currentCashIncome: openCash?.cashIncome || 0,
        currentCashExpenses: openCash?.cashExpenses || 0,
        expectedClosingBalance: openCash?.closingBalance || 0,
      },
      risks: {
        overdueCredits,
        outOfStockProducts: lowStockProducts,
      },
      today: {
        salesTotal: todaySales._sum.total || 0,
        expensesTotal: todayExpenses._sum.amount || 0,
      },
    })
  } catch (error) {
    logger.error("Error al obtener resumen operativo", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "No se pudo obtener resumen operativo")
  }
}
