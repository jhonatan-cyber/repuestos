import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Verificar si existen usuarios y roles
    const [userCount, roleCount] = await Promise.all([prisma.user.count(), prisma.role.count()])

    logger.info(`[SETUP_CHECK] Usuarios: ${userCount}, Roles: ${roleCount}`)

    // El sistema necesita setup si no hay usuarios o no hay roles
    const needsSetup = userCount === 0 || roleCount === 0

    return createSuccessResponse({
      needsSetup,
      message: needsSetup
        ? "El sistema requiere configuración inicial"
        : "El sistema ya está configurado",
    })
  } catch (error) {
    logger.error("Error al verificar el estado del sistema", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al verificar el estado del sistema")
  }
}
