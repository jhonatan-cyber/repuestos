import { NextRequest, NextResponse } from "next/server"
import { PermissionSchema } from "@/lib/validations"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { logger } from "@/lib/logger"
import { loadCustomPermissions, saveCustomPermissions } from "@/lib/permissions-store"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)
    if (
      !hasAnyPermission(actor, [
        "permissions.read",
        "permissions.all",
        "permissions",
        "roles",
        "roles.read",
      ])
    ) {
      return createErrorResponse("Sin permisos", 403)
    }
    const { id } = await params

    const customPermissions = await loadCustomPermissions()
    const permission = customPermissions.find((p) => p.id === id)

    if (!permission) {
      return createErrorResponse("Permiso no encontrado", 404)
    }

    return createSuccessResponse(permission)
  } catch (error) {
    logger.error("Error al obtener permiso", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al obtener permiso")
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)
    if (!hasAnyPermission(actor, ["permissions.update", "permissions.all", "permissions"])) {
      return createErrorResponse("Sin permisos", 403)
    }
    const { id } = await params
    const body = await request.json()

    // Validar datos
    const validatedData = PermissionSchema.parse(body)

    const customPermissions = await loadCustomPermissions()

    // Buscar permiso existente
    const permissionIndex = customPermissions.findIndex((p) => p.id === id)

    if (permissionIndex === -1) {
      return createErrorResponse("Permiso no encontrado", 404)
    }

    // Actualizar permiso
    const updatedPermission = {
      ...customPermissions[permissionIndex],
      ...validatedData,
      isSystem: false, // Los permisos personalizados nunca son del sistema
    }

    customPermissions[permissionIndex] = updatedPermission
    await saveCustomPermissions(customPermissions)

    return createSuccessResponse(updatedPermission)
  } catch (error) {
    logger.error("Error al actualizar permiso", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al actualizar permiso")
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)
    if (!hasAnyPermission(actor, ["permissions.delete", "permissions.all", "permissions"])) {
      return createErrorResponse("Sin permisos", 403)
    }
    const { id } = await params

    const customPermissions = await loadCustomPermissions()

    // Buscar permiso
    const permissionIndex = customPermissions.findIndex((p) => p.id === id)

    if (permissionIndex === -1) {
      return createErrorResponse("Permiso no encontrado", 404)
    }

    const permission = customPermissions[permissionIndex]

    // Verificar si es un permiso del sistema
    if (permission.isSystem) {
      return createErrorResponse("No se pueden eliminar permisos del sistema", 400)
    }

    if (permission.rolesCount && permission.rolesCount > 0) {
      return createErrorResponse(
        `No se puede eliminar el permiso porque está asignado a ${permission.rolesCount} rol(es)`,
        400,
      )
    }

    customPermissions.splice(permissionIndex, 1)
    await saveCustomPermissions(customPermissions)

    return createSuccessResponse({ message: "Permiso eliminado correctamente" })
  } catch (error) {
    logger.error("Error al eliminar permiso", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al eliminar permiso")
  }
}
