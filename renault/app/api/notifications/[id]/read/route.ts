import { logger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { getApiActor } from "@/lib/api-security"
import { markNotificationAsRead } from "@/lib/notifications"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)

    const { id } = await params
    await markNotificationAsRead(actor.userId, id)

    return createSuccessResponse({ ok: true })
  } catch (error) {
    logger.error("Error al marcar notificación como leída", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "No se pudo actualizar notificación")
  }
}
