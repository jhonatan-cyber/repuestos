import { NextRequest, NextResponse } from "next/server"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { logger } from "@/lib/logger"
import { getApiActor } from "@/lib/api-security"
import {
  getUnreadNotificationsCount,
  listNotifications,
  markAllNotificationsAsRead,
} from "@/lib/notifications"

export async function GET(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)

    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get("limit") || "12")
    const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(50, limit)) : 12

    const [items, unread] = await Promise.all([
      listNotifications(actor.userId, safeLimit),
      getUnreadNotificationsCount(actor.userId),
    ])

    return createSuccessResponse({ items, unread })
  } catch (error) {
    logger.error("Error al cargar notificaciones", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "No se pudieron cargar notificaciones")
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)

    await markAllNotificationsAsRead(actor.userId)
    return createSuccessResponse({ ok: true })
  } catch (error) {
    logger.error("Error al actualizar notificaciones", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "No se pudieron actualizar notificaciones")
  }
}
