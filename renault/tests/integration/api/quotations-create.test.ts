import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const { mockPrisma, createQuotation } = vi.hoisted(() => {
  const createQuotation = vi.fn()
  return {
    createQuotation,
    mockPrisma: {
      quotation: { create: createQuotation },
    },
  }
})

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))
vi.mock("@/lib/auth/tokens", () => ({ verifyAccessToken: vi.fn() }))
vi.mock("@/lib/audit-log", () => ({ logAudit: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/lib/notifications", () => ({ createNotification: vi.fn().mockResolvedValue(undefined) }))

import * as tokens from "@/lib/auth/tokens"
import { POST as createQuotationRoute } from "@/app/api/quotations/route"

const VALID_ITEM = {
  productId: "p1",
  quantity: 2,
  price: 25000,
  subtotal: 50000,
}

function buildRequest(body: Record<string, unknown>) {
  return new NextRequest(new URL("http://localhost:3000/api/quotations"), {
    method: "POST",
    headers: { cookie: "access_token=valid", "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

function basePayload(overrides: Record<string, unknown> = {}) {
  return {
    date: "2026-11-14T12:00:00.000Z",
    sellerUserId: "u1",
    items: [VALID_ITEM],
    subtotal: 50000,
    tax: 0,
    discount: 0,
    total: 50000,
    validUntil: "2026-12-14T00:00:00.000Z",
    status: "pendiente",
    ...overrides,
  }
}

describe("POST /api/quotations", () => {
  beforeEach(() => {
    createQuotation.mockReset()
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue({
      sub: "u1",
      role: "Administrador",
      permissions: ["quotations.create"],
    } as never)

    createQuotation.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "q1",
      ...data,
      validUntil: new Date(String(data.validUntil)),
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [VALID_ITEM],
    }))
  })

  it("crea la cotización con cliente no registrado cuando clientId viene vacío", async () => {
    const response = await createQuotationRoute(
      buildRequest(
        basePayload({
          clientId: "",
          customClientName: "Cliente Prueba",
          customClientPhone: "70012345",
        }),
      ),
    )

    expect(response.status).toBe(201)
    const data = createQuotation.mock.calls[0][0].data
    expect(data.clientId).toBeNull()
    expect(data.externalClientName).toBe("Cliente Prueba")
    expect(data.externalClientPhone).toBe("70012345")
  })

  it("crea la cotización con cliente registrado cuando clientId tiene valor", async () => {
    const response = await createQuotationRoute(
      buildRequest(basePayload({ clientId: "c1" })),
    )

    expect(response.status).toBe(201)
    const data = createQuotation.mock.calls[0][0].data
    expect(data.clientId).toBe("c1")
    expect(data.externalClientName).toBeUndefined()
  })

  it("crea la solicitud a proveedores con precios en cero", async () => {
    const response = await createQuotationRoute(
      buildRequest(
        basePayload({
          clientId: null,
          items: [{ productId: "p1", quantity: 2, price: 0, subtotal: 0 }],
          subtotal: 0,
          total: 0,
          status: "solicitado",
        }),
      ),
    )

    expect(response.status).toBe(201)
    const data = createQuotation.mock.calls[0][0].data
    expect(data.status).toBe("solicitado")
    expect(data.items.create[0].price).toBe(0)
  })

  it("sigue rechazando una cotización normal con precio cero", async () => {
    const response = await createQuotationRoute(
      buildRequest(
        basePayload({
          clientId: "c1",
          items: [{ productId: "p1", quantity: 2, price: 0, subtotal: 0 }],
          subtotal: 0,
          total: 0,
        }),
      ),
    )

    expect(response.status).toBe(400)
    expect(createQuotation).not.toHaveBeenCalled()
  })
})
