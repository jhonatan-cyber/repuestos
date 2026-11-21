import { logger } from "@/lib/logger"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"
import { formatDateLocal } from "@/lib/dates"

function normalizeMethod(method: string) {
  const m = method.toLowerCase().trim()
  if (m === "efectivo") return "efectivo"
  if (m === "transferencia") return "transferencia"
  if (m === "credito" || m === "crédito") return "credito"
  if (m === "qr") return "qr"
  return m
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getApiActor(request)
    if (!actor) {
      return createErrorResponse("No autenticado", 401)
    }
    if (!hasAnyPermission(actor, ["cash.read", "cash.list", "cash.summary", "cash.all", "cash"])) {
      return createErrorResponse("Sin permisos para ver resumen de cierre de caja", 403)
    }

    const { id } = await params

    const record = await prisma.cashRecord.findFirst({
      where: { id, isDeleted: false },
    })

    if (!record) {
      return createErrorResponse("Caja no encontrada", 404)
    }

    const start = new Date(record.date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)

    const sales = await prisma.sale.findMany({
      where: {
        date: { gte: start, lt: end },
        status: "completada",
        isDeleted: false,
      },
      select: {
        paymentMethod: true,
        total: true,
      },
    })

    const withdrawals = await prisma.cashWithdrawal.findMany({
      where: {
        cashRecordId: id,
        isDeleted: false,
      },
      select: { amount: true },
    })

    const paymentMethods = {
      efectivo: 0,
      transferencia: 0,
      credito: 0,
      qr: 0,
      otros: 0,
    }

    for (const sale of sales) {
      const key = normalizeMethod(sale.paymentMethod)
      if (key === "efectivo") paymentMethods.efectivo += sale.total
      else if (key === "transferencia") paymentMethods.transferencia += sale.total
      else if (key === "credito") paymentMethods.credito += sale.total
      else if (key === "qr") paymentMethods.qr += sale.total
      else paymentMethods.otros += sale.total
    }

    const withdrawalsTotal = withdrawals.reduce(
      (sum: number, w: { amount: number }) => sum + w.amount,
      0,
    )
    const expectedCashInBox = record.openingBalance + paymentMethods.efectivo - record.cashExpenses

    return createSuccessResponse({
      cashRecordId: record.id,
      date: formatDateLocal(start),
      openingBalance: record.openingBalance,
      registeredCashIncome: record.cashIncome,
      registeredCashExpenses: record.cashExpenses,
      paymentMethods,
      withdrawalsTotal,
      expectedCashInBox,
      expectedClosingBalance: expectedCashInBox,
    })
  } catch (error) {
    logger.error("Error al obtener resumen de cierre de caja", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al obtener resumen de cierre de caja")
  }
}
