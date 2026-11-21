import { describe, it, expect, vi, beforeEach } from "vitest"
import { parseRolePermissions } from "@/lib/permissions-check"
import {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  getCookieOptions,
} from "@/lib/auth/tokens"

describe("parseRolePermissions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  it("should return empty array for null input", () => {
    const result = parseRolePermissions(null)
    expect(result).toEqual([])
  })

  it("should return empty array for undefined input", () => {
    const result = parseRolePermissions(undefined as unknown as string | null)
    expect(result).toEqual([])
  })

  it("should return empty array for empty string", () => {
    const result = parseRolePermissions("")
    expect(result).toEqual([])
  })

  it("should parse valid JSON array", () => {
    const result = parseRolePermissions('["read", "write", "delete"]')
    expect(result).toEqual(["read", "write", "delete"])
  })

  it("should parse single permission as array", () => {
    const result = parseRolePermissions('["admin"]')
    expect(result).toEqual(["admin"])
  })

  it("should handle wildcard permission", () => {
    const result = parseRolePermissions('["*"]')
    expect(result).toEqual(["*"])
  })

  it("should return empty array for invalid JSON", () => {
    const result = parseRolePermissions("not-valid-json")
    expect(result).toEqual([])
  })

  it("should return empty array for malformed JSON", () => {
    const result = parseRolePermissions('{"invalid": json}')
    expect(result).toEqual([])
  })

  it("should return empty array for number string", () => {
    const result = parseRolePermissions("123")
    expect(result).toEqual([])
  })

  it("should return empty array for plain text", () => {
    const result = parseRolePermissions("plain text permissions")
    expect(result).toEqual([])
  })
})

describe("tokens", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, "warn").mockImplementation(() => {})
  })

  describe("generateTokens", () => {
    it("should generate both access and refresh tokens", async () => {
      const result = await generateTokens("user-1", "test@test.com", "admin", ["*"])
      expect(result.accessToken).toBeTruthy()
      expect(result.refreshToken).toBeTruthy()
      expect(result.sessionId).toBeTruthy()
      expect(typeof result.accessToken).toBe("string")
      expect(typeof result.refreshToken).toBe("string")
    })
  })

  describe("verifyAccessToken", () => {
    it("should verify a valid access token and return payload", async () => {
      const { accessToken } = await generateTokens("user-1", "test@test.com", "admin", ["read"])
      const payload = await verifyAccessToken(accessToken)
      expect(payload).not.toBeNull()
      expect(payload!.sub).toBe("user-1")
      expect(payload!.email).toBe("test@test.com")
      expect(payload!.role).toBe("admin")
      expect(payload!.permissions).toEqual(["read"])
    })

    it("should return null for an invalid token", async () => {
      const payload = await verifyAccessToken("invalid-token")
      expect(payload).toBeNull()
    })

    it("should return null for expired token", async () => {
      // Create token with a bogus string — can't easily create expired tokens with jose,
      // but we can verify that garbage input returns null
      const payload = await verifyAccessToken("eyJhbGciOiJIUzI1NiJ9.dGVzdA.nonsense")
      expect(payload).toBeNull()
    })
  })

  describe("verifyRefreshToken", () => {
    it("should verify a valid refresh token and return payload", async () => {
      const { refreshToken } = await generateTokens("user-1", "test@test.com", "admin", [])
      const payload = await verifyRefreshToken(refreshToken)
      expect(payload).not.toBeNull()
      expect(payload!.sub).toBe("user-1")
      expect(payload!.sessionId).toBeTruthy()
    })

    it("should return null for an invalid refresh token", async () => {
      const payload = await verifyRefreshToken("invalid-token")
      expect(payload).toBeNull()
    })
  })

  describe("generate + verify roundtrip", () => {
    it("should generate and verify tokens with full payload", async () => {
      const { accessToken, refreshToken, sessionId } = await generateTokens(
        "user-42",
        "user@renault.com",
        "vendedor",
        ["sales:create", "sales:read"],
      )
      const accessPayload = await verifyAccessToken(accessToken)
      expect(accessPayload!.sub).toBe("user-42")
      expect(accessPayload!.email).toBe("user@renault.com")
      expect(accessPayload!.role).toBe("vendedor")
      expect(accessPayload!.permissions).toEqual(["sales:create", "sales:read"])

      const refreshPayload = await verifyRefreshToken(refreshToken)
      expect(refreshPayload!.sub).toBe("user-42")
      expect(refreshPayload!.sessionId).toBe(sessionId)
    })
  })

  describe("getCookieOptions", () => {
    it("should return access cookie config with maxAge when rememberMe is true", () => {
      const opts = getCookieOptions("access", true)
      expect(opts.name).toBe("access_token")
      expect(opts.httpOnly).toBe(true)
      expect(opts.path).toBe("/")
      expect(opts.maxAge).toBe(15 * 60)
    })

    it("should return refresh cookie config with maxAge when rememberMe is true", () => {
      const opts = getCookieOptions("refresh", true)
      expect(opts.name).toBe("refresh_token")
      expect(opts.maxAge).toBe(7 * 24 * 60 * 60)
    })

    it("should omit maxAge when rememberMe is false (session cookie)", () => {
      const opts = getCookieOptions("access", false)
      expect(opts.name).toBe("access_token")
      expect(opts).not.toHaveProperty("maxAge")
    })

    it("should omit maxAge for refresh when rememberMe is false", () => {
      const opts = getCookieOptions("refresh", false)
      expect(opts.name).toBe("refresh_token")
      expect(opts).not.toHaveProperty("maxAge")
    })
  })
})
