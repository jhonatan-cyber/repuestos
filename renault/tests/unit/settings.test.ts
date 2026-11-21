import { describe, it, expect, vi, beforeEach } from "vitest"

const mockPrisma = vi.hoisted(() => ({
  systemConfig: {
    findFirst: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
}))

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))

import { getSettings, updateSettings } from "@/lib/settings"

describe("getSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns defaults when no config exists", async () => {
    mockPrisma.systemConfig.findFirst.mockResolvedValue(null)
    const result = await getSettings()
    expect(result).toEqual({
      companyName: "Renault Reluz",
      companySlogan: "Repuestos automotrices",
      companyAddress: "Av. Confital - Av. Blanco Galindo Km 14.5",
      companyCity: "Quillacollo - Cochabamba",
      companyPhone: "+591 63070278",
      companyNit: "000000",
      hasLogo: false,
    })
  })

  it("returns stored values when config exists", async () => {
    mockPrisma.systemConfig.findFirst.mockResolvedValue({
      companyName: "Mi Empresa",
      companySlogan: "Lo mejor",
      companyAddress: "Calle falsa 123",
      companyCity: "La Paz",
      companyPhone: "+591 12345678",
      companyNit: "123456",
      logoBase64: "iVBORw0KGgo=",
      logoMime: "image/png",
    })
    const result = await getSettings()
    expect(result).toEqual({
      companyName: "Mi Empresa",
      companySlogan: "Lo mejor",
      companyAddress: "Calle falsa 123",
      companyCity: "La Paz",
      companyPhone: "+591 12345678",
      companyNit: "123456",
      hasLogo: true,
    })
  })

  it("returns hasLogo=false when logoBase64 is empty string", async () => {
    mockPrisma.systemConfig.findFirst.mockResolvedValue({
      companyName: "Test",
      logoBase64: "",
    })
    const result = await getSettings()
    expect(result.hasLogo).toBe(false)
  })
})

describe("updateSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("updates existing config when it exists", async () => {
    const existing = { id: 1, companyName: "Old" }
    mockPrisma.systemConfig.findFirst.mockResolvedValueOnce(existing).mockResolvedValueOnce({
      ...existing,
      companyName: "Newco",
      companySlogan: "",
      companyAddress: "",
      companyCity: "",
      companyPhone: "",
      companyNit: "",
      hasLogo: false,
    })

    mockPrisma.systemConfig.update.mockResolvedValue({})

    const result = await updateSettings({ companyName: "Newco" })

    expect(mockPrisma.systemConfig.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { companyName: "Newco" },
    })
    expect(result.companyName).toBe("Newco")
  })

  it("creates new config when none exists", async () => {
    const created = {
      id: 1,
      companyName: "Freshco",
      companySlogan: "",
      companyAddress: "",
      companyCity: "",
      companyPhone: "",
      companyNit: "",
    }
    mockPrisma.systemConfig.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(created)

    mockPrisma.systemConfig.create.mockResolvedValue({})

    const result = await updateSettings({ companyName: "Freshco" })

    expect(mockPrisma.systemConfig.create).toHaveBeenCalledWith({
      data: { companyName: "Freshco" },
    })
    expect(result.companyName).toBe("Freshco")
  })
})
