import { NextRequest, NextResponse } from "next/server"
import { PermissionSchema } from "@/lib/validations"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { logger } from "@/lib/logger"
import type { Permission } from "@/lib/types"
import { loadCustomPermissions, saveCustomPermissions } from "@/lib/permissions-store"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"

export async function GET(request: NextRequest) {
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
    const customPermissions = await loadCustomPermissions()
    return createSuccessResponse(customPermissions)
  } catch (error) {
    logger.error("Error al obtener permisos", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al obtener permisos")
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)
    if (!hasAnyPermission(actor, ["permissions.create", "permissions.all", "permissions"])) {
      return createErrorResponse("Sin permisos", 403)
    }
    const body = await request.json()

    const validatedData = PermissionSchema.parse(body)

    const customPermissions = await loadCustomPermissions()

    const existingPermission = customPermissions.find((p) => p.id === validatedData.id)
    if (existingPermission) {
      return createErrorResponse("Ya existe un permiso con este ID", 400)
    }

    // Crear nuevo permiso
    const newPermission: Permission = {
      ...validatedData,
      isSystem: false,
      status: validatedData.status || "active",
      rolesCount: 0,
    }

    customPermissions.push(newPermission)
    await saveCustomPermissions(customPermissions)

    return createSuccessResponse(newPermission, 201)
  } catch (error) {
    logger.error("Error al crear permiso", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al crear permiso")
  }
}
