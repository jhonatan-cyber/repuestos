import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const mockPrisma = vi.hoisted(() => ({
  category: { findUnique: vi.fn(), update: vi.fn() },
  product: { updateMany: vi.fn() },
  expense: { updateMany: vi.fn() },
}))

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))
vi.mock("@/lib/auth/tokens", () => ({ verifyAccessToken: vi.fn() }))

import * as tokens from "@/lib/auth/tokens"
import { PATCH as toggleCategory } from "@/app/api/categories/[id]/toggle-status/route"

function req(url: string, init?: RequestInit) {
  return new NextRequest(new URL(`http://localhost:3000${url}`), init as never)
}

function authedReq(url: string) {
  return req(url, { method: "PATCH", headers: { cookie: "access_token=valid" } })
}

function tokenWith(permissions: string[]) {
  return { sub: "user-1", role: "Administrador", permissions }
}

function call(id = "cat-1") {
  return toggleCategory(authedReq(`/api/categories/${id}/toggle-status`), {
    params: Promise.resolve({ id }),
  })
}

function category(overrides: Record<string, unknown> = {}) {
  return {
    id: "cat-1",
    name: "Filtros",
    color: "#000000",
    description: "Filtros de aceite",
    type: "product",
    isDeleted: false,
    ...overrides,
  }
}

describe("PATCH /api/categories/{id}/toggle-status", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.category.update.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => category(data),
    )
    mockPrisma.product.updateMany.mockResolvedValue({ count: 1 })
    mockPrisma.expense.updateMany.mockResolvedValue({ count: 1 })
  })

  it("returns 401 without a session", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(null)
    const res = await toggleCategory(
      req("/api/categories/cat-1/toggle-status", { method: "PATCH" }),
      { params: Promise.resolve({ id: "cat-1" }) },
    )
    expect(res.status).toBe(401)
  })

  it("returns 403 without category permissions", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(tokenWith(["dashboard"]) as never)
    const res = await call()
    expect(res.status).toBe(403)
  })

  it("returns 404 when the category does not exist", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(tokenWith(["categories.update"]) as never)
    mockPrisma.category.findUnique.mockResolvedValue(null)
    const res = await call()
    expect(res.status).toBe(404)
    expect((await res.json()).error).toBe("Categoría no encontrada")
  })

  it("activates an inactive category without cascading", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(tokenWith(["categories.update"]) as never)
    mockPrisma.category.findUnique.mockResolvedValueOnce({ isDeleted: true })

    const res = await call()

    expect(res.status).toBe(200)
    expect((await res.json()).status).toBe("active")
    expect(mockPrisma.category.update).toHaveBeenCalledWith({
      where: { id: "cat-1" },
      data: { isDeleted: false },
    })
    expect(mockPrisma.product.updateMany).not.toHaveBeenCalled()
    expect(mockPrisma.expense.updateMany).not.toHaveBeenCalled()
  })

  it("deactivates an active category and cascades to products and expenses", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(tokenWith(["products.update"]) as never)
    mockPrisma.category.findUnique
      .mockResolvedValueOnce({ isDeleted: false })
      .mockResolvedValueOnce({ id: "cat-1", name: "Filtros" })

    const res = await call()

    expect(res.status).toBe(200)
    expect((await res.json()).status).toBe("inactive")
    expect(mockPrisma.product.updateMany).toHaveBeenCalledWith({
      where: { categoryId: "cat-1" },
      data: { isDeleted: true },
    })
    expect(mockPrisma.expense.updateMany).toHaveBeenCalledWith({
      where: { category: "Filtros" },
      data: { isDeleted: true },
    })
    expect(mockPrisma.category.update).toHaveBeenCalledWith({
      where: { id: "cat-1" },
      data: { isDeleted: true },
    })
  })

  it("returns 500 when the database fails", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(tokenWith(["categories.update"]) as never)
    mockPrisma.category.findUnique.mockRejectedValue(new Error("db fail"))
    const res = await call()
    expect(res.status).toBe(500)
  })
})
