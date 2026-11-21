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
    // Mobile clients send the refresh token in the body or as Bearer; web uses cookie.
    let refreshToken = request.cookies.get("refresh_token")?.value
    if (!refreshToken) {
      try {
        const body = await request.json().catch(() => ({}))
        refreshToken = body?.refreshToken
      } catch {
        // ignore
      }
    }
    if (!refreshToken) {
      const authHeader = request.headers.get("authorization")
      if (authHeader && /^Bearer\s+/i.test(authHeader)) {
        refreshToken = authHeader.replace(/^Bearer\s+/i, "").trim()
      }
    }

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
