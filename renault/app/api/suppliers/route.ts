import { NextRequest, NextResponse } from "next/server"
import { SupplierSchema } from "@/lib/validations"
import { prisma } from "@/lib/prisma"
import {
  createErrorResponse,
  createSuccessResponse,
  handleApiError,
  getPaginationParams,
  buildPaginatedResponse,
} from "@/lib/api-utils"
import { logger } from "@/lib/logger"
import { formatDateLocal } from "@/lib/dates"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"

export async function GET(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)
    if (
      !hasAnyPermission(actor, ["suppliers.read", "suppliers.list", "suppliers.all", "suppliers"])
    ) {
      return createErrorResponse("Sin permisos para ver proveedores", 403)
    }
    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = getPaginationParams(searchParams)
    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where: { isDeleted: false },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.supplier.count({ where: { isDeleted: false } }),
    ])

    return createSuccessResponse(
      buildPaginatedResponse(
        suppliers.map((supplier) => ({
          id: supplier.id,
          name: supplier.name,
          company: supplier.company,
          phone: supplier.phone,
          direccion: supplier.address,
          address: supplier.address,
          totalPurchases: supplier.totalPurchases,
          status: supplier.isDeleted ? ("inactive" as const) : ("active" as const),
          createdAt: formatDateLocal(supplier.createdAt),
        })),
        total,
        page,
        limit,
      ),
    )
  } catch (error) {
    logger.error("Error al obtener proveedores", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al obtener proveedores")
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)
    if (!hasAnyPermission(actor, ["suppliers.create", "suppliers.all", "suppliers"])) {
      return createErrorResponse("Sin permisos para crear proveedores", 403)
    }
    const body = await request.json()
    const validatedData = SupplierSchema.parse(body)

    const newSupplier = await prisma.supplier.create({
      data: {
        name: validatedData.name,
        company: validatedData.company || null,
        phone: validatedData.phone,
        address: validatedData.address || validatedData.direccion || null,
        totalPurchases: 0,
      },
    })

    return createSuccessResponse(
      {
        id: newSupplier.id,
        name: newSupplier.name,
        company: newSupplier.company,
        phone: newSupplier.phone,
        direccion: newSupplier.address,
        address: newSupplier.address,
        totalPurchases: newSupplier.totalPurchases,
        status: "active" as const,
        createdAt: formatDateLocal(newSupplier.createdAt),
      },
      201,
    )
  } catch (error) {
    logger.error("Error al crear proveedor", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al crear proveedor")
  }
}
