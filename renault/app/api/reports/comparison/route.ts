import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"
import { logger } from "@/lib/logger"
import { parseDateStartLocal, formatDateLocal } from "@/lib/sales-utils"

function getPreviousPeriod(
  startDate?: string | null,
  endDate?: string | null,
): { startDate: string; endDate: string } | null {
  if (!startDate || !endDate) {
    return null
  }

  const start = parseDateStartLocal(startDate)
  const end = parseDateStartLocal(endDate)
  const diffTime = end.getTime() - start.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  const prevEnd = new Date(start)
  prevEnd.setDate(prevEnd.getDate() - 1)
  const prevStart = new Date(prevEnd)
  prevStart.setDate(prevStart.getDate() - diffDays)

  return {
    startDate: formatDateLocal(prevStart),
    endDate: formatDateLocal(prevEnd),
  }
}

function buildDateFilter(startDate?: string | null, endDate?: string | null) {
  if (!startDate && !endDate) {
    return undefined
  }

  const dateRange: { gte?: Date; lte?: Date } = {}
  if (startDate) {
    dateRange.gte = parseDateStartLocal(startDate)
  }
  if (endDate) {
    const end = parseDateStartLocal(endDate)
    end.setHours(23, 59, 59, 999)
    dateRange.lte = end
  }

  return dateRange
}

export async function GET(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)
    if (!hasAnyPermission(actor, ["reports.read", "reports", "dashboard.read", "dashboard"])) {
      return createErrorResponse("Sin permisos", 403)
    }
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const previousPeriod = getPreviousPeriod(startDate, endDate)

    if (!previousPeriod) {
      return createSuccessResponse({
        totalSales: 0,
        totalPurchases: 0,
        totalExpenses: 0,
        netProfit: 0,
      })
    }

    const previousDateFilter = buildDateFilter(previousPeriod.startDate, previousPeriod.endDate)

    const [sales, purchases, expenses] = await Promise.all([
      prisma.sale.findMany({
        where: previousDateFilter ? { date: previousDateFilter } : undefined,
        select: { total: true },
      }),
      prisma.purchase.findMany({
        where: previousDateFilter ? { date: previousDateFilter } : undefined,
        select: { total: true },
      }),
      prisma.expense.findMany({
        where: previousDateFilter ? { date: previousDateFilter } : undefined,
        select: { amount: true },
      }),
    ])

    const totalSales = sales.reduce((sum, s) => sum + s.total, 0)
    const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    const netProfit = totalSales - totalPurchases - totalExpenses

    return createSuccessResponse({
      totalSales,
      totalPurchases,
      totalExpenses,
      netProfit,
      period: previousPeriod,
    })
  } catch (error) {
    logger.error("Error al obtener estadísticas comparativas", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al obtener estadísticas comparativas")
  }
}
