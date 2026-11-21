import { logger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)
    if (!hasAnyPermission(actor, ["sales.update", "sales", "cash.update", "cash"])) {
      return createErrorResponse("Sin permisos para registrar cobros", 403)
    }

    const { id } = await params
    const body = await request.json()
    const amount = Number(body.amount || 0)
    const paymentMethod = String(body.paymentMethod || "efectivo")
    const allowedMethods = ["efectivo", "transferencia", "qr", "tarjeta"]

    if (!Number.isFinite(amount) || amount <= 0) return createErrorResponse("Monto inválido", 400)
    if (!allowedMethods.includes(paymentMethod))
      return createErrorResponse("Método de pago inválido", 400)

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const credit = await tx.credit.findUnique({ where: { id } })
      if (!credit || credit.isDeleted) throw new Error("Crédito no encontrado")
      if (credit.balance <= 0) throw new Error("El crédito ya está pagado")

      const applied = Math.min(amount, credit.balance)
      await tx.creditPayment.create({
        data: {
          creditId: id,
          amount: applied,
          paymentMethod,
          reference: body.reference ? String(body.reference) : null,
          notes: body.notes ? String(body.notes) : null,
        },
      })

      const newBalance = credit.balance - applied
      await tx.credit.update({
        where: { id },
        data: {
          balance: newBalance,
          status: newBalance <= 0 ? "paid" : credit.dueDate < new Date() ? "overdue" : "pending",
        },
      })

      const openCash = await tx.cashRecord.findFirst({
        where: { status: "open", isDeleted: false },
      })
      if (openCash) {
        await tx.cashRecord.update({
          where: { id: openCash.id },
          data: { cashIncome: { increment: applied }, closingBalance: { increment: applied } },
        })
      }

      return { applied, remaining: newBalance }
    })

    return createSuccessResponse(result)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "No se pudo registrar cobro"
    logger.error("Error al registrar cobro", { error: msg })
    return createErrorResponse(msg, 500)
  }
}
