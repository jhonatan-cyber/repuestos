import { requireApiActor } from "@/lib/api-security"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { logger } from "@/lib/logger"
import { formatDateLocal } from "@/lib/dates"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authError } = await requireApiActor(request, [
      "suppliers.update",
      "suppliers.all",
      "suppliers",
    ])
    if (authError) return authError
    const { id } = await params
    const supplier = await prisma.supplier.findUnique({ where: { id } })

    if (!supplier) {
      return createErrorResponse("Proveedor no encontrado", 404)
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: { isDeleted: !supplier.isDeleted },
    })

    return createSuccessResponse({
      id: updated.id,
      name: updated.name,
      company: updated.company,
      phone: updated.phone,
      direccion: updated.address,
      address: updated.address,
      totalPurchases: updated.totalPurchases,
      status: updated.isDeleted ? "inactive" : "active",
      createdAt: formatDateLocal(updated.createdAt),
    })
  } catch (error) {
    logger.error("Error al cambiar estado del proveedor", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al cambiar estado del proveedor")
  }
}
