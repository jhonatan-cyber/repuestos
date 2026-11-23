import { logger } from "@/lib/logger"
import { prisma } from "@/lib/prisma"
import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { generateTokens } from "@/lib/auth/tokens"
import { applySessionCookies, buildSessionUser, getPermissionsForRole } from "@/lib/auth/session"
import { logAudit } from "@/lib/audit-log"

// Rate limiting config
const MAX_ATTEMPTS = 3
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  return request.headers.get("x-real-ip") || "unknown"
}

function buildRateLimitKey(request: NextRequest, email: string): string {
  const ip = getClientIP(request)
  const normalizedEmail = email.trim().toLowerCase()

  return `${ip}:${normalizedEmail}`
}

async function checkRateLimit(key: string): Promise<boolean> {
  const attemptsInWindow = await prisma.auditLog.count({
    where: {
      entity: "auth_login_attempt",
      entityId: key,
      createdAt: {
        gte: new Date(Date.now() - WINDOW_MS),
      },
    },
  })

  return attemptsInWindow < MAX_ATTEMPTS
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, rememberMe = false } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const rateLimitKey = buildRateLimitKey(request, email)
    if (!(await checkRateLimit(rateLimitKey))) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": "900",
          "X-RateLimit-Limit": String(MAX_ATTEMPTS),
          "X-RateLimit-Remaining": "0",
        },
      })
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      await logAudit({
        action: "CREATE",
        entity: "auth_login_attempt",
        entityId: rateLimitKey,
        metadata: {
          email: email.trim().toLowerCase(),
          ip: getClientIP(request),
          outcome: "failed",
          reason: "not_found",
        },
      })
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    if (user.status !== "active") {
      await logAudit({
        action: "CREATE",
        entity: "auth_login_attempt",
        entityId: rateLimitKey,
        metadata: {
          email: user.email.toLowerCase(),
          ip: getClientIP(request),
          outcome: "failed",
          reason: "inactive",
        },
      })
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      await logAudit({
        action: "CREATE",
        entity: "auth_login_attempt",
        entityId: rateLimitKey,
        metadata: {
          email: user.email.toLowerCase(),
          ip: getClientIP(request),
          outcome: "failed",
          reason: "bad_password",
        },
      })
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const permissions = await getPermissionsForRole(user.role)

    // Generate JWT tokens
    const { accessToken, refreshToken } = await generateTokens(
      user.id.toString(),
      user.email,
      user.role,
      permissions,
      rememberMe,
    )

    // Include tokens in JSON body for mobile app compatibility (Bearer tokens)
    // Cookies are also set for web/desktop app compatibility
    const response = NextResponse.json({
      ...buildSessionUser(user, permissions),
      accessToken,
      refreshToken,
    })

    applySessionCookies(response, accessToken, refreshToken, rememberMe)

    await prisma.auditLog.deleteMany({
      where: {
        entity: "auth_login_attempt",
        entityId: rateLimitKey,
      },
    })

    return response
  } catch (error) {
    logger.error("Login error", { error: error instanceof Error ? error.message : error })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
