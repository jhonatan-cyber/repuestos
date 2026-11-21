import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const mockPrisma = vi.hoisted(() => ({
  systemConfig: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
}))

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))

const mockReadFileSync = vi.hoisted(() => vi.fn())
vi.mock("fs", () => ({ readFileSync: mockReadFileSync }))

vi.mock("@/lib/auth/tokens", () => ({ verifyAccessToken: vi.fn() }))

import * as tokens from "@/lib/auth/tokens"
import { GET as getLogo, POST as postLogo } from "@/app/api/settings/logo/route"
import { GET as getCompany, PUT as putCompany } from "@/app/api/settings/company/route"

const VALID_PAYLOAD = { sub: "user-1", role: "admin", permissions: ["admin"] }

function req(url: string, init?: RequestInit) {
  return new NextRequest(new URL(`http://localhost:3000${url}`), init as any)
}

function authedReq(url: string, init?: RequestInit) {
  return req(url, {
    ...init,
    headers: { ...init?.headers, cookie: "access_token=valid" },
  })
}

describe("GET /api/settings/logo", () => {
  beforeEach(() => vi.clearAllMocks())

  it("serves fallback from disk when no logo in DB", async () => {
    mockPrisma.systemConfig.findFirst.mockResolvedValue(null)
    mockReadFileSync.mockReturnValue(Buffer.from("png-data"))
    const res = await getLogo()
    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toBe("image/png")
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(new Uint8Array(Buffer.from("png-data")))
  })

  it("returns 404 when no logo and no fallback file", async () => {
    mockPrisma.systemConfig.findFirst.mockResolvedValue(null)
    mockReadFileSync.mockImplementation(() => {
      throw new Error("ENOENT")
    })
    expect((await getLogo()).status).toBe(404)
  })

  it("serves cached logo from DB", async () => {
    const b64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    mockPrisma.systemConfig.findFirst.mockResolvedValue({ logoBase64: b64, logoMime: "image/webp" })
    const res = await getLogo()
    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toBe("image/webp")
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(
      new Uint8Array(Buffer.from(b64, "base64")),
    )
  })

  it("falls back on DB error", async () => {
    mockPrisma.systemConfig.findFirst.mockRejectedValue(new Error("db fail"))
    mockReadFileSync.mockReturnValue(Buffer.from("fallback"))
    expect((await getLogo()).status).toBe(200)
  })
})

describe("POST /api/settings/logo", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 401 when not authenticated", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(null)
    const res = await postLogo(req("/api/settings/logo", { method: "POST" }))
    expect(res.status).toBe(401)
    expect((await res.json()).error).toBe("No autenticado")
  })

  it("returns 403 when lacking permissions", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue({
      sub: "u1",
      role: "viewer",
      permissions: ["view"],
    } as any)
    const res = await postLogo(authedReq("/api/settings/logo", { method: "POST" }))
    expect(res.status).toBe(403)
    expect((await res.json()).error).toBe("Sin permisos")
  })

  it("returns 400 when no file uploaded", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(VALID_PAYLOAD as any)
    const res = await postLogo(
      authedReq("/api/settings/logo", { method: "POST", body: new FormData() }),
    )
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe("Archivo no encontrado")
  })

  it("rejects non-image files", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(VALID_PAYLOAD as any)
    const fd = new FormData()
    fd.append("logo", new Blob(["text"], { type: "text/plain" }), "file.txt")
    const res = await postLogo(authedReq("/api/settings/logo", { method: "POST", body: fd }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe("Solo se permiten imágenes")
  })

  it("rejects files over 2MB", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(VALID_PAYLOAD as any)
    const big = new Blob(["x".repeat(3 * 1024 * 1024)], { type: "image/png" })
    const fd = new FormData()
    fd.append("logo", big, "big.png")
    const res = await postLogo(authedReq("/api/settings/logo", { method: "POST", body: fd }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe("Máximo 2MB")
  })

  it("stores logo and returns success", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(VALID_PAYLOAD as any)
    mockPrisma.systemConfig.findFirst.mockResolvedValue({ id: 1 })
    const fd = new FormData()
    fd.append("logo", new Blob(["png-data"], { type: "image/png" }), "logo.png")
    const res = await postLogo(authedReq("/api/settings/logo", { method: "POST", body: fd }))
    expect(res.status).toBe(200)
    expect((await res.json()).success).toBe(true)
    expect(mockPrisma.systemConfig.update).toHaveBeenCalled()
  })

  it("creates config row when none exists", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(VALID_PAYLOAD as any)
    mockPrisma.systemConfig.findFirst.mockResolvedValue(null)
    const fd = new FormData()
    fd.append("logo", new Blob(["data"], { type: "image/png" }), "logo.png")
    const res = await postLogo(authedReq("/api/settings/logo", { method: "POST", body: fd }))
    expect(res.status).toBe(200)
    expect(mockPrisma.systemConfig.create).toHaveBeenCalled()
  })
})

describe("GET /api/settings/company", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns default settings when no config exists", async () => {
    mockPrisma.systemConfig.findFirst.mockResolvedValue(null)
    const res = await getCompany()
    const body = await res.json()
    expect(body.companyName).toBe("Renault Reluz")
    expect(body.hasLogo).toBe(false)
  })

  it("returns stored company info", async () => {
    mockPrisma.systemConfig.findFirst.mockResolvedValue({
      companyName: "Mi Empresa",
      companySlogan: "Lo mejor",
      companyAddress: "Calle 123",
      companyCity: "La Paz",
      companyPhone: "+591 70000000",
      companyNit: "123456",
      logoBase64: "abc",
    })
    const body = await (await getCompany()).json()
    expect(body.companyName).toBe("Mi Empresa")
    expect(body.hasLogo).toBe(true)
  })

  it("returns 500 on DB error", async () => {
    mockPrisma.systemConfig.findFirst.mockRejectedValue(new Error("db fail"))
    const res = await getCompany()
    expect(res.status).toBe(500)
  })
})

describe("PUT /api/settings/company", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 401 when not authenticated", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(null)
    const res = await putCompany(req("/api/settings/company", { method: "PUT" }))
    expect(res.status).toBe(401)
  })

  it("returns 403 when lacking permissions", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue({
      sub: "u1",
      role: "viewer",
      permissions: [],
    } as any)
    const res = await putCompany(authedReq("/api/settings/company", { method: "PUT" }))
    expect(res.status).toBe(403)
  })

  it("updates company settings", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(VALID_PAYLOAD as any)
    mockPrisma.systemConfig.findFirst.mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce({
      companyName: "Updated",
      companySlogan: "",
      companyAddress: "",
      companyCity: "",
      companyPhone: "",
      companyNit: "",
    })
    const res = await putCompany(
      authedReq("/api/settings/company", {
        method: "PUT",
        headers: { "content-type": "application/json", cookie: "access_token=valid" },
        body: JSON.stringify({ companyName: "Updated" }),
      }),
    )
    expect(res.status).toBe(200)
    expect((await res.json()).companyName).toBe("Updated")
  })
})
