import { describe, it, expect, vi } from "vitest"
import { hasAnyPermission, getApiActor } from "@/lib/api-security"
import * as tokens from "@/lib/auth/tokens"

describe("hasAnyPermission", () => {
  const actor = {
    userId: "1",
    role: "admin",
    permissions: ["sales.view", "sales.create", "inventory.edit"],
  }

  it("returns true when actor has the requested permission", () => {
    expect(hasAnyPermission(actor, ["sales.view"])).toBe(true)
  })

  it("returns true when actor has any of the requested permissions", () => {
    expect(hasAnyPermission(actor, ["sales.view", "reports.view"])).toBe(true)
  })

  it("returns false when actor lacks all requested permissions", () => {
    expect(hasAnyPermission(actor, ["reports.view", "users.manage"])).toBe(false)
  })

  it("returns false for empty expected list", () => {
    expect(hasAnyPermission(actor, [])).toBe(false)
  })

  it("returns true when actor has wildcard permission", () => {
    const god = { ...actor, permissions: ["*"] }
    expect(hasAnyPermission(god, ["anything.here"])).toBe(true)
  })

  it("returns true with wildcard even for empty expected", () => {
    const god = { ...actor, permissions: ["*"] }
    expect(hasAnyPermission(god, [])).toBe(true)
  })

  it("returns false for actor with no permissions", () => {
    const nobody = { userId: "2", role: "viewer", permissions: [] }
    expect(hasAnyPermission(nobody, ["sales.view"])).toBe(false)
  })
})

describe("getApiActor", () => {
  it("returns null when no access_token cookie", async () => {
    const request = { cookies: { get: () => undefined } } as any
    expect(await getApiActor(request)).toBeNull()
  })

  it("returns null when token verification fails", async () => {
    vi.spyOn(tokens, "verifyAccessToken").mockResolvedValueOnce(null)
    const request = { cookies: { get: () => ({ value: "bad-token" }) } } as any
    expect(await getApiActor(request)).toBeNull()
  })

  it("returns actor when token is valid", async () => {
    vi.spyOn(tokens, "verifyAccessToken").mockResolvedValueOnce({
      sub: "user-123",
      role: "admin",
      permissions: ["sales.view", "sales.create"],
    } as any)
    const request = { cookies: { get: () => ({ value: "valid-token" }) } } as any
    const actor = await getApiActor(request)
    expect(actor).toEqual({
      userId: "user-123",
      role: "admin",
      permissions: ["sales.view", "sales.create"],
    })
  })

  it("defaults role to empty string when missing", async () => {
    vi.spyOn(tokens, "verifyAccessToken").mockResolvedValueOnce({
      sub: "user-456",
    } as any)
    const request = { cookies: { get: () => ({ value: "token" }) } } as any
    const actor = await getApiActor(request)
    expect(actor?.role).toBe("")
  })

  it("defaults permissions to empty array when missing or not an array", async () => {
    vi.spyOn(tokens, "verifyAccessToken").mockResolvedValueOnce({
      sub: "user-789",
    } as any)
    const request = { cookies: { get: () => ({ value: "token" }) } } as any
    const actor = await getApiActor(request)
    expect(actor?.permissions).toEqual([])
  })
})
