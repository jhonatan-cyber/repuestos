import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { getDateString, COMPANY_INFO, PdfColumn, loadCompanyInfo } from "@/lib/export/shared"

describe("getDateString", () => {
  afterEach(() => vi.useRealTimers())

  it("keeps the local date late at night", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 15, 23, 30))
    expect(getDateString()).toBe("2026-10-15")
  })

  it("keeps the local date just after midnight", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 16, 0, 30))
    expect(getDateString()).toBe("2026-10-16")
  })
  it("returns today's date in YYYY-MM-DD format", () => {
    const result = getDateString()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it("returns current date consistently", () => {
    const now = new Date()
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    expect(getDateString()).toBe(expected)
  })
})

describe("COMPANY_INFO", () => {
  it("has company name", () => {
    expect(COMPANY_INFO.name).toBeTruthy()
  })

  it("has address", () => {
    expect(COMPANY_INFO.address).toBeTruthy()
  })

  it("has phone", () => {
    expect(COMPANY_INFO.phone).toBeTruthy()
  })

  it("has nit", () => {
    expect(COMPANY_INFO.nit).toBeTruthy()
  })
})

describe("PdfColumn type is structural", () => {
  it("compiles with PdfColumn-like objects", () => {
    const col: PdfColumn = { label: "Nombre", width: 50 }
    expect(col.label).toBe("Nombre")
    expect(col.width).toBe(50)
  })
})

describe("loadCompanyInfo", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("updates COMPANY_INFO from API response", async () => {
    const mockData = {
      companyName: "Test Corp",
      companySlogan: "Best",
      companyAddress: "123 St",
      companyCity: "NYC",
      companyPhone: "123456",
      companyNit: "999999",
    }
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response)

    await loadCompanyInfo()

    expect(COMPANY_INFO.name).toBe("Test Corp")
    expect(COMPANY_INFO.slogan).toBe("Best")
    expect(COMPANY_INFO.address).toBe("123 St")
    expect(COMPANY_INFO.city).toBe("NYC")
    expect(COMPANY_INFO.phone).toBe("123456")
    expect(COMPANY_INFO.nit).toBe("999999")
  })

  it("preserves fallback defaults on failed fetch", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"))

    await loadCompanyInfo()

    expect(COMPANY_INFO.name).toBe("Renault Reluz")
    expect(COMPANY_INFO.address).toBe("Av. Confital - Av. Blanco Galindo Km 14.5")
    expect(COMPANY_INFO.phone).toBe("+591 63070278")
    expect(COMPANY_INFO.nit).toBe("000000")
  })
})
