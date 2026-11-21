import { describe, it, expect } from "vitest"
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatCompactNumber,
  formatStatNumber,
  formatRelativeTime,
  getStockColor,
  truncate,
} from "@/lib/format-utils"

describe("formatCurrency", () => {
  it("should format integer number", () => {
    const result = formatCurrency(10560)
    // "10.560" depending on locale
    expect(result).toContain("10")
    expect(result).toContain("560")
  })

  it("should format decimal number", () => {
    const result = formatCurrency(10560.3)
    expect(result).toContain("10")
    expect(result).toContain("560")
  })

  it("should handle string input", () => {
    const result = formatCurrency("500")
    expect(result).toBeDefined()
  })

  it("should handle zero", () => {
    expect(formatCurrency(0)).toBeDefined()
  })

  it("should handle NaN gracefully", () => {
    const result = formatCurrency(NaN)
    expect(result).toBe("0")
  })

  it("should handle Infinity gracefully", () => {
    const result = formatCurrency(Infinity)
    expect(result).toBe("0")
  })
})

describe("formatDate", () => {
  it("should format ISO date string to DD/MM/YYYY", () => {
    const result = formatDate("2026-07-28")
    expect(result).toContain("28")
    expect(result).toContain("07")
    expect(result).toContain("2026")
  })

  it("should handle Date object", () => {
    const d = new Date(2026, 0, 15) // Jan 15
    const result = formatDate(d)
    expect(result).toContain("15")
    expect(result).toContain("01")
    expect(result).toContain("2026")
  })

  it("should handle full datetime string", () => {
    const result = formatDate("2026-07-28T14:30:00Z")
    expect(result).toContain("28")
    expect(result).toContain("07")
    expect(result).toContain("2026")
  })
})

describe("formatDateTime", () => {
  it("should include date and time components", () => {
    const result = formatDateTime("2026-07-28T14:30:00")
    expect(result).toContain("28")
    expect(result).toContain("07")
    expect(result).toContain("2026")
    expect(result).toContain("30") // minutes should be present
    // Time format varies by locale (12h or 24h) — just check it has digits
    expect(result).toMatch(/\d{2}/)
  })
})

describe("formatNumber", () => {
  it("should format with thousands separator", () => {
    const result = formatNumber(10560)
    expect(result).toContain("10")
    expect(result).toContain("560")
  })

  it("should handle small numbers", () => {
    expect(formatNumber(42)).toBe("42")
  })

  it("should handle zero", () => {
    expect(formatNumber(0)).toBe("0")
  })
})

describe("formatCompactNumber", () => {
  it("should format thousands compactly", () => {
    const result = formatCompactNumber(1500)
    expect(result).toContain("1")
  })

  it("should format millions compactly", () => {
    const result = formatCompactNumber(2500000)
    expect(result).toContain("2")
  })

  it("should format small numbers without compact", () => {
    const result = formatCompactNumber(42)
    expect(result).toEqual("42")
  })
})

describe("formatStatNumber", () => {
  it("should format small number as regular", () => {
    const result = formatStatNumber(42)
    expect(result).toBe("42")
  })

  it("should format large number as compact", () => {
    const result = formatStatNumber(2500)
    expect(result).not.toBe("2500")
    // Should be compact like "2.5k" or similar
    expect(result.length).toBeLessThan(6)
  })

  it("should handle negative numbers", () => {
    const result = formatStatNumber(-500)
    expect(result).toContain("-")
  })
})

describe("formatRelativeTime", () => {
  it('should return "hace un momento" for very recent', () => {
    const result = formatRelativeTime(new Date())
    expect(result).toBe("hace un momento")
  })

  it("should return minutes for recent times", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
    const result = formatRelativeTime(fiveMinAgo)
    expect(result).toMatch(/hace \d+ minutos?/)
  })

  it("should return hours for older times", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
    const result = formatRelativeTime(twoHoursAgo)
    expect(result).toMatch(/hace \d+ horas?/)
  })

  it("should return days for older times", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    const result = formatRelativeTime(threeDaysAgo)
    expect(result).toMatch(/hace \d+ días?/)
  })

  it("should fall back to date for > 7 days", () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    const result = formatRelativeTime(tenDaysAgo)
    // Should NOT say "días" (that's only for > 0 and <= 7)
    expect(result).not.toMatch(/hace 10 días/)
    // Instead it should return a formatted date
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/)
  })
})

describe("getStockColor", () => {
  it('should return "destructive" when stock <= 50% of minimum', () => {
    expect(getStockColor(5, 10)).toBe("destructive")
    expect(getStockColor(0, 10)).toBe("destructive")
  })

  it('should return "warning" when stock between 50% and 100%', () => {
    expect(getStockColor(7, 10)).toBe("warning")
    expect(getStockColor(10, 10)).toBe("warning")
  })

  it('should return "success" when stock exceeds minimum', () => {
    expect(getStockColor(15, 10)).toBe("success")
    expect(getStockColor(100, 10)).toBe("success")
  })

  it("should handle zero minimum stock", () => {
    // Zero minimum = no warning
    expect(getStockColor(0, 0)).toBe("success")
  })
})

describe("truncate", () => {
  it("should return text unchanged if under max length", () => {
    expect(truncate("hello", 10)).toBe("hello")
  })

  it("should add ellipsis when text exceeds max length", () => {
    const result = truncate("hello world", 5)
    expect(result).toBe("hello...")
  })

  it("should handle exact max length", () => {
    expect(truncate("hello", 5)).toBe("hello")
  })

  it("should handle empty string", () => {
    expect(truncate("", 5)).toBe("")
  })
})
