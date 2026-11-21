import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import {
  createErrorResponse,
  createSuccessResponse,
  handleApiError,
  isPrismaKnownRequestError,
} from "@/lib/api-utils"
import { logger } from "@/lib/logger"
import { prisma } from "@/lib/prisma"
import { parsePermissions, serializePermissions } from "@/lib/json-field"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"

const ROLE_ALIAS_MAP: Record<string, string[]> = {
  Administrador: ["administrador", "Administrador", "admin"],
  Vendedor: ["vendedor", "Vendedor"],
  Comprador: ["comprador", "Comprador", "compras"],
  Supervisor: ["supervisor", "Supervisor"],
  Invitado: ["invitado", "Invitado"],
}

function getRoleAliases(roleName: string): string[] {
  return ROLE_ALIAS_MAP[roleName] ?? [roleName]
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)
    if (!hasAnyPermission(actor, ["roles.update", "roles.all", "roles"])) {
      return createErrorResponse("Sin permisos", 403)
    }
    const { id } = await params
    const body = await request.json()
    const { name, description, permissions, color, status } = body

    if (!name || !permissions || !Array.isArray(permissions) || permissions.length === 0) {
      return createErrorResponse("Nombre y permisos son requeridos", 400)
    }

    const existingRole = await prisma.role.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    })

    if (!existingRole) {
      return createErrorResponse("Rol no encontrado", 404)
    }

    const updatedRole = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const role = await tx.role.update({
        where: { id },
        data: {
          name,
          description: description ?? "",
          permissions: serializePermissions(permissions),
          color: color ?? existingRole.color,
          status: status === "inactive" ? "inactive" : "active",
        },
      })

      if (existingRole.name !== name) {
        await tx.user.updateMany({
          where: {
            role: { in: getRoleAliases(existingRole.name) },
            isDeleted: false,
          },
          data: {
            role: name,
          },
        })
      }

      return role
    })

    const userCount = await prisma.user.count({
      where: {
        role: { in: getRoleAliases(updatedRole.name) },
        isDeleted: false,
      },
    })

    return createSuccessResponse({
      id: updatedRole.id,
      name: updatedRole.name,
      description: updatedRole.description,
      permissions: parsePermissions(updatedRole.permissions),
      color: updatedRole.color,
      status: updatedRole.status,
      isSystem: updatedRole.isSystem,
      usersCount: userCount,
    })
  } catch (error) {
    if (isPrismaKnownRequestError(error) && error.code === "P2002") {
      return createErrorResponse("Ya existe un rol con ese nombre", 409)
    }
    logger.error("Error al actualizar rol", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al actualizar rol")
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)
    if (!hasAnyPermission(actor, ["roles.delete", "roles.all", "roles"])) {
      return createErrorResponse("Sin permisos", 403)
    }
    const { id } = await params

    const role = await prisma.role.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    })

    if (!role) {
      return createErrorResponse("Rol no encontrado", 404)
    }

    const assignedUsers = await prisma.user.count({
      where: {
        role: { in: getRoleAliases(role.name) },
        isDeleted: false,
      },
    })

    if (assignedUsers > 0) {
      return createErrorResponse("No se puede eliminar un rol con usuarios asignados", 400)
    }

    await prisma.role.delete({
      where: { id },
    })

    return createSuccessResponse({ message: "Rol eliminado correctamente" })
  } catch (error) {
    logger.error("Error al eliminar rol", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al eliminar rol")
  }
}
