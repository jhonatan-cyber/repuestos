import { describe, it, expect } from "vitest"
import { cn } from "@/lib/utils"

describe("cn (className merger)", () => {
  it("should merge two class strings", () => {
    const result = cn("foo", "bar")
    expect(result).toBe("foo bar")
  })

  it("should handle array of class strings", () => {
    const result = cn(["foo", "bar"], "baz")
    expect(result).toBe("foo bar baz")
  })

  it("should handle empty inputs", () => {
    const result = cn("", "bar")
    expect(result).toBe("bar")
  })

  it("should handle undefined inputs", () => {
    const result = cn("foo", undefined, "bar")
    expect(result).toBe("foo bar")
  })

  it("should handle conditional classes", () => {
    const isActive = true
    const result = cn("base", isActive && "active")
    expect(result).toBe("base active")
  })

  it("should handle false conditionals", () => {
    const isActive = false
    const result = cn("base", isActive && "active")
    expect(result).toBe("base")
  })

  it("should merge tailwind classes correctly (twMerge)", () => {
    const result = cn("px-2 px-4", "mx-2")
    // twMerge should keep the last conflicting class
    expect(result).toBe("px-4 mx-2")
  })
})
