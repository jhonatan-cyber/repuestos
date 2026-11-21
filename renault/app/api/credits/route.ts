import { logger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"

export async function GET(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)
    if (!hasAnyPermission(actor, ["sales.read", "sales.list", "sales", "reports.read"])) {
      return createErrorResponse("Sin permisos para ver créditos de venta", 403)
    }

    const rows = await prisma.credit.findMany({
      where: { isDeleted: false },
      include: {
        client: { select: { id: true, name: true, phone: true } },
        sale: {
          select: {
            id: true,
            date: true,
            createdAt: true,
            subtotal: true,
            tax: true,
            discount: true,
            total: true,
            paymentMethod: true,
            paymentSplits: true,
            notes: true,
            status: true,
            seller: { select: { firstName: true, lastName: true } },
            items: {
              where: { isDeleted: false },
              select: {
                quantity: true,
                price: true,
                subtotal: true,
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
    logger.error("Error al obtener créditos", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "No se pudo listar créditos")
  }
}
