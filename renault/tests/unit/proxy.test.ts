import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const mockVerifyAccessToken = vi.hoisted(() => vi.fn())
vi.mock("@/lib/auth/tokens", () => ({ verifyAccessToken: mockVerifyAccessToken }))

import { verifyAccessToken } from "@/lib/auth/tokens"
import proxy from "@/proxy"

function request(path: string, authorization?: string) {
  return new NextRequest(new URL(`http://localhost:3000${path}`), {
    headers: authorization ? { authorization } : undefined,
  })
}

describe("API authentication proxy", () => {
  beforeEach(() => vi.clearAllMocks())

  it("allows a protected API request authenticated with a Bearer token", async () => {
    vi.mocked(verifyAccessToken).mockResolvedValue({
      sub: "mobile-user",
      email: "mobile@test.com",
      role: "vendedor",
    } as any)

    const response = await proxy(request("/api/products", "Bearer mobile-access-token"))

    expect(verifyAccessToken).toHaveBeenCalledWith("mobile-access-token")
    expect(response?.status).toBe(200)
    expect(response?.headers.get("x-middleware-next")).toBe("1")
  })

  it("rejects a protected API request without a valid token", async () => {
    vi.mocked(verifyAccessToken).mockResolvedValue(null)

    const response = await proxy(request("/api/products", "Bearer invalid-token"))

    expect(response?.status).toBe(401)
  })

  it("allows logout requests without an active access token", async () => {
    const response = await proxy(request("/api/auth/logout"))

    expect(response?.status).toBe(200)
    expect(verifyAccessToken).not.toHaveBeenCalled()
  })
})