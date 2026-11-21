import { NextRequest } from "next/server"
import { verifyAccessToken } from "@/lib/auth/tokens"

export interface ApiActor {
  userId: string
  role: string
  permissions: string[]
}

export async function getApiActor(request: NextRequest): Promise<ApiActor | null> {
  // Web/desktop clients use the httpOnly `access_token` cookie. Mobile clients
  // (React Native / Expo) cannot rely on cookies, so they send
  // `Authorization: Bearer <access_token>` instead. Support both.
  let accessToken = request.cookies?.get?.("access_token")?.value
  if (!accessToken) {
    const authHeader = request.headers?.get?.("authorization") ?? request.headers?.get?.("Authorization")
    if (authHeader && /^Bearer\s+/i.test(authHeader)) {
      accessToken = authHeader.replace(/^Bearer\s+/i, "").trim()
    }
  }
  if (!accessToken) return null

  const payload = await verifyAccessToken(accessToken)
  if (!payload?.sub) return null

  return {
    userId: payload.sub,
    role: payload.role || "",
    permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
  }
}

export function hasAnyPermission(actor: ApiActor, expected: string[]) {
  if (actor.permissions.includes("*")) return true
  return expected.some((permission) => actor.permissions.includes(permission))
}

const ADMIN_ROLES = new Set(["admin", "administrador", "Administrador"])

export function isAdminRole(role: string) {
  return ADMIN_ROLES.has(role)
}

export async function requireApiActor(
  request: NextRequest,
  permissions: string[],
): Promise<{
  actor?: ApiActor
  error?: ReturnType<typeof import("@/lib/api-utils").createErrorResponse>
}> {
  const { createErrorResponse } = await import("@/lib/api-utils")
  const actor = await getApiActor(request)
  if (!actor) return { error: createErrorResponse("No autenticado", 401) }
  if (permissions.length > 0 && !hasAnyPermission(actor, permissions)) {
    return { error: createErrorResponse("Sin permisos", 403) }
  }
  return { actor }
}
