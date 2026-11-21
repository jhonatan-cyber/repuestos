import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"
import type { Prisma } from "@prisma/client"
import { formatDateLocal, parseDateStartLocal, parseDateEndLocal } from "@/lib/dates"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"

export async function GET(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) {
      return createErrorResponse("No autenticado", 401)
    }
    if (
      !hasAnyPermission(actor, [
        "quotations.read",
        "quotations.list",
        "quotations.all",
        "quotations",
      ])
    ) {
      return createErrorResponse("Sin permisos", 403)
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: Prisma.SupplierRequestWhereInput = {
      isDeleted: false,
      quotation: { isDeleted: false },
    }
    if (startDate || endDate) {
      where.sentAt = {}
      if (startDate) where.sentAt.gte = parseDateStartLocal(startDate)
      if (endDate) where.sentAt.lte = parseDateEndLocal(endDate)
    }

    const requests = await prisma.supplierRequest.findMany({
      where,
      include: {
        supplier: { select: { name: true } },
        quotation: {
          select: {
            date: true,
            externalClientName: true,
            total: true,
            status: true,
            items: {
              where: { isDeleted: false },
              include: {
                product: {
                  select: { id: true, code: true, name: true, description: true, image: true },
                },
              },
              orderBy: { product: { name: "asc" } },
            },
          },
        },
      },
      orderBy: { sentAt: "desc" },
    })

    return createSuccessResponse(
      requests.map((r) => ({
        id: r.id,
        quotationId: r.quotationId,
        supplierId: r.supplierId,
        supplierName: r.supplier.name,
        status: r.status,
        sentAt: r.sentAt.toISOString(),
        respondedAt: r.respondedAt?.toISOString() ?? null,
        notes: r.notes,
        response: r.response,
        updatedAt: r.updatedAt.toISOString(),
        quotation: {
          date: formatDateLocal(r.quotation.date),
          clientName: r.quotation.externalClientName ?? "Solicitud a proveedores",
          total: r.quotation.total,
          status: r.quotation.status,
        },
        products: r.quotation.items.map((qi) => ({
          id: qi.product.id,
          code: qi.product.code,
          name: qi.product.name,
          description: qi.product.description,
          image: qi.product.image,
          quantity: qi.quantity,
        })),
      })),
    )
  } catch (error) {
    return handleApiError(error, "Error al obtener solicitudes a proveedores")
  }
}
