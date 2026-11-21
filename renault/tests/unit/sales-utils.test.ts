import { describe, it, expect } from "vitest"
import {
  parseDateStartLocal,
  parseDateEndLocal,
  formatDateLocal,
  normalizePaymentMethod,
  normalizeSaleType,
  safeInitialPayment,
  validateSalePayload,
} from "@/lib/sales-utils"

describe("parseDateStartLocal", () => {
  it("should return start of day for valid date", () => {
    const d = parseDateStartLocal("2026-07-28")
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(6) // 0-indexed
    expect(d.getDate()).toBe(28)
    expect(d.getHours()).toBe(0)
    expect(d.getMinutes()).toBe(0)
    expect(d.getSeconds()).toBe(0)
  })

  it("should handle single-digit month and day", () => {
    const d = parseDateStartLocal("2026-01-05")
    expect(d.getMonth()).toBe(0)
    expect(d.getDate()).toBe(5)
  })

  it("should handle missing day and month gracefully", () => {
    const d = parseDateStartLocal("2026")
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(0) // defaults to january - 0
    expect(d.getDate()).toBe(1) // defaults to 1
  })
})

describe("parseDateEndLocal", () => {
  it("should return end of day for valid date", () => {
    const d = parseDateEndLocal("2026-07-28")
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(6)
    expect(d.getDate()).toBe(28)
    expect(d.getHours()).toBe(23)
    expect(d.getMinutes()).toBe(59)
    expect(d.getSeconds()).toBe(59)
  })
})

describe("formatDateLocal", () => {
  it("should format date to YYYY-MM-DD", () => {
    const d = new Date(2026, 6, 28)
    expect(formatDateLocal(d)).toBe("2026-07-28")
  })

  it("should pad single-digit month and day", () => {
    const d = new Date(2026, 0, 5)
    expect(formatDateLocal(d)).toBe("2026-01-05")
  })
})

describe("normalizePaymentMethod", () => {
  it("should lowercase and strip accents", () => {
    expect(normalizePaymentMethod("CRÉDITO")).toBe("credito")
    expect(normalizePaymentMethod("Transferencia")).toBe("transferencia")
    expect(normalizePaymentMethod("Efectivo")).toBe("efectivo")
  })

  it("should handle null or undefined", () => {
    expect(normalizePaymentMethod(null)).toBe("")
    expect(normalizePaymentMethod(undefined)).toBe("")
  })

  it("should handle already normalized string", () => {
    expect(normalizePaymentMethod("qr")).toBe("qr")
  })
})

describe("normalizeSaleType", () => {
  it('should return "credito" for credit-related inputs', () => {
    expect(normalizeSaleType("crédito")).toBe("credito")
    expect(normalizeSaleType("CREDITO")).toBe("credito")
    expect(normalizeSaleType("Credito")).toBe("credito")
  })

  it('should return "contado" for anything else', () => {
    expect(normalizeSaleType("contado")).toBe("contado")
    expect(normalizeSaleType("efectivo")).toBe("contado")
    expect(normalizeSaleType("")).toBe("contado")
    expect(normalizeSaleType(null)).toBe("contado")
    expect(normalizeSaleType(undefined)).toBe("contado")
  })
})

describe("safeInitialPayment", () => {
  it("should return the amount if within range", () => {
    expect(safeInitialPayment(50, 100)).toBe(50)
  })

  it("should clamp to total if amount exceeds total", () => {
    expect(safeInitialPayment(200, 100)).toBe(100)
  })

  it("should return 0 for null/undefined", () => {
    expect(safeInitialPayment(null, 100)).toBe(0)
    expect(safeInitialPayment(undefined, 100)).toBe(0)
  })

  it("should return 0 for negative values", () => {
    expect(safeInitialPayment(-10, 100)).toBe(0)
  })

  it("should parse number strings", () => {
    expect(safeInitialPayment("75", 100)).toBe(75)
  })
})

describe("validateSalePayload", () => {
  it("should return null for valid payload", () => {
    const err = validateSalePayload({
      date: "2026-07-28",
      sellerUserId: "user-1",
      clientId: "client-1",
      saleType: "contado",
      items: [{ productId: "p1", quantity: 1, price: 10, subtotal: 10 }],
    })
    expect(err).toBeNull()
  })

  it("should return null for cash sale without client", () => {
    const err = validateSalePayload({
      date: "2026-07-28",
      sellerUserId: "user-1",
      saleType: "contado",
      items: [{ productId: "p1", quantity: 1, price: 10, subtotal: 10 }],
    })
    expect(err).toBeNull()
  })

  it("should reject missing date", () => {
    const err = validateSalePayload({
      sellerUserId: "user-1",
      clientId: "client-1",
      items: [],
    })
    expect(err).toBe("Fecha y vendedor requeridos")
  })

  it("should reject missing seller", () => {
    const err = validateSalePayload({
      date: "2026-07-28",
      clientId: "client-1",
      items: [],
    })
    expect(err).toBe("Fecha y vendedor requeridos")
  })

  it("should reject empty items array", () => {
    const err = validateSalePayload({
      date: "2026-07-28",
      sellerUserId: "user-1",
      clientId: "client-1",
      items: [],
    })
    expect(err).toBe("La venta debe tener al menos un producto")
  })

  it("should reject credit sale without clientId", () => {
    const err = validateSalePayload({
      date: "2026-07-28",
      sellerUserId: "user-1",
      saleType: "credito",
      items: [{ productId: "p1", quantity: 1, price: 10, subtotal: 10 }],
    })
    expect(err).toBe("Para ventas a crédito debés seleccionar un cliente")
  })

  it("should reject credit sale with empty clientId", () => {
    const err = validateSalePayload({
      date: "2026-07-28",
      sellerUserId: "user-1",
      saleType: "credito",
      clientId: " ",
      items: [{ productId: "p1", quantity: 1, price: 10, subtotal: 10 }],
    })
    expect(err).toBe("Para ventas a crédito debés seleccionar un cliente")
  })

  it("should reject credit sale inferred from paymentMethod", () => {
    const err = validateSalePayload({
      date: "2026-07-28",
      sellerUserId: "user-1",
      paymentMethod: "crédito",
      items: [{ productId: "p1", quantity: 1, price: 10, subtotal: 10 }],
    })
    expect(err).toBe("Para ventas a crédito debés seleccionar un cliente")
  })
})
