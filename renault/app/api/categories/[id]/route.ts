import { requireApiActor } from "@/lib/api-security"
import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"
import { CategorySchema } from "@/lib/validations"
import { transformCategoryToAPI } from "@/lib/category-utils"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import type { Prisma } from "@prisma/client"
import { CATEGORY_MESSAGES } from "@/lib/constants/messages"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authError } = await requireApiActor(request, [
      "categories.read",
      "categories.all",
      "categories",
      "categories.list",
      "products.read",
      "products.all",
      "products",
    ])
    if (authError) return authError
    const { id } = await params

    const category = await prisma.category.findUnique({
      where: { id },
    })

    if (!category) {
      return createErrorResponse(CATEGORY_MESSAGES.error.notFound, 404)
    }

    return createSuccessResponse(transformCategoryToAPI(category))
  } catch (error) {
    return handleApiError(error, CATEGORY_MESSAGES.error.fetch)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authError } = await requireApiActor(request, [
      "categories.update",
      "categories.all",
      "categories",
      "products.update",
      "products.all",
      "products",
    ])
    if (authError) return authError
    const { id } = await params
    const body = await request.json()

    // Partial validation for PATCH
    const validated = CategorySchema.partial().parse(body)

    // Handle status toggle if provided
    let updateData: Prisma.CategoryUpdateInput = {}
    let newStatus: string | null = null

    // Only spread valid Prisma fields
    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.color !== undefined) updateData.color = validated.color
    if (validated.description !== undefined) updateData.description = validated.description

    if (body.status) {
      newStatus = body.status
      // If deactivating, we need to also deactivate associated items
      if (body.status === "inactive") {
        // First get category to know its name (for expenses) and id (for products)
        const currentCategory = await prisma.category.findUnique({
          where: { id },
          select: { id: true, name: true },
        })

        if (currentCategory) {
          // Deactivate products with this categoryId
          await prisma.product.updateMany({
            where: { categoryId: currentCategory.id },
            data: { isDeleted: true },
          })

          // Deactivate expenses with matching category name
          await prisma.expense.updateMany({
            where: { category: currentCategory.name },
            data: { isDeleted: true },
          })
        }
      }

      // Then update the category status
      updateData.isDeleted = body.status === "inactive"
    }

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    })

    return createSuccessResponse(transformCategoryToAPI(category))
  } catch (error) {
    return handleApiError(error, CATEGORY_MESSAGES.error.update)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { error: authError } = await requireApiActor(request, [
      "categories.delete",
      "categories.all",
      "categories",
      "products.delete",
      "products.all",
      "products",
    ])
    if (authError) return authError
    const { id } = await params

    const category = await prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        type: true,
        isDeleted: true,
        color: true,
        description: true,
        updatedAt: true,
        lastSyncedAt: true,
      },
    })

    if (!category) {
      return createErrorResponse(CATEGORY_MESSAGES.error.notFound, 404)
    }

    const productsCount = await prisma.product.count({
      where: { categoryId: id },
    })

    if (productsCount > 0) {
      await prisma.$transaction([
        prisma.category.update({
          where: { id },
          data: { isDeleted: true },
        }),
        prisma.product.updateMany({
          where: { categoryId: id },
          data: { isDeleted: true },
        }),
      ])

      return createSuccessResponse({
        action: "deactivated",
        category: {
          ...transformCategoryToAPI(category),
          status: "inactive" as const,
        },
      })
    }

    await prisma.category.delete({
      where: { id },
    })

    return createSuccessResponse({ action: "deleted" })
  } catch (error) {
    return handleApiError(error, CATEGORY_MESSAGES.error.delete)
  }
}
