/**
 * Get current authenticated user from access token
 */

import { logger } from "@/lib/logger"
import { type NextRequest, NextResponse } from "next/server"
import { verifyAccessToken } from "@/lib/auth/tokens"
import { getAccessTokenFromRequest } from "@/lib/auth/request-token"
import { prisma } from "@/lib/prisma"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const accessToken = getAccessTokenFromRequest(request)

    if (!accessToken) {
      return createErrorResponse("No autenticado", 401)
    }

    // Verify access token
    const payload = await verifyAccessToken(accessToken)

    if (!payload) {
      return createErrorResponse("Token inválido o expirado", 401)
    }

    // Fetch user from database to get fresh data
    // FIX: role is a String field, not a relation in schema
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    })

    if (!user) {
      return createErrorResponse("Usuario no encontrado", 401)
    }

    if (user.status !== "active") {
      return createErrorResponse("Cuenta de usuario inactiva", 403)
    }

    // Return user with permissions from the JWT token payload
    // These are the canonical permissions for this session
    const permissions = (payload.permissions as string[]) || []

    return createSuccessResponse({
      id: user.id.toString(),
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      permissions: permissions,
      image: user.image || null,
    })
  } catch (error) {
    logger.error("Error al obtener usuario actual", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al obtener usuario actual")
  }
}
