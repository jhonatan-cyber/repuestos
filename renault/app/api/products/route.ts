import { logger } from "@/lib/logger"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { ProductSchema } from "@/lib/validations"
import {
  createErrorResponse,
  createSuccessResponse,
  handleApiError,
  getPaginationParams,
} from "@/lib/api-utils"
import { z } from "zod"
import { isElectronRuntime } from "@/lib/runtime-env"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"
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

export async function GET(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)
    if (!hasAnyPermission(actor, ["products.read", "products.list", "products.all", "products"])) {
      return createErrorResponse("Sin permisos para ver productos", 403)
    }
    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = getPaginationParams(searchParams)
    const search = searchParams.get("search") || ""
    const categoryId = searchParams.get("categoryId")
    const supplierId = searchParams.get("supplierId")
    const lowStock = searchParams.get("lowStock") === "true"
    const productColumns = await getProductColumns()
    const hasBrandColumn = productColumns.has("brand")
    const hasModelColumn = productColumns.has("model")
    const where: Prisma.ProductWhereInput = { isDeleted: false }

    if (search) {
      const searchFilter = { contains: search, mode: "insensitive" as const }
      const orFilters: Prisma.ProductWhereInput[] = [{ name: searchFilter }, { code: searchFilter }]
      if (hasBrandColumn) {
        orFilters.push({ brand: searchFilter })
      }
      if (hasModelColumn) {
        orFilters.push({ model: searchFilter })
      }
      where.OR = orFilters
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (supplierId) {
      where.supplierId = supplierId
    }

    let products = []
    let total = 0

    if (lowStock) {
      const allProducts = await prisma.product.findMany({
        where,
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
          ...(hasBrandColumn ? { brand: true } : {}),
          ...(hasModelColumn ? { model: true } : {}),
          isDeleted: true,
        },
        orderBy: { createdAt: "desc" },
      })

      const filteredProducts = allProducts.filter(
        (product: { stock: number; minimumStock: number }) => product.stock <= product.minimumStock,
      )

      total = filteredProducts.length
      products = filteredProducts.slice(skip, skip + limit)
    } else {
      ;[products, total] = await Promise.all([
        prisma.product.findMany({
          where,
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
            ...(hasBrandColumn ? { brand: true } : {}),
            ...(hasModelColumn ? { model: true } : {}),
            isDeleted: true,
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.product.count({ where }),
      ])
    }

    const categoryIds = Array.from(
      new Set(products.map((p) => p.categoryId).filter((id): id is string => id != null)),
    )
    const supplierIds = Array.from(
      new Set(products.map((p) => p.supplierId).filter((id): id is string => id != null)),
    )

    const [categories, suppliers] = await Promise.all([
      categoryIds.length
        ? prisma.category.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true },
          })
        : [],
      supplierIds.length
        ? prisma.supplier.findMany({
            where: { id: { in: supplierIds } },
            select: { id: true, name: true },
          })
        : [],
    ])

    const categoryById = new Map(categories.map((c) => [c.id, c.name]))
    const supplierById = new Map(suppliers.map((s) => [s.id, s.name]))
    const transformed = products.map((product) => ({
      id: product.id,
      code: product.code,
      name: product.name,
      description: product.description ?? null,
      brand: product.brand ?? "",
      model: product.model ?? "",
      category: categoryById.get(product.categoryId) ?? "Sin categoría",
      categoryId: product.categoryId,
      purchasePrice: product.purchasePrice,
      salePrice: product.salePrice,
      stock: product.stock,
      minimumStock: product.minimumStock,
      unit: product.unit,
      supplierId: product.supplierId ?? null,
      supplierName: supplierById.get(product.supplierId ?? "") ?? "Sin proveedor",
      image: product.image ?? null,
      status: product.isDeleted ? "inactive" : "active",
      createdAt: product.createdAt.toISOString(),
    }))

    return createSuccessResponse({
      data: transformed,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error("Error al obtener productos", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al obtener productos")
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)
    if (!hasAnyPermission(actor, ["products.create", "products.all", "products"])) {
      return createErrorResponse("Sin permisos para crear productos", 403)
    }
    const body = await request.json()
    const productColumns = await getProductColumns()
    const hasBrandColumn = productColumns.has("brand")
    const hasModelColumn = productColumns.has("model")
    const productInputSchema = ProductSchema.extend({
      brand: z.string().optional().default(""),
      model: z.string().optional().default(""),
    })
    const validated = productInputSchema.parse(body)

    const normalizedSupplierId = normalizeSupplierId(validated.supplierId)

    const data: Prisma.ProductCreateInput = {
      code: validated.code,
      name: validated.name,
      description: validated.description ?? null,
      category: { connect: { id: String(validated.categoryId) } },
      purchasePrice: validated.purchasePrice,
      salePrice: validated.salePrice,
      stock: validated.stock,
      minimumStock: validated.minimumStock,
      unit: validated.unit,
      ...(normalizedSupplierId ? { supplier: { connect: { id: normalizedSupplierId } } } : {}),
      image: validated.image ?? null,
      brand: "",
      model: "",
    }
    if (hasBrandColumn) data.brand = validated.brand || "Sin marca"
    if (hasModelColumn) data.model = validated.model || "Sin modelo"
    data.isDeleted = false

    const product = await prisma.product.create({ data })
    return createSuccessResponse(product, 201)
  } catch (error) {
    logger.error("Error al crear producto", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al crear producto")
  }
}
