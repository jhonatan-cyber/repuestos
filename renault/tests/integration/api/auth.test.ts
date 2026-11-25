import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const mockPrisma = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), count: vi.fn(), create: vi.fn() },
  role: { count: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
  auditLog: { count: vi.fn(), deleteMany: vi.fn() },
  $executeRaw: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))

const mockBcrypt = vi.hoisted(() => ({ compare: vi.fn(), hash: vi.fn() }))
vi.mock("bcryptjs", () => ({
  default: mockBcrypt,
  compare: mockBcrypt.compare,
  hash: mockBcrypt.hash,
}))

vi.mock("@/lib/auth/tokens", () => ({
  verifyAccessToken: vi.fn(),
  generateTokens: vi.fn(),
}))

vi.mock("@/lib/auth/session", () => ({
  applySessionCookies: vi.fn(),
  buildSessionUser: vi.fn(),
  getPermissionsForRole: vi.fn(),
  refreshSessionFromToken: vi.fn(),
}))

vi.mock("@/lib/rate-limit", () => ({
  RATE_LIMITS: { auth: { limit: 5, windowMs: 60_000 } },
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true }),
  getClientKey: vi.fn().mockReturnValue("test-client"),
}))

vi.mock("@/lib/audit-log", () => ({
  ensureAuditLogTable: vi.fn().mockResolvedValue(undefined),
  logAudit: vi.fn().mockResolvedValue(undefined),
}))

import bcryptModule from "bcryptjs"
const bcrypt = bcryptModule as unknown as { compare: ReturnType<typeof vi.fn> }
import * as tokens from "@/lib/auth/tokens"
import * as session from "@/lib/auth/session"
import { POST as login } from "@/app/api/auth/login/route"
import { POST as refresh } from "@/app/api/auth/refresh/route"
import { POST as logout } from "@/app/api/auth/logout/route"
import { POST as setup } from "@/app/api/auth/setup/route"
import { GET as setupCheck } from "@/app/api/auth/setup/check/route"
import { GET as me } from "@/app/api/auth/me/route"

function req(url: string, init?: RequestInit) {
  return new NextRequest(new URL(`http://localhost:3000${url}`), init as any)
}

const VALID_USER = {
  id: "1",
  email: "admin@test.com",
  password: "hashed",
  firstName: "Admin",
  lastName: "User",
  role: "Administrador",
  status: "active",
}

describe("POST /api/auth/login", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 400 when email missing", async () => {
    const res = await login(
      req("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: "123" }),
      }),
    )
    expect(res.status).toBe(400)
  })

  it("returns 400 when password missing", async () => {
    const res = await login(
      req("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "admin@test.com" }),
      }),
    )
    expect(res.status).toBe(400)
  })

  it("returns 429 when rate limited", async () => {
    mockPrisma.auditLog.count.mockResolvedValue(3)
    const res = await login(
      req("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "admin@test.com", password: "pass" }),
      }),
    )
    expect(res.status).toBe(429)
    expect(res.headers.get("Retry-After")).toBe("900")
  })

  it("returns 401 when user not found", async () => {
    mockPrisma.auditLog.count.mockResolvedValue(0)
    mockPrisma.user.findUnique.mockResolvedValue(null)
    const res = await login(
      req("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "nonexistent@test.com", password: "pass" }),
      }),
    )
    expect(res.status).toBe(401)
    expect((await res.json()).error).toBe("Invalid credentials")
  })

  it("returns 401 when user inactive", async () => {
    mockPrisma.auditLog.count.mockResolvedValue(0)
    mockPrisma.user.findUnique.mockResolvedValue({ ...VALID_USER, status: "inactive" })
    const res = await login(
      req("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "inactive@test.com", password: "pass" }),
      }),
    )
    expect(res.status).toBe(401)
  })

  it("returns 401 on wrong password", async () => {
    mockPrisma.auditLog.count.mockResolvedValue(0)
    mockPrisma.user.findUnique.mockResolvedValue(VALID_USER)
    bcrypt.compare.mockResolvedValue(false as never)
    const res = await login(
      req("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "admin@test.com", password: "wrong" }),
      }),
    )
    expect(res.status).toBe(401)
  })

  it("returns 200 with user data on valid login", async () => {
    mockPrisma.auditLog.count.mockResolvedValue(0)
    mockPrisma.user.findUnique.mockResolvedValue(VALID_USER)
    bcrypt.compare.mockResolvedValue(true as never)
    vi.mocked(session.getPermissionsForRole).mockResolvedValue(["admin", "settings"])
    vi.mocked(tokens.generateTokens).mockResolvedValue({
      accessToken: "at",
      refreshToken: "rt",
      sessionId: "sid",
    })
    vi.mocked(session.buildSessionUser).mockReturnValue({
      id: "1",
      email: "admin@test.com",
      name: "Admin User",
      role: "Administrador",
      permissions: ["admin", "settings"],
    })

    const res = await login(
      req("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "admin@test.com", password: "correct" }),
      }),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.email).toBe("admin@test.com")
    expect(body.accessToken).toBe("at")
    expect(body.refreshToken).toBe("rt")
    expect(session.applySessionCookies).toHaveBeenCalled()
    expect(mockPrisma.auditLog.deleteMany).toHaveBeenCalled()
  })
})

