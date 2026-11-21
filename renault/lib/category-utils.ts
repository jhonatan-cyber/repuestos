import type { Prisma } from "@prisma/client"
import type { Category } from "@/lib/types"

export function isValidCategory(category: Category): boolean {
  return category.id !== undefined && category.id !== null
}

export function filterValidCategories(categories: Category[]): Category[] {
  return (categories || []).filter(isValidCategory)
}

export function transformCategoryToAPI(category: Prisma.CategoryGetPayload<{}>): Category {
  return {
    id: category.id,
    name: category.name,
    color: category.color,
    description: category.description,
    type: (category.type as "product" | "expense") || "product",
    status: category.isDeleted ? "inactive" : "active",
  }
}
