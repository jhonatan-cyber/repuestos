import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { logger } from "@/lib/logger"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)
    if (!hasAnyPermission(actor, ["purchases.update", "purchases", "cash.update", "cash"])) {
      return createErrorResponse("Sin permisos para pagar deudas de compras", 403)
    }

    const { id } = await params
    const body = await request.json()
    const amount = Number(body.amount || 0)
    const paymentMethod = String(body.paymentMethod || "efectivo")
    const allowed = ["efectivo", "transferencia", "qr", "tarjeta"]

    if (!Number.isFinite(amount) || amount <= 0) return createErrorResponse("Monto inválido", 400)
    if (!allowed.includes(paymentMethod)) return createErrorResponse("Método de pago inválido", 400)

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const credit = await tx.purchaseCredit.findUnique({ where: { id } })
      if (!credit || credit.isDeleted) throw new Error("Deuda no encontrada")
      if (credit.balance <= 0) throw new Error("La deuda ya está pagada")

      const applied = Math.min(amount, credit.balance)
      await tx.purchaseCreditPayment.create({
        data: {
          purchaseCreditId: id,
          amount: applied,
          paymentMethod,
          reference: body.reference ? String(body.reference) : null,
          notes: body.notes ? String(body.notes) : null,
        },
      })

      const newBalance = credit.balance - applied
      await tx.purchaseCredit.update({
        where: { id },
        data: {
          balance: newBalance,
          status: newBalance <= 0 ? "paid" : credit.dueDate < new Date() ? "overdue" : "pending",
        },
      })

      // El pago a proveedor es un egreso de caja (antes no se registraba: descuadre)
      const openCash = await tx.cashRecord.findFirst({
        where: { status: "open", isDeleted: false },
        orderBy: { updatedAt: "desc" },
      })
      if (openCash) {
        await tx.cashRecord.update({
          where: { id: openCash.id },
          data: { cashExpenses: { increment: applied }, closingBalance: { decrement: applied } },
        })
      }

      return { applied, remaining: newBalance }
    })

    return createSuccessResponse(result)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "No se pudo registrar pago"
    logger.error("Error al registrar pago", { error: msg })
    return createErrorResponse(msg, 500)
  }
}
