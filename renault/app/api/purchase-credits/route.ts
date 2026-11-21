import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { logger } from "@/lib/logger"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"

export async function GET(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)
    if (
      !hasAnyPermission(actor, ["purchases.read", "purchases.list", "purchases", "reports.read"])
    ) {
      return createErrorResponse("Sin permisos para ver deudas de compras", 403)
    }

    const rows = await prisma.purchaseCredit.findMany({
      where: { isDeleted: false },
      include: {
        supplier: { select: { id: true, name: true, phone: true } },
        purchase: {
          select: {
            id: true,
            date: true,
            createdAt: true,
            subtotal: true,
            tax: true,
            total: true,
            paymentMethod: true,
            status: true,
            buyer: { select: { firstName: true, lastName: true } },
            items: {
              where: { isDeleted: false },
              select: {
                quantity: true,
                price: true,
                product: { select: { name: true, brand: true, model: true } },
              },
            },
          },
        },
        payments: { where: { isDeleted: false }, orderBy: { date: "desc" } },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    })

    return createSuccessResponse(rows)
  } catch (error) {
    logger.error("Error al listar deudas de compras", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "No se pudo listar deudas de compras")
  }
}
