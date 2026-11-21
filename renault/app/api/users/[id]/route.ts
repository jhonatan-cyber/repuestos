import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { UserSchema } from "@/lib/validations"
import { transformUserToAPI } from "@/lib/user-utils"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import type { Prisma } from "@prisma/client"
import { USER_MESSAGES } from "@/lib/constants/messages"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"
import bcrypt from "bcryptjs"

async function checkUsersAccess(request: NextRequest, perm: string) {
  const actor = await getApiActor(request)
  if (!actor) return { error: createErrorResponse("No autenticado", 401) as never }
  if (!hasAnyPermission(actor, [perm, "users.all", "users"]))
    return { error: createErrorResponse("Sin permisos", 403) as never }
  return { actor }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await checkUsersAccess(request, "users.read")
    if ("error" in access) return access.error
    const { id } = await params

    if (!id) {
      return createErrorResponse(USER_MESSAGES.error.required, 400)
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        ci: true,
        firstName: true,
        lastName: true,
        address: true,
        phone: true,
        email: true,
        role: true,
        status: true,
        image: true,
        createdAt: true,
      },
    })

    if (!user) {
      return createErrorResponse(USER_MESSAGES.error.notFound, 404)
    }

    return createSuccessResponse(
      transformUserToAPI(user as Parameters<typeof transformUserToAPI>[0]),
    )
  } catch (error) {
    return handleApiError(error, USER_MESSAGES.error.fetch)
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await checkUsersAccess(request, "users.update")
    if ("error" in access) return access.error
    const { id } = await params

    if (!id) {
      return createErrorResponse(USER_MESSAGES.error.required, 400)
    }

    const body = await request.json()
    const { password, ...restData } = body

    const validated = UserSchema.parse(restData)

    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return createErrorResponse(USER_MESSAGES.error.notFound, 404)
    }

    // Verificar si el CI ya existe en otro usuario
    if (validated.ci !== existingUser.ci) {
      const ciExists = await prisma.user.findUnique({
        where: { ci: validated.ci },
      })

      if (ciExists) {
        return createErrorResponse(USER_MESSAGES.error.ciExists, 400)
      }
    }

    // Verificar si el email ya existe en otro usuario
    if (validated.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validated.email },
      })

      if (emailExists) {
        return createErrorResponse(USER_MESSAGES.error.emailExists, 400)
      }
    }

    // Preparar datos para actualizar
    const updateData: Prisma.UserUpdateInput = {
      ci: validated.ci,
      firstName: validated.firstName,
      lastName: validated.lastName,
      address: validated.address,
      phone: validated.phone,
      email: validated.email,
      role: validated.role,
      status: validated.status,
    }

    // Solo actualizar password si se proporciona
    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        ci: true,
        firstName: true,
        lastName: true,
        address: true,
        phone: true,
        email: true,
        role: true,
        status: true,
        image: true,
        createdAt: true,
      },
    })

    return createSuccessResponse(
      transformUserToAPI(updatedUser as Parameters<typeof transformUserToAPI>[0]),
    )
  } catch (error) {
    return handleApiError(error, USER_MESSAGES.error.update)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await checkUsersAccess(request, "users.update")
    if ("error" in access) return access.error
    const { id } = await params

    if (!id) {
      return createErrorResponse(USER_MESSAGES.error.required, 400)
    }

    const body = await request.json()
    const { status } = body

    if (!status || !["active", "inactive"].includes(status)) {
      return createErrorResponse(`Estado inválido: ${status}`, 400)
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return createErrorResponse(USER_MESSAGES.error.notFound, 404)
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        ci: true,
        firstName: true,
        lastName: true,
        address: true,
        phone: true,
        email: true,
        role: true,
        status: true,
        image: true,
        createdAt: true,
      },
    })

    return createSuccessResponse(
      transformUserToAPI(updatedUser as Parameters<typeof transformUserToAPI>[0]),
    )
  } catch (error) {
    return handleApiError(error, USER_MESSAGES.error.toggleStatus)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const access = await checkUsersAccess(request, "users.delete")
    if ("error" in access) return access.error
    const { id } = await params

    if (!id) {
      return createErrorResponse(USER_MESSAGES.error.required, 400)
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        salesAsSeller: true,
        purchasesAsBuyer: true,
        quotationsAsSeller: true,
        expenses: true,
        cashRecords: true,
      },
    })

    if (!existingUser) {
      return createErrorResponse(USER_MESSAGES.error.notFound, 404)
    }

    // Verificar si tiene registros asociados
    const hasRecords =
      existingUser.salesAsSeller.length > 0 ||
      existingUser.purchasesAsBuyer.length > 0 ||
      existingUser.quotationsAsSeller.length > 0 ||
      existingUser.expenses.length > 0 ||
      existingUser.cashRecords.length > 0

    if (hasRecords) {
      return createErrorResponse(
        "No se puede eliminar el usuario porque tiene registros asociados. Puedes desactivarlo en su lugar.",
        400,
      )
    }

    await prisma.user.delete({
      where: { id },
    })

    return createSuccessResponse({ message: USER_MESSAGES.success.deleted })
  } catch (error) {
    return handleApiError(error, USER_MESSAGES.error.delete)
  }
}
