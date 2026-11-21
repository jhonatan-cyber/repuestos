import { logger } from "@/lib/logger"
import { prisma } from "@/lib/prisma"
import { parseRolePermissions } from "@/lib/permissions-check"
import { generateTokens, getCookieOptions, verifyRefreshToken } from "@/lib/auth/tokens"

const ROLE_NAME_ALIASES: Record<string, string[]> = {
  administrador: ["administrador", "Administrador", "admin"],
  vendedor: ["vendedor", "Vendedor"],
  comprador: ["comprador", "Comprador", "compras"],
  supervisor: ["supervisor", "Supervisor"],
  invitado: ["invitado", "Invitado"],
}

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  admin: "Administrador",
  administrador: "Administrador",
  vendedor: "Vendedor",
  compras: "Comprador",
  comprador: "Comprador",
  supervisor: "Supervisor",
  invitado: "Invitado",
}

export function getRoleDisplayName(role: string): string {
  return ROLE_DISPLAY_NAMES[role.trim().toLowerCase()] || role
}

const FALLBACK_ROLE_PERMISSIONS: Record<string, string[]> = {
  administrador: [
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
  vendedor: ["dashboard", "clients", "quotations", "sales", "inventory", "reports"],
  comprador: ["dashboard", "suppliers", "inventory", "purchases", "reports"],
  supervisor: [
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
  invitado: ["dashboard", "reports"],
}

export interface SessionUser {
  id: string
  email: string
  name: string
  role: string
  permissions: string[]
}

export interface RefreshedSession {
  user: SessionUser
  accessToken: string
  refreshToken: string
  rememberMe: boolean
}

async function resolveRole(roleName: string) {
  const normalizedRole = getRoleDisplayName(roleName).trim().toLowerCase()
  const candidates = ROLE_NAME_ALIASES[normalizedRole] ?? [roleName]

  try {
    for (const candidate of candidates) {
      const role = await prisma.role.findUnique({
        where: { name: candidate },
      })

      if (role) {
        return role
      }
    }
  } catch (error) {
    logger.warn("Role lookup failed, using fallback permissions", {
      error: error instanceof Error ? error.message : error,
    })
  }

  return null
}

function getFallbackPermissions(roleName: string) {
  return FALLBACK_ROLE_PERMISSIONS[getRoleDisplayName(roleName).trim().toLowerCase()] ?? []
}

export async function getPermissionsForRole(roleName: string) {
  const role = await resolveRole(roleName)
  return role ? parseRolePermissions(role.permissions) : getFallbackPermissions(roleName)
}

export function buildSessionUser(
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
  },
  permissions: string[],
): SessionUser {
  return {
    id: user.id.toString(),
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    role: user.role,
    permissions,
  }
}

export function applySessionCookies(
  response: {
    cookies: {
      set: (name: string, value: string, options: Record<string, unknown>) => void
    }
  },
  accessToken: string,
  refreshToken: string,
  rememberMe: boolean,
) {
  const { name: accessName, ...accessOpts } = getCookieOptions("access", rememberMe)
  const { name: refreshName, ...refreshOpts } = getCookieOptions("refresh", rememberMe)

  response.cookies.set(accessName, accessToken, accessOpts)
  response.cookies.set(refreshName, refreshToken, refreshOpts)
}

export async function refreshSessionFromToken(
  refreshToken: string,
): Promise<RefreshedSession | null> {
  const payload = await verifyRefreshToken(refreshToken)
  if (!payload) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
    },
  })

  if (!user || user.status !== "active") {
    return null
  }

  const permissions = await getPermissionsForRole(user.role)
  const refreshedTokens = await generateTokens(
    user.id.toString(),
    user.email,
    user.role,
    permissions,
    payload.rememberMe ?? true,
  )

  return {
    user: buildSessionUser(user, permissions),
    accessToken: refreshedTokens.accessToken,
    refreshToken: refreshedTokens.refreshToken,
    rememberMe: payload.rememberMe ?? true,
  }
}
