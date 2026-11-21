/**
 * Logout endpoint
 * Clears authentication cookies
 */

import { type NextRequest, NextResponse } from "next/server"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { logger } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    // Create response
    const response = createSuccessResponse({ message: "Logged out successfully" })

    // Clear access token cookie
    response.cookies.set("access_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0, // Expire immediately
    })

    // Clear refresh token cookie
    response.cookies.set("refresh_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0, // Expire immediately
    })

    return response
  } catch (error) {
    logger.error("Error al cerrar sesión", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al cerrar sesión")
  }
}
