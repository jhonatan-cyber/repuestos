import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const mockPrisma = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), count: vi.fn() },
  role: { count: vi.fn() },
  auditLog: { count: vi.fn(), deleteMany: vi.fn() },
  $executeRaw: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))

const mockBcrypt = vi.hoisted(() => ({ compare: vi.fn() }))
vi.mock("bcryptjs", () => ({ default: mockBcrypt, compare: mockBcrypt.compare }))

vi.mock("@/lib/auth/tokens", () => ({
  verifyAccessToken: vi.fn(),
  generateTokens: vi.fn(),
}))

vi.mock("@/lib/auth/session", () => ({
  applySessionCookies: vi.fn(),
  buildSessionUser: vi.fn(),
  getPermissionsForRole: vi.fn(),
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
    expect(session.applySessionCookies).toHaveBeenCalled()
    expect(mockPrisma.auditLog.deleteMany).toHaveBeenCalled()
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
})
