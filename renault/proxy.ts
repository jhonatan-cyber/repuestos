/**
 * Next.js 16 Proxy for JWT authentication
 * Protects routes by verifying access tokens
 *
 * Migration: middleware.ts -> proxy.ts (Next.js 16 convention)
 *
 * IMPORTANT: This runs in Edge Runtime — NO Prisma, NO Node.js-only modules.
 * Token refresh is handled by redirecting to /api/auth/refresh or letting
 * the client handle it, NOT by calling Prisma directly from here.
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { verifyAccessToken } from "@/lib/auth/tokens"
import type { SessionUser } from "@/lib/auth/session"

const ADMIN_ROLES = new Set(["admin", "administrador", "Administrador"])

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  "/login",
  "/setup",
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/setup",
  "/api/auth/forgot-password",
]

// Routes that require authentication
const PROTECTED_API_ROUTES = ["/api/"]

// ADMIN-only routes (require admin or administrator role)
const ADMIN_ONLY_ROUTES = [
  "/api/users",
  "/api/roles",
  "/api/permissions",
  "/api/settings",
  "/api/backup",
]

// ─── CORS ─────────────────────────────────────────────────────────────────────
// En modo Electron el renderer corre en file:// o http://localhost, así que
// permitimos localhost en cualquier puerto. En web usamos la variable de entorno
// ALLOWED_ORIGIN (ej. "https://mi-dominio.com"). Sin variable → solo mismo origen.
const ELECTRON_ORIGIN_RE = /^(file:\/\/|http:\/\/localhost(:\d+)?$)/

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true // misma página (no es cross-origin)
  const appRuntime = process.env.APP_RUNTIME
  if (appRuntime === "electron") return ELECTRON_ORIGIN_RE.test(origin)
  const allowed = process.env.ALLOWED_ORIGIN
  if (!allowed) return false // web: sin variable → rechaza cross-origin
  return origin === allowed
}

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
}

function applyCorsHeaders(response: NextResponse, origin: string | null): NextResponse {
  if (origin && isOriginAllowed(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin)
    response.headers.set("Vary", "Origin")
    for (const [k, v] of Object.entries(CORS_HEADERS)) response.headers.set(k, v)
    // Credenciales (cookies) solo si el origen es explícito (no wildcard)
    response.headers.set("Access-Control-Allow-Credentials", "true")
  }
  return response
}
// ──────────────────────────────────────────────────────────────────────────────

// Configuración del matcher (Next.js 16+)
// NOTA: no excluir api/settings ni api/auth completos — las subrutas públicas
// se controlan vía PUBLIC_ROUTES y el resto exige JWT en-ruta (defensa en profundidad).
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/|renaultreluz|\\.).*)"],
}

function withAuthHeaders(request: NextRequest, user: Pick<SessionUser, "id" | "email" | "role">) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-user-id", user.id || "")
  requestHeaders.set("x-user-email", user.email || "")
  requestHeaders.set("x-user-role", user.role || "")
  return requestHeaders
}

async function getSessionFromRequest(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value

  if (accessToken) {
    const payload = await verifyAccessToken(accessToken)
    if (payload) {
      return {
        user: {
          id: payload.sub || "",
          email: payload.email,
          role: payload.role,
        },
      }
    }
  }

  // No refresh token handling in Edge middleware — client handles refresh via /api/auth/refresh
  return null
}

// Proxy function - handles request modification
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const origin = request.headers.get("origin")

  // Preflight CORS — respondemos antes de cualquier otra lógica
  if (request.method === "OPTIONS") {
    const res = new NextResponse(null, { status: 204 })
    return applyCorsHeaders(res, origin)
  }

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))

  if (isPublicRoute) {
    const res = NextResponse.next()
    return applyCorsHeaders(res, origin)
  }

  // For API routes, verify access token
  const isProtectedApiRoute = PROTECTED_API_ROUTES.some((route) => pathname.startsWith(route))

  if (isProtectedApiRoute) {
    const session = await getSessionFromRequest(request)
    if (!session) {
      const res = NextResponse.json({ error: "Authentication required" }, { status: 401 })
      return applyCorsHeaders(res, origin)
    }

    const isAdminRoute = ADMIN_ONLY_ROUTES.some((route) => pathname.startsWith(route))
    if (isAdminRoute && !ADMIN_ROLES.has(session.user.role)) {
      const res = NextResponse.json({ error: "Admin access required" }, { status: 403 })
      return applyCorsHeaders(res, origin)
    }

    const res = NextResponse.next({
      request: {
        headers: withAuthHeaders(request, session.user),
      },
    })
    return applyCorsHeaders(res, origin)
  }

  // For page routes, check if authenticated
  if (pathname !== "/login" && !pathname.startsWith("/_next") && !pathname.startsWith("/favicon")) {
    const session = await getSessionFromRequest(request)
    if (!session) {
      // Check if there's a refresh token — if so, let the client handle refresh
      // instead of blocking access entirely here
      const refreshToken = request.cookies.get("refresh_token")?.value
      if (refreshToken) {
        // Has refresh token but no valid access token — allow through, client will refresh
        return NextResponse.next()
      }

      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      const response = NextResponse.redirect(loginUrl)

      // Clear invalid cookies
      response.cookies.delete("access_token")
      response.cookies.delete("refresh_token")

      return response
    }

    const res = NextResponse.next({
      request: {
        headers: withAuthHeaders(request, session.user),
      },
    })
    return applyCorsHeaders(res, origin)
  }

  return
}