describe("POST /api/auth/refresh", () => {
  beforeEach(() => vi.clearAllMocks())

  it("accepts a mobile refresh token in JSON and returns rotated tokens", async () => {
    vi.mocked(session.refreshSessionFromToken).mockResolvedValue({
      user: {
        id: "1",
        email: "admin@test.com",
        name: "Admin User",
        role: "Administrador",
        permissions: ["sales.read"],
      },
      accessToken: "new-at",
      refreshToken: "new-rt",
      rememberMe: true,
    })

    const res = await refresh(
      req("/api/auth/refresh", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refreshToken: "old-rt" }),
      }),
    )

    expect(res.status).toBe(200)
    expect(session.refreshSessionFromToken).toHaveBeenCalledWith("old-rt")
    expect(await res.json()).toMatchObject({
      email: "admin@test.com",
      accessToken: "new-at",
      refreshToken: "new-rt",
    })
    expect(session.applySessionCookies).toHaveBeenCalledWith(res, "new-at", "new-rt", true)
  })

  it("rejects a request without a refresh token", async () => {
    const res = await refresh(req("/api/auth/refresh", { method: "POST" }))
    expect(res.status).toBe(401)
    expect(session.refreshSessionFromToken).not.toHaveBeenCalled()
  })
})

describe("POST /api/auth/logout", () => {
  it("clears session cookies without requiring a valid access token", async () => {
    const res = await logout(req("/api/auth/logout", { method: "POST" }))
    expect(res.status).toBe(200)
    expect(res.cookies.get("access_token")?.value).toBe("")
    expect(res.cookies.get("refresh_token")?.value).toBe("")
  })
})

describe("GET /api/auth/setup/check", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns needsSetup=true when no users exist", async () => {
    mockPrisma.user.count.mockResolvedValue(0)
    mockPrisma.role.count.mockResolvedValue(1)
    const body = await (await setupCheck()).json()
    expect(body.needsSetup).toBe(true)
  })

  it("returns needsSetup=true when no roles exist", async () => {
    mockPrisma.user.count.mockResolvedValue(1)
    mockPrisma.role.count.mockResolvedValue(0)
    const body = await (await setupCheck()).json()
    expect(body.needsSetup).toBe(true)
  })

  it("returns needsSetup=false when users and roles exist", async () => {
    mockPrisma.user.count.mockResolvedValue(1)
    mockPrisma.role.count.mockResolvedValue(1)
    const body = await (await setupCheck()).json()
    expect(body.needsSetup).toBe(false)
  })

  it("returns 500 on DB error", async () => {
    mockPrisma.user.count.mockRejectedValue(new Error("db fail"))
    expect((await setupCheck()).status).toBe(500)
  })
})

