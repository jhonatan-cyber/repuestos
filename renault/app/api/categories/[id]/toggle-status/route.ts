import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiActor } from "@/lib/api-security"
import { createErrorResponse, handleApiError } from "@/lib/api-utils"
import { PATCH as updateCategory } from "../route"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireApiActor(request, [
      "categories.update",
      "categories.all",
      "categories",
      "products.update",
      "products.all",
      "products",
    ])
    if (error) return error
    const { id } = await params
    const category = await prisma.category.findUnique({
      where: { id },
      select: { isDeleted: true },
    })
    if (!category) return createErrorResponse("Categoría no encontrada", 404)
    return updateCategory(
      new NextRequest(request.url, {
        method: "PATCH",
        headers: request.headers,
        body: JSON.stringify({ status: category.isDeleted ? "active" : "inactive" }),
      }),
      { params: Promise.resolve({ id }) },
    )
  } catch (error) {
    return handleApiError(error, "Error al cambiar estado de categoría")
  }
}
