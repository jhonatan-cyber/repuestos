import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest, NextResponse } from "next/server"

// ── Mocks ──────────────────────────────────────────────

const mockPrisma = vi.hoisted(() => ({
  systemConfig: {
    findFirst: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
}))

const mockSecurity = vi.hoisted(() => ({
  getApiActor: vi.fn(),
  hasAnyPermission: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))
vi.mock("@/lib/api-security", () => mockSecurity)
vi.mock("@/lib/settings", () => ({
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
}))

import * as logoRoutes from "@/app/api/settings/logo/route"
import * as companyRoutes from "@/app/api/settings/company/route"
import * as settingsLib from "@/lib/settings"

function mockRequest(
  options: {
    method?: string
    body?: string
    headers?: Record<string, string>
    searchParams?: string
  } = {},
): NextRequest {
  const url = `http://localhost:3000${options.searchParams || ""}`
  const init = {
    method: options.method,
    body: options.body,
    headers: options.headers,
  }
  return new NextRequest(url, init)
}

// ── /api/settings/logo ─────────────────────────────────

describe("GET /api/settings/logo", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns logo binary when config has logoBase64", async () => {
    mockPrisma.systemConfig.findFirst.mockResolvedValue({
      logoBase64: "iVBORw0KGgo=",
      logoMime: "image/png",
    })

    const res = await logoRoutes.GET()
    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toBe("image/png")
    const body = await res.arrayBuffer()
    expect(new Uint8Array(body)).toEqual(new Uint8Array(Buffer.from("iVBORw0KGgo=", "base64")))
  })

  it("falls back to default mime when logoMime is null", async () => {
    mockPrisma.systemConfig.findFirst.mockResolvedValue({
      logoBase64: "iVBORw0KGgo=",
      logoMime: null,
    })

    const res = await logoRoutes.GET()
    expect(res.headers.get("Content-Type")).toBe("image/png")
  })

  it("serves fallback image when no config exists", async () => {
    mockPrisma.systemConfig.findFirst.mockResolvedValue(null)

    const res = await logoRoutes.GET()
    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toBe("image/png")
  })

  it("serves fallback image when logoBase64 is empty", async () => {
    mockPrisma.systemConfig.findFirst.mockResolvedValue({
      logoBase64: "",
      logoMime: "image/png",
    })

    const res = await logoRoutes.GET()
    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toBe("image/png")
  })

  it("serves fallback on prisma error", async () => {
    mockPrisma.systemConfig.findFirst.mockRejectedValue(new Error("DB error"))

    const res = await logoRoutes.GET()
    expect(res.status).toBe(200)
  })
})

