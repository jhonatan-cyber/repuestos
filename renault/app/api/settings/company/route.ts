import { logger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"
import { createErrorResponse, createSuccessResponse } from "@/lib/api-utils"
import { getSettings, updateSettings } from "@/lib/settings"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"

export async function GET() {
  try {
    const settings = await getSettings()
    return createSuccessResponse(settings)
  } catch (error) {
    logger.error("[api/settings/company] Error", {
      error: error instanceof Error ? error.message : error,
    })
    return createErrorResponse("Error al obtener configuración", 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)
    if (!hasAnyPermission(actor, ["admin", "settings"])) {
      return createErrorResponse("Sin permisos", 403)
    }

    const body = await request.json()
    const settings = await updateSettings(body)
    return createSuccessResponse(settings)
  } catch (error) {
    logger.error("[api/settings/company] Error", {
      error: error instanceof Error ? error.message : error,
    })
    return createErrorResponse("Error al guardar configuración", 500)
  }
}
