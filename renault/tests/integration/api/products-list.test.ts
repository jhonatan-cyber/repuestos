import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const mockPrisma = vi.hoisted(() => ({
  product: { findMany: vi.fn(), count: vi.fn() },
  category: { findMany: vi.fn() },
  supplier: { findMany: vi.fn() },
  $queryRawUnsafe: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))
vi.mock("@/lib/auth/tokens", () => ({ verifyAccessToken: vi.fn() }))
vi.mock("@/lib/runtime-env", () => ({ isElectronRuntime: () => true }))

import * as tokens from "@/lib/auth/tokens"
import { GET as getProducts } from "@/app/api/products/route"

function req(url: string, init?: RequestInit) {
  return new NextRequest(new URL(`http://localhost:3000${url}`), init as never)
}

function authedReq(url: string, init?: RequestInit) {
  return req(url, {
    ...init,
    headers: { ...init?.headers, cookie: "access_token=valid" },
  })
}

function product(overrides: Record<string, unknown> = {}) {
  return {
    id: "p1",
    code: "COD-1",
    name: "Filtro de aceite",
    description: "Filtro original",
    brand: "Renault",
    model: "Logan",
    categoryId: "cat-1",
    purchasePrice: 10,
    salePrice: 20,
    stock: 5,
    minimumStock: 2,
    unit: "unidad",
    supplierId: "sup-1",
    image: null,
    createdAt: new Date("2026-01-01T12:00:00.000Z"),
    isDeleted: false,
    ...overrides,
  }
}

function tokenWith(permissions: string[]) {
  return { sub: "user-1", role: "Administrador", permissions }
}

describe("GET /api/products", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ name: "brand" }, { name: "model" }])
    mockPrisma.product.findMany.mockResolvedValue([])
    mockPrisma.product.count.mockResolvedValue(0)
    mockPrisma.category.findMany.mockResolvedValue([{ id: "cat-1", name: "Filtros" }])
    mockPrisma.supplier.findMany.mockResolvedValue([{ id: "sup-1", name: "Proveedor SA" }])
  })

  it("returns 401 without a session", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(null)
    const res = await getProducts(req("/api/products"))
    expect(res.status).toBe(401)
  })

  it("returns 403 without product permissions", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(tokenWith(["dashboard"]) as never)
    const res = await getProducts(authedReq("/api/products"))
    expect(res.status).toBe(403)
  })

  it("returns a paginated payload with category and supplier names", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(tokenWith(["products.read"]) as never)
    mockPrisma.product.findMany.mockResolvedValue([product()])
    mockPrisma.product.count.mockResolvedValue(1)

    const body = await (await getProducts(authedReq("/api/products?page=1&limit=10"))).json()

    expect(body.pagination).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 })
    expect(body.data).toHaveLength(1)
    expect(body.data[0]).toMatchObject({
      id: "p1",
      brand: "Renault",
      model: "Logan",
      description: "Filtro original",
      category: "Filtros",
      supplierName: "Proveedor SA",
      status: "active",
    })
  })

  it("applies category and supplier filters", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(tokenWith(["products.all"]) as never)

    await getProducts(authedReq("/api/products?categoryId=cat-1&supplierId=sup-1"))

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isDeleted: false, categoryId: "cat-1", supplierId: "sup-1" },
      }),
    )
  })

  it("searches by name, code, brand and model", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(tokenWith(["products"]) as never)

    await getProducts(authedReq("/api/products?search=filtro"))

    const where = mockPrisma.product.findMany.mock.calls[0][0].where
    expect(where.OR).toHaveLength(4)
    expect(where.OR).toEqual(
      expect.arrayContaining([
        { name: { contains: "filtro", mode: "insensitive" } },
        { code: { contains: "filtro", mode: "insensitive" } },
        { brand: { contains: "filtro", mode: "insensitive" } },
        { model: { contains: "filtro", mode: "insensitive" } },
      ]),
    )
  })

  it("filters low stock rows and paginates them locally", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(tokenWith(["products.list"]) as never)
    mockPrisma.product.findMany.mockResolvedValue([
      product({ id: "p1", stock: 1, minimumStock: 2 }),
      product({ id: "p2", stock: 5, minimumStock: 2 }),
      product({ id: "p3", stock: 2, minimumStock: 2 }),
    ])

    const body = await (await getProducts(authedReq("/api/products?lowStock=true"))).json()

    expect(body.pagination.total).toBe(2)
    expect(body.data.map((row: { id: string }) => row.id)).toEqual(["p1", "p3"])
    expect(mockPrisma.product.count).not.toHaveBeenCalled()
  })

  it("returns 500 when the database fails", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(tokenWith(["products.read"]) as never)
    mockPrisma.product.findMany.mockRejectedValue(new Error("db fail"))

    const res = await getProducts(authedReq("/api/products"))
    expect(res.status).toBe(500)
  })
})
