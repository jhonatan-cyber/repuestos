import { NextResponse, NextRequest } from "next/server"
import {
  createErrorResponse,
  createSuccessResponse,
  handleApiError,
  isPrismaKnownRequestError,
} from "@/lib/api-utils"
import { logger } from "@/lib/logger"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"
import { prisma } from "@/lib/prisma"
import { parsePermissions, serializePermissions } from "@/lib/json-field"

const DEFAULT_SYSTEM_ROLES = [
  {
    name: "Administrador",
    description: "Acceso completo al sistema",
    permissions: [
      "dashboard",
      "clients",
      "quotations",
      "sales",
      "products",
      "suppliers",
      "purchases",
      "categories",
      "inventory",
      "expenses",
      "cash",
      "reports",
      "users",
      "roles",
      "permissions",
      "sync",
    ],
  },
  {
    name: "Vendedor",
    description: "Gestión de ventas y clientes",
    permissions: ["dashboard", "clients", "quotations", "sales", "inventory", "reports"],
  },
  {
    name: "Comprador",
    description: "Gestión de compras y proveedores",
    permissions: ["dashboard", "suppliers", "inventory", "purchases", "reports"],
  },
  {
    name: "Supervisor",
    description: "Supervisión de operaciones",
    permissions: [
      "dashboard",
      "clients",
      "suppliers",
      "inventory",
      "quotations",
      "purchases",
      "sales",
      "expenses",
      "reports",
      "cash",
    ],
  },
  {
    name: "Invitado",
    description: "Solo lectura de reportes",
    permissions: ["dashboard", "reports"],
  },
]

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

async function ensureSystemRoles() {
  for (const role of DEFAULT_SYSTEM_ROLES) {
    // Solo Administrador es rol del sistema
    const isSystem = role.name === "Administrador"

    await prisma.role.upsert({
      where: { name: role.name },
      update: {
        isSystem,
        isDeleted: false,
      },
      create: {
        name: role.name,
        description: role.description,
        permissions: serializePermissions(role.permissions),
        color: "#6B7280",
        status: "active",
        isSystem,
      },
    })
  }
}

export async function GET(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)
    if (
      !hasAnyPermission(actor, [
        "roles.read",
        "roles.list",
        "roles.all",
        "roles",
        "users.read",
        "users",
      ])
    ) {
      return createErrorResponse("Sin permisos", 403)
    }
    const roles = await prisma.role.findMany({
      where: { isDeleted: false },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    })

    const payload = await Promise.all(
      roles.map(
        async (role: {
          id: string
          name: string
          description: string | null
          permissions: string
          color: string
          status: string
          isSystem: boolean
        }) => {
          const aliasList = getRoleAliases(role.name)

          const [userCount, users] = await Promise.all([
            prisma.user.count({
              where: { role: { in: aliasList }, isDeleted: false },
            }),
            prisma.user.findMany({
              where: { role: { in: aliasList }, isDeleted: false },
              select: { firstName: true, lastName: true, email: true },
            }),
          ])

          return {
            id: role.id,
            name: role.name,
            description: role.description,
            permissions: parsePermissions(role.permissions),
            color: role.color,
            status: role.status,
            isSystem: role.isSystem,
            usersCount: userCount,
            users: users.map((u) => ({
              id: u.email,
              name: `${u.firstName} ${u.lastName}`,
              email: u.email,
            })),
          }
        },
      ),
    )

    return createSuccessResponse(payload)
  } catch (error) {
    logger.error("Error al obtener roles", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al obtener roles")
  }
}

export async function POST(request: Request) {
  try {
    const actor = await getApiActor(request as unknown as NextRequest)
    if (!actor) return createErrorResponse("No autenticado", 401)
    if (!hasAnyPermission(actor, ["roles.create", "roles.all", "roles"])) {
      return createErrorResponse("Sin permisos", 403)
    }
    const body = await request.json()
    const { name, description, permissions, color } = body

    if (!name || !permissions || !Array.isArray(permissions) || permissions.length === 0) {
      return createErrorResponse("Nombre y permisos son requeridos", 400)
    }

    const role = await prisma.role.create({
      data: {
        name,
        description: description ?? "",
        permissions: serializePermissions(permissions),
        color: color ?? "#6B7280",
        status: "active",
        isSystem: false,
      },
    })

    return createSuccessResponse(
      {
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: parsePermissions(role.permissions),
        color: role.color,
        status: role.status,
        isSystem: role.isSystem,
        usersCount: 0,
      },
      201,
    )
  } catch (error) {
    if (isPrismaKnownRequestError(error) && error.code === "P2002") {
      return createErrorResponse("Ya existe un rol con ese nombre", 409)
    }
    logger.error("Error al crear rol", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al crear rol")
  }
}