describe("POST /api/auth/setup", () => {
  beforeEach(() => vi.clearAllMocks())

  it("creates the first administrator using the password chosen during setup", async () => {
    mockPrisma.user.count.mockResolvedValue(0)
    mockPrisma.role.findUnique.mockResolvedValue({ id: "admin-role" })
    mockBcrypt.hash.mockResolvedValue("hashed-custom-password")
    mockPrisma.user.create.mockResolvedValue({
      id: "1",
      email: "admin@test.com",
      role: "Administrador",
    })

    const res = await setup(
      req("/api/auth/setup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ci: "12345678",
          firstName: "Admin",
          lastName: "Test",
          email: "admin@test.com",
          password: "personal-password",
        }),
      }),
    )

    expect(res.status).toBe(200)
    expect(mockBcrypt.hash).toHaveBeenCalledWith("personal-password", 12)
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ password: "hashed-custom-password" }),
      }),
    )
  })

  it("rejects passwords shorter than eight characters", async () => {
    mockPrisma.user.count.mockResolvedValue(0)

    const res = await setup(
      req("/api/auth/setup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ci: "12345678",
          firstName: "Admin",
          lastName: "Test",
          email: "admin@test.com",
          password: "short",
        }),
      }),
    )

    expect(res.status).toBe(400)
    expect(mockPrisma.user.create).not.toHaveBeenCalled()
  })
})

describe("GET /api/auth/me", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 401 without access_token cookie", async () => {
    const body = await (await me(req("/api/auth/me"))).json()
    expect(body.error).toBe("No autenticado")
  })

  it("returns 401 with invalid token", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(null)
    const res = await me(
      req("/api/auth/me", {
        headers: { cookie: "access_token=bad" },
      }),
    )
    expect(res.status).toBe(401)
  })

  it("returns 401 when user not found in DB", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue({ sub: "u1" } as any)
    mockPrisma.user.findUnique.mockResolvedValue(null)
    const res = await me(
      req("/api/auth/me", {
        headers: { cookie: "access_token=valid" },
      }),
    )
    expect(res.status).toBe(401)
    expect((await res.json()).error).toBe("Usuario no encontrado")
  })

  it("returns 403 when user is inactive", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue({ sub: "u1" } as any)
    mockPrisma.user.findUnique.mockResolvedValue({ status: "inactive" })
    const res = await me(
      req("/api/auth/me", {
        headers: { cookie: "access_token=valid" },
      }),
    )
    expect(res.status).toBe(403)
    expect((await res.json()).error).toBe("Cuenta de usuario inactiva")
  })

  it("returns user data when authenticated", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue({
      sub: "1",
      permissions: ["admin", "settings"],
    } as any)
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "1",
      email: "admin@test.com",
      firstName: "Admin",
      lastName: "User",
      role: "Administrador",
      status: "active",
      image: null,
    })
    const body = await (
      await me(
        req("/api/auth/me", {
          headers: { cookie: "access_token=valid" },
        }),
      )
    ).json()
    expect(body.email).toBe("admin@test.com")
    expect(body.name).toBe("Admin User")
    expect(body.permissions).toEqual(["admin", "settings"])
  })

  it("accepts an access token sent as a Bearer header", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue({
      sub: "1",
      permissions: ["sales.read"],
    } as any)
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "1",
      email: "admin@test.com",
      firstName: "Admin",
      lastName: "User",
      role: "Administrador",
      status: "active",
      image: null,
    })

    const res = await me(
      req("/api/auth/me", {
        headers: { authorization: "Bearer valid-mobile-token" },
      }),
    )

    expect(res.status).toBe(200)
    expect(tokens.verifyAccessToken).toHaveBeenCalledWith("valid-mobile-token")
    expect((await res.json()).email).toBe("admin@test.com")
  })
})
