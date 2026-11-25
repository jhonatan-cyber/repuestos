import { logger } from "@/lib/logger"
import { type NextRequest, NextResponse } from "next/server"
import { verifyAccessToken } from "@/lib/auth/tokens"
import { getAccessTokenFromRequest } from "@/lib/auth/request-token"
import { prisma } from "@/lib/prisma"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { z } from "zod"

const ProfileSchema = z.object({
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  ci: z.string().min(6, "El CI debe tener al menos 6 caracteres"),
  phone: z.string().min(7, "El teléfono debe tener al menos 7 caracteres"),
  address: z.string().min(5, "La dirección debe tener al menos 5 caracteres"),
  email: z.string().email("Email inválido"),
})

/**
 * PUT /api/auth/profile
 * Actualiza el perfil del usuario autenticado.
 */
export async function PUT(request: NextRequest) {
  try {
    const accessToken = getAccessTokenFromRequest(request)
    if (!accessToken) {
      return createErrorResponse("No autenticado", 401)
    }

    const payload = await verifyAccessToken(accessToken)
    if (!payload) {
      return createErrorResponse("Token inválido o expirado", 401)
    }

    const userId = payload.sub

    const body = await request.json()
    const validated = ProfileSchema.parse(body)

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!existingUser) {
      return createErrorResponse("Usuario no encontrado", 404)
    }

    // Verificar CI duplicado
    if (validated.ci !== existingUser.ci) {
      const ciExists = await prisma.user.findUnique({ where: { ci: validated.ci } })
      if (ciExists) {
        return createErrorResponse("El CI ya está registrado por otro usuario", 400)
      }
    }

    // Verificar email duplicado
    if (validated.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({ where: { email: validated.email } })
      if (emailExists) {
        return createErrorResponse("El email ya está registrado por otro usuario", 400)
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: validated.firstName,
        lastName: validated.lastName,
        ci: validated.ci,
        phone: validated.phone,
        address: validated.address,
        email: validated.email,
      },
    })

    return createSuccessResponse({
      success: true,
      message: "Perfil actualizado correctamente",
      user: {
        id: updatedUser.id,
        ci: updatedUser.ci,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        role: updatedUser.role,
        status: updatedUser.status,
        image: updatedUser.image,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(error.issues[0].message, 400)
    }
    logger.error("Error al actualizar perfil", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al actualizar perfil")
  }
}
