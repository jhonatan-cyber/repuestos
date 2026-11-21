import { NextRequest, NextResponse } from "next/server"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { logger } from "@/lib/logger"
import { loadCustomPermissions, saveCustomPermissions } from "@/lib/permissions-store"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)
    if (!hasAnyPermission(actor, ["permissions.update", "permissions.all", "permissions"])) {
      return createErrorResponse("Sin permisos", 403)
    }
    const { id } = await params
    const body = await request.json()
    const { status } = body

    const customPermissions = await loadCustomPermissions()

    if (!["active", "inactive"].includes(status)) {
      return createErrorResponse("Estado inválido", 400)
    }

    const permissionIndex = customPermissions.findIndex((p) => p.id === id)

    if (permissionIndex === -1) {
      return createErrorResponse("Permiso no encontrado", 404)
    }

    const permission = customPermissions[permissionIndex]

    if (permission.isSystem) {
      return createErrorResponse("No se puede cambiar el estado de permisos del sistema", 400)
    }

    customPermissions[permissionIndex] = {
      ...permission,
      status,
    }
    await saveCustomPermissions(customPermissions)

    return createSuccessResponse(customPermissions[permissionIndex])
  } catch (error) {
    logger.error("Error al cambiar estado del permiso", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al cambiar estado del permiso")
  }
}
