import { logger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { RATE_LIMITS, checkRateLimit, getClientKey } from "@/lib/rate-limit"
import bcrypt from "bcryptjs"

/**
 * POST /api/auth/forgot-password
 * Genera una contraseña temporal aleatoria (no predecible) y la devuelve una sola vez
 * para que el administrador la comunique por un canal seguro. El usuario debe cambiarla.
 */
export async function POST(request: NextRequest) {
  try {
    const rl = checkRateLimit(
      `forgot:${getClientKey(request)}`,
      RATE_LIMITS.auth.limit,
      RATE_LIMITS.auth.windowMs,
    )
    if (!rl.allowed) return createErrorResponse("Demasiadas solicitudes, intentá más tarde", 429)
    const { email } = await request.json()

    if (!email) {
      return createErrorResponse("El correo es requerido", 400)
    }

    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user) {
      return createErrorResponse("No se encontró un usuario con ese correo", 404)
    }

    // Contraseña temporal aleatoria (12 chars url-safe) — nunca CI ni defaults
    const { randomBytes } = await import("crypto")
    const tempPassword = randomBytes(9).toString("base64url")
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    logger.warn("Password temporal generado", { userId: user.id })

    return createSuccessResponse({
      success: true,
      message:
        "Se generó una contraseña temporal. Comunicala por un canal seguro y pedí su cambio inmediato.",
      tempPassword,
    })
  } catch (error) {
    logger.error("Error al resetear la contraseña", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al resetear la contraseña")
  }
}
