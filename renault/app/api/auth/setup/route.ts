import { logger } from "@/lib/logger"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    // 1. Verificación de seguridad: ¿Ya hay usuarios?
    const userCount = await prisma.user.count()
    if (userCount > 0) {
      return createErrorResponse("El sistema ya ha sido configurado previamente", 403)
    }

    // 2. Obtener datos del cuerpo
    const body = await req.json()
    const { ci, firstName, lastName, email, password } = body

    if (!ci || !firstName || !lastName || !email || !password) {
      return createErrorResponse(
        "Todos los campos son obligatorios (CI, Nombre, Apellido, Email, Contraseña)",
        400,
      )
    }

    if (String(password).length < 8) {
      return createErrorResponse("La contraseña debe tener al menos 8 caracteres", 400)
    }

    // 3. Crear el Rol Administrador si no existe
    // Usamos el nombre exacto "Administrador" para coincidir con role-utils.ts
    let adminRole = await prisma.role.findUnique({
      where: { name: "Administrador" },
    })

    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: {
          name: "Administrador",
          description: "Acceso total al sistema",
          permissions: JSON.stringify(["*"]), // Wildcard para todos los permisos
          color: "#EF4444", // Rojo admin
          isSystem: true,
          status: "active",
        },
      })
    }

    // 4. Hashear la contraseña provista (nunca CI ni defaults)
    const hashedPassword = await bcrypt.hash(String(password), 12)

    // 5. Crear el Primer Usuario
    const newUser = await prisma.user.create({
      data: {
        ci,
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: "Administrador",
        address: "Configuración Inicial", // Campos requeridos en schema
        phone: "00000000",
        status: "active",
      },
    })

    return createSuccessResponse({
      success: true,
      message: "Sistema configurado correctamente",
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
    })
  } catch (error) {
    logger.error("Error fatal durante la configuración inicial", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error fatal durante la configuración inicial")
  }
}
