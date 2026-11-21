import { requireApiActor } from "@/lib/api-security"
import { NextRequest, NextResponse } from "next/server"
import { SupplierSchema } from "@/lib/validations"
import { prisma } from "@/lib/prisma"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { logger } from "@/lib/logger"
import { formatDateLocal } from "@/lib/dates"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authError } = await requireApiActor(request, [
      "suppliers.read",
      "suppliers.all",
      "suppliers",
      "suppliers.list",
    ])
    if (authError) return authError
    const { id } = await params
    const supplier = await prisma.supplier.findFirst({
      where: { id, isDeleted: false },
    })

    if (!supplier) {
      return createErrorResponse("Proveedor no encontrado", 404)
    }

    return createSuccessResponse({
      id: supplier.id,
      name: supplier.name,
      company: supplier.company,
      phone: supplier.phone,
      direccion: supplier.address,
      address: supplier.address,
      totalPurchases: supplier.totalPurchases,
      status: "active" as const,
      createdAt: formatDateLocal(supplier.createdAt),
    })
  } catch (error) {
    logger.error("Error al obtener proveedor", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al obtener proveedor")
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authError } = await requireApiActor(request, [
      "suppliers.update",
      "suppliers.all",
      "suppliers",
    ])
    if (authError) return authError
    const { id } = await params
    const body = await request.json()
    const validatedData = SupplierSchema.parse(body)

    const existing = await prisma.supplier.findFirst({ where: { id, isDeleted: false } })
    if (!existing) {
      return createErrorResponse("Proveedor no encontrado", 404)
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: validatedData.name,
        company: validatedData.company || null,
        phone: validatedData.phone,
        address: validatedData.address || validatedData.direccion || null,
      },
    })

    return createSuccessResponse({
      id: supplier.id,
      name: supplier.name,
      company: supplier.company,
      phone: supplier.phone,
      direccion: supplier.address,
      address: supplier.address,
      totalPurchases: supplier.totalPurchases,
      status: "active" as const,
      createdAt: formatDateLocal(supplier.createdAt),
    })
  } catch (error) {
    logger.error("Error al actualizar proveedor", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al actualizar proveedor")
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { error: authError } = await requireApiActor(request, [
      "suppliers.delete",
      "suppliers.all",
      "suppliers",
    ])
    if (authError) return authError
    const { id } = await params
    const existing = await prisma.supplier.findFirst({ where: { id, isDeleted: false } })

    if (!existing) {
      return createErrorResponse("Proveedor no encontrado", 404)
    }

    const [productsCount, purchasesCount, purchaseCreditsCount] = await Promise.all([
      prisma.product.count({ where: { supplierId: id } }),
      prisma.purchase.count({ where: { supplierId: id } }),
      prisma.purchaseCredit.count({ where: { supplierId: id } }),
    ])

    if (productsCount > 0 || purchasesCount > 0 || purchaseCreditsCount > 0) {
      const updated = await prisma.supplier.update({
        where: { id },
        data: { isDeleted: true },
      })

      return createSuccessResponse({
        action: "deactivated",
        supplier: {
          id: updated.id,
          name: updated.name,
          company: updated.company,
          phone: updated.phone,
          direccion: updated.address,
          address: updated.address,
          totalPurchases: updated.totalPurchases,
          status: "inactive" as const,
          createdAt: formatDateLocal(updated.createdAt),
        },
      })
    }

    await prisma.supplier.delete({
      where: { id },
    })

    return createSuccessResponse({ action: "deleted", message: "Proveedor eliminado exitosamente" })
  } catch (error) {
    logger.error("Error al eliminar proveedor", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al eliminar proveedor")
  }
}
