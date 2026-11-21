/**
 * JWT Token utilities using jose library
 * Implements Access Token (15 min) + Refresh Token (7 days) pattern
 */

import { logger } from "@/lib/logger"
import { SignJWT, jwtVerify, type JWTPayload } from "jose"

// Environment variables for JWT signing — MUST be set in .env
function getJwtSecret(envVar: string, label: string): Uint8Array {
  const value = process.env[envVar]
  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`[tokens] ${label} no configurado. Agregá ${envVar}=<tu-secreto> en .env`)
    }
    logger.warn(
      `[tokens] ${label} no configurado. Usando fallback para desarrollo. ` +
        `Agregá ${envVar}=<tu-secreto> en .env para producción.`,
    )
  }
  return new TextEncoder().encode(value || "dev-secret-do-not-use-in-production")
}

const JWT_SECRET = getJwtSecret("JWT_SECRET", "JWT_SECRET")
const JWT_REFRESH_SECRET = getJwtSecret("JWT_REFRESH_SECRET", "JWT_REFRESH_SECRET")

// Token expiration times
const ACCESS_TOKEN_EXPIRY = "15m"
const REFRESH_TOKEN_EXPIRY = "7d"

// Cookie configuration constants
const COOKIE_CONFIG = {
  access: {
    name: "access_token",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const, // lax for local development
    path: "/",
    maxAge: 15 * 60, // 15 minutes in seconds
  },
  refresh: {
    name: "refresh_token",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  },
}

/**
 * Access Token payload - public info for API requests
 */
export interface AccessTokenPayload extends JWTPayload {
  sub: string // user id
  email: string
  role: string
  permissions: string[]
}

/**
 * Refresh Token payload - minimal info to identify session
 */
export interface RefreshTokenPayload extends JWTPayload {
  sub: string // user id
  sessionId: string
  rememberMe?: boolean
}

type CookieType = "access" | "refresh"

/**
 * Generate both Access and Refresh tokens
 */
export async function generateTokens(
  userId: string,
  email: string,
  role: string,
  permissions: string[],
  rememberMe = true,
): Promise<{
  accessToken: string
  refreshToken: string
  sessionId: string
}> {
  // Generate a unique session ID for refresh token tracking
  const sessionId = crypto.randomUUID()

  // Create Access Token (15 min) with full payload
  const accessToken = await new SignJWT({
    email,
    role,
    permissions,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET)

  // Create Refresh Token (7 days) with minimal payload
  const refreshToken = await new SignJWT({ sessionId, rememberMe })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(JWT_REFRESH_SECRET)

  return { accessToken, refreshToken, sessionId }
}

/**
 * Verify and decode Access Token
 */
export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as AccessTokenPayload
  } catch {
    return null
  }
}

/**
 * Verify and decode Refresh Token
 */
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET)
    return payload as RefreshTokenPayload
  } catch {
    return null
  }
}

/**
 * Get cookie options based on environment
 */
export function getCookieOptions(
  type: CookieType,
  rememberMe = true,
): {
  name: string
  httpOnly: boolean
  secure: boolean
  sameSite: string
  path: string
  maxAge?: number
} {
  const baseConfig = COOKIE_CONFIG[type]

  if (rememberMe) {
    return baseConfig
  }

  const { maxAge, ...sessionCookieConfig } = baseConfig
  return sessionCookieConfig
}
