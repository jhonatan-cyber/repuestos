import { requireApiActor } from "@/lib/api-security"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { ProductSchema } from "@/lib/validations"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { logger } from "@/lib/logger"
import { z } from "zod"
import { isElectronRuntime } from "@/lib/runtime-env"
import type { Prisma } from "@prisma/client"

async function getProductColumns() {
  if (isElectronRuntime()) {
    const cols = await prisma.$queryRawUnsafe<Array<{ name: string }>>(
      `PRAGMA table_info("products")`,
    )
    return new Set(cols.map((c) => c.name))
  }

  const cols = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(
    `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='products'`,
  )
  return new Set(cols.map((c) => c.column_name))
}

function normalizeSupplierId(rawSupplierId: unknown) {
  const supplierId = String(rawSupplierId ?? "").trim()
  return supplierId || null
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authError } = await requireApiActor(request, [
      "products.update",
      "products.all",
      "products",
    ])
    if (authError) return authError
    const { id } = await params
    const body = await request.json()

    const productColumns = await getProductColumns()
    const hasBrandColumn = productColumns.has("brand")
    const hasModelColumn = productColumns.has("model")

    // Validar datos (tolerante a esquemas legacy sin brand/model)
    const productInputSchema = ProductSchema.extend({
      brand: z.string().optional().default(""),
      model: z.string().optional().default(""),
    })
    const validated = productInputSchema.parse(body)

    // Verificar que el producto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    const normalizedSupplierId = normalizeSupplierId(validated.supplierId)

    const data: Prisma.ProductUpdateInput = {
      code: validated.code,
      name: validated.name,
      description: validated.description ?? null,
      category: { connect: { id: String(validated.categoryId) } },
      purchasePrice: validated.purchasePrice,
      salePrice: validated.salePrice,
      stock: validated.stock,
      minimumStock: validated.minimumStock,
      unit: validated.unit,
      ...(normalizedSupplierId
        ? { supplier: { connect: { id: normalizedSupplierId } } }
        : { supplier: { disconnect: true } }),
      image: validated.image ?? null,
    }
    if (hasBrandColumn) data.brand = validated.brand || "Sin marca"
    if (hasModelColumn) data.model = validated.model || "Sin modelo"

    const product = await prisma.product.update({
      where: { id },
      data,
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        categoryId: true,
        purchasePrice: true,
        salePrice: true,
        stock: true,
        minimumStock: true,
        unit: true,
        supplierId: true,
        image: true,
        createdAt: true,
      },
    })

    const [category, supplier] = await Promise.all([
      prisma.category.findUnique({
        where: { id: product.categoryId },
        select: { name: true },
      }),
      product.supplierId
        ? prisma.supplier.findUnique({
            where: { id: product.supplierId },
            select: { name: true },
          })
        : Promise.resolve(null),
    ])

    const response = {
      id: product.id,
      code: product.code,
      name: product.name,
      description: product.description ?? null,
      category: category?.name ?? "Sin categoria",
      categoryId: product.categoryId,
      purchasePrice: product.purchasePrice,
      salePrice: product.salePrice,
      stock: product.stock,
      minimumStock: product.minimumStock,
      unit: product.unit,
      supplierId: product.supplierId,
      supplierName: supplier?.name ?? "Sin proveedor",
      image: product.image ?? null,
      createdAt: product.createdAt.toISOString(),
    }

    return createSuccessResponse(response)
  } catch (error) {
    logger.error("Error al actualizar producto", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al actualizar producto")
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { error: authError } = await requireApiActor(request, [
      "products.delete",
      "products.all",
      "products",
    ])
    if (authError) return authError
    const { id } = await params

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        saleItems: true,
        purchaseItems: true,
        quotationItems: true,
      },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    const hasAssociations =
      existingProduct.saleItems.length > 0 ||
      existingProduct.purchaseItems.length > 0 ||
      existingProduct.quotationItems.length > 0

    if (hasAssociations) {
      const updatedProduct = await prisma.product.update({
        where: { id },
        data: { isDeleted: true },
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          categoryId: true,
          purchasePrice: true,
          salePrice: true,
          stock: true,
          minimumStock: true,
          unit: true,
          supplierId: true,
          image: true,
          createdAt: true,
          isDeleted: true,
        },
      })

      const [category, supplier] = await Promise.all([
        prisma.category.findUnique({
          where: { id: updatedProduct.categoryId },
          select: { name: true },
        }),
        updatedProduct.supplierId
          ? prisma.supplier.findUnique({
              where: { id: updatedProduct.supplierId },
              select: { name: true },
            })
          : Promise.resolve(null),
      ])

      return createSuccessResponse({
        action: "deactivated",
        product: {
          id: updatedProduct.id,
          code: updatedProduct.code,
          name: updatedProduct.name,
          description: updatedProduct.description ?? null,
          category: category?.name ?? "Sin categoría",
          categoryId: updatedProduct.categoryId,
          purchasePrice: updatedProduct.purchasePrice,
          salePrice: updatedProduct.salePrice,
          stock: updatedProduct.stock,
          minimumStock: updatedProduct.minimumStock,
          unit: updatedProduct.unit,
          supplierId: updatedProduct.supplierId,
          supplierName: supplier?.name ?? "Sin proveedor",
          image: updatedProduct.image ?? null,
          status: updatedProduct.isDeleted ? "inactive" : "active",
          createdAt: updatedProduct.createdAt.toISOString(),
        },
      })
    }

    await prisma.product.delete({
      where: { id },
    })

    return createSuccessResponse({
      action: "deleted",
      success: true,
      message: "Producto eliminado",
    })
  } catch (error) {
    logger.error("Error al eliminar producto", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al eliminar producto")
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authError } = await requireApiActor(request, [
      "products.update",
      "products.all",
      "products",
    ])
    if (authError) return authError
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!["active", "inactive"].includes(status)) {
      return createErrorResponse("Estado inválido", 400)
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        categoryId: true,
        purchasePrice: true,
        salePrice: true,
        stock: true,
        minimumStock: true,
        unit: true,
        supplierId: true,
        createdAt: true,
        image: true,
        isDeleted: true,
      },
    })

    if (!existingProduct) {
      return createErrorResponse("Producto no encontrado", 404)
    }

    await prisma.product.update({
      where: { id },
      data: { isDeleted: status === "inactive" },
    })

    return createSuccessResponse({
      id: existingProduct.id,
      code: existingProduct.code,
      name: existingProduct.name,
      categoryId: existingProduct.categoryId,
      purchasePrice: existingProduct.purchasePrice,
      salePrice: existingProduct.salePrice,
      stock: existingProduct.stock,
      minimumStock: existingProduct.minimumStock,
      unit: existingProduct.unit,
      supplierId: existingProduct.supplierId,
      status: status,
      createdAt: existingProduct.createdAt.toISOString(),
    })
  } catch (error) {
    logger.error("Error al cambiar estado del producto", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al cambiar estado del producto")
  }
}
