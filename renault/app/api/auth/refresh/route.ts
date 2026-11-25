/**
 * Refresh Token endpoint
 * Exchanges valid refresh token for new access + refresh tokens
 */

import { type NextRequest, NextResponse } from "next/server"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { logger } from "@/lib/logger"
import { RATE_LIMITS, checkRateLimit, getClientKey } from "@/lib/rate-limit"
import { applySessionCookies, refreshSessionFromToken } from "@/lib/auth/session"

export async function POST(request: NextRequest) {
  try {
    const rl = checkRateLimit(
      `refresh:${getClientKey(request)}`,
      RATE_LIMITS.auth.limit,
      RATE_LIMITS.auth.windowMs,
    )
    if (!rl.allowed) {
      return createErrorResponse("Demasiadas solicitudes, intentá más tarde", 429)
    }
    const refreshCookie = request.cookies.get("refresh_token")?.value
    const body = refreshCookie ? null : await request.json().catch(() => null)
    const bodyRefreshToken =
      body && typeof body === "object" && "refreshToken" in body
        ? (body as { refreshToken?: unknown }).refreshToken
        : undefined
    const refreshToken =
      refreshCookie ?? (typeof bodyRefreshToken === "string" ? bodyRefreshToken : undefined)

    if (!refreshToken) {
      return createErrorResponse("Refresh token requerido", 401)
    }

    const session = await refreshSessionFromToken(refreshToken)

    if (!session) {
      return createErrorResponse("Token de refresco inválido o expirado", 401)
    }

    const response = createSuccessResponse({
      ...session.user,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    })
    applySessionCookies(response, session.accessToken, session.refreshToken, session.rememberMe)

    return response
  } catch (error) {
    logger.error("Error al refrescar token", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al refrescar token")
  }
}