describe("POST /api/settings/logo", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const authorizedActor = { userId: "1", role: "admin", permissions: ["settings", "admin"] }

  it("returns 401 when not authenticated", async () => {
    mockSecurity.getApiActor.mockResolvedValue(null)
    mockSecurity.hasAnyPermission.mockReturnValue(true)

    const req = mockRequest({ method: "POST" })
    const res = await logoRoutes.POST(req)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe("No autenticado")
  })

  it("returns 403 when lacks permissions", async () => {
    mockSecurity.getApiActor.mockResolvedValue(authorizedActor)
    mockSecurity.hasAnyPermission.mockReturnValue(false)

    const req = mockRequest({ method: "POST" })
    const res = await logoRoutes.POST(req)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe("Sin permisos")
  })

  it("returns 400 when no file provided", async () => {
    mockSecurity.getApiActor.mockResolvedValue(authorizedActor)
    mockSecurity.hasAnyPermission.mockReturnValue(true)

    const formData = new FormData()
    const req = new NextRequest("http://localhost:3000", { method: "POST", body: formData })
    vi.spyOn(req, "formData").mockResolvedValue(formData)

    const res = await logoRoutes.POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe("Archivo no encontrado")
  })

  it("returns 400 for non-image file type", async () => {
    mockSecurity.getApiActor.mockResolvedValue(authorizedActor)
    mockSecurity.hasAnyPermission.mockReturnValue(true)

    const file = new File(["not-an-image"], "test.txt", { type: "text/plain" })
    const formData = new FormData()
    formData.append("logo", file)
    const req = new NextRequest("http://localhost:3000", { method: "POST", body: formData })

    const res = await logoRoutes.POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe("Solo se permiten imágenes")
  })

  it("returns 400 for oversized file", async () => {
    mockSecurity.getApiActor.mockResolvedValue(authorizedActor)
    mockSecurity.hasAnyPermission.mockReturnValue(true)

    const bigBuffer = Buffer.alloc(3 * 1024 * 1024) // 3MB
    const file = new File([bigBuffer], "big.png", { type: "image/png" })
    const formData = new FormData()
    formData.append("logo", file)
    const req = new NextRequest("http://localhost:3000", { method: "POST", body: formData })

    const res = await logoRoutes.POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe("Máximo 2MB")
  })

  it("saves logo and returns success", async () => {
    mockSecurity.getApiActor.mockResolvedValue(authorizedActor)
    mockSecurity.hasAnyPermission.mockReturnValue(true)
    mockPrisma.systemConfig.findFirst.mockResolvedValue({ id: 1 })

    const file = new File(["fake-png-data"], "logo.png", { type: "image/png" })
    const formData = new FormData()
    formData.append("logo", file)
    const req = new NextRequest("http://localhost:3000", { method: "POST", body: formData })

    const res = await logoRoutes.POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(mockPrisma.systemConfig.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { logoMime: "image/png", logoBase64: expect.any(String) },
    })
  })

  it("creates new record when no config exists", async () => {
    mockSecurity.getApiActor.mockResolvedValue(authorizedActor)
    mockSecurity.hasAnyPermission.mockReturnValue(true)
    mockPrisma.systemConfig.findFirst.mockResolvedValue(null) // no existing

    const file = new File(["fake-png-data"], "logo.png", { type: "image/png" })
    const formData = new FormData()
    formData.append("logo", file)
    const req = new NextRequest("http://localhost:3000", { method: "POST", body: formData })

    const res = await logoRoutes.POST(req)
    expect(res.status).toBe(200)
    expect(mockPrisma.systemConfig.create).toHaveBeenCalled()
  })
})

// ── /api/settings/company ──────────────────────────────

describe("GET /api/settings/company", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns company settings", async () => {
    const fakeSettings = {
      companyName: "Test Corp",
      companySlogan: "Best",
      companyAddress: "123 St",
      companyCity: "NYC",
      companyPhone: "123456",
      companyNit: "999999",
      hasLogo: true,
    }
    vi.mocked(settingsLib.getSettings).mockResolvedValue(fakeSettings)

    const res = await companyRoutes.GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual(fakeSettings)
  })

  it("returns 500 on error", async () => {
    vi.mocked(settingsLib.getSettings).mockRejectedValue(new Error("fail"))

    const res = await companyRoutes.GET()
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe("Error al obtener configuración")
  })
})

describe("PUT /api/settings/company", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const authorizedActor = { userId: "1", role: "admin", permissions: ["settings"] }

  it("returns 401 when not authenticated", async () => {
    mockSecurity.getApiActor.mockResolvedValue(null)
    const req = mockRequest({ method: "PUT", body: "{}" })
    const res = await companyRoutes.PUT(req)
    expect(res.status).toBe(401)
  })

  it("returns 403 when lacks permissions", async () => {
    mockSecurity.getApiActor.mockResolvedValue(authorizedActor)
    mockSecurity.hasAnyPermission.mockReturnValue(false)

    const req = mockRequest({ method: "PUT", body: "{}" })
    const res = await companyRoutes.PUT(req)
    expect(res.status).toBe(403)
  })

  it("updates and returns settings", async () => {
    mockSecurity.getApiActor.mockResolvedValue(authorizedActor)
    mockSecurity.hasAnyPermission.mockReturnValue(true)

    const updatedSettings = {
      companyName: "Newco",
      companySlogan: "",
      companyAddress: "",
      companyCity: "",
      companyPhone: "",
      companyNit: "",
      hasLogo: false,
    }
    vi.mocked(settingsLib.updateSettings).mockResolvedValue(updatedSettings)

    const req = mockRequest({ method: "PUT", body: JSON.stringify({ companyName: "Newco" }) })
    const res = await companyRoutes.PUT(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.companyName).toBe("Newco")
    expect(settingsLib.updateSettings).toHaveBeenCalledWith({ companyName: "Newco" })
  })
})
