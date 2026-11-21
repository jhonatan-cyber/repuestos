import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"
import { CategorySchema } from "@/lib/validations"
import { transformCategoryToAPI } from "@/lib/category-utils"
import { createSuccessResponse, createErrorResponse, handleApiError } from "@/lib/api-utils"
import type { Prisma } from "@prisma/client"
import { CATEGORY_MESSAGES } from "@/lib/constants/messages"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"

export async function GET(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)
    if (!hasAnyPermission(actor, ["products.read", "categories.read", "products", "categories"])) {
      return createErrorResponse("Sin permisos", 403)
    }
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""

    const where: Prisma.CategoryWhereInput = {
      type: "product",
    }

    if (search) {
      const searchFilter = { contains: search, mode: "insensitive" as const }
      where.name = searchFilter
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    })

    // Transform and add products count
    const transformed = categories.map((cat) => ({
      ...transformCategoryToAPI(cat),
      productsCount: cat._count.products,
    }))

    return createSuccessResponse(transformed)
  } catch (error) {
    return handleApiError(error, CATEGORY_MESSAGES.error.fetch)
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)
    if (
      !hasAnyPermission(actor, ["products.create", "categories.create", "products", "categories"])
    ) {
      return createErrorResponse("Sin permisos", 403)
    }
    const body = await request.json()
    const validated = CategorySchema.parse(body)

    const category = await prisma.category.create({
      data: {
        name: validated.name,
        color: validated.color,
        description: validated.description || null,
        type: "product",
      },
    })

    return createSuccessResponse(transformCategoryToAPI(category), 201)
  } catch (error) {
    return handleApiError(error, CATEGORY_MESSAGES.error.create)
  }
}
