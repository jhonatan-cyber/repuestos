import { logger } from "@/lib/logger"
import { type NextRequest, NextResponse } from "next/server"
import { verifyAccessToken } from "@/lib/auth/tokens"
import { prisma } from "@/lib/prisma"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { z } from "zod"
import bcrypt from "bcryptjs"

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es requerida"),
  newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
})

/**
 * POST /api/auth/change-password
 * Cambia la contraseña del usuario autenticado.
 */
export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value
    if (!accessToken) {
      return createErrorResponse("No autenticado", 401)
    }

    const payload = await verifyAccessToken(accessToken)
    if (!payload) {
      return createErrorResponse("Token inválido o expirado", 401)
    }

    const userId = payload.sub

    const body = await request.json()
    const { currentPassword, newPassword } = ChangePasswordSchema.parse(body)

    // Verificar usuario
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return createErrorResponse("Usuario no encontrado", 404)
    }

    // Verificar contraseña actual
    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) {
      return createErrorResponse("La contraseña actual es incorrecta", 400)
    }

    // Actualizar contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    return createSuccessResponse({
      success: true,
      message: "Contraseña actualizada correctamente",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(error.issues[0].message, 400)
    }
    logger.error("Error al cambiar contraseña", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al cambiar contraseña")
  }
}
