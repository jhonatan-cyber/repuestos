import { describe, it, expect } from "vitest"
import { z } from "zod"
import {
  createErrorResponse,
  createSuccessResponse,
  handleZodError,
  handleApiError,
} from "@/lib/api-utils"

describe("createErrorResponse", () => {
  it("returns 500 with default status", () => {
    const res = createErrorResponse("Algo salió mal")
    expect(res.status).toBe(500)
    return res.json().then((body) => expect(body.error).toBe("Algo salió mal"))
  })

  it("uses custom status", () => {
    const res = createErrorResponse("No autorizado", 401)
    expect(res.status).toBe(401)
  })

  it("includes details when provided", () => {
    const details = { field: "email", reason: "already exists" }
    const res = createErrorResponse("Conflict", 409, details)
    return res.json().then((body) => {
      expect(body.details).toEqual(details)
    })
  })

  it("omits details when not provided", () => {
    const res = createErrorResponse("Error")
    return res.json().then((body) => expect(body.details).toBeUndefined())
  })
})

describe("createSuccessResponse", () => {
  it("returns 200 with data", () => {
    const data = { id: 1, name: "Test" }
    const res = createSuccessResponse(data)
    expect(res.status).toBe(200)
    return res.json().then((body) => expect(body).toEqual(data))
  })

  it("uses custom status", () => {
    const res = createSuccessResponse({ ok: true }, 201)
    expect(res.status).toBe(201)
  })
})

describe("handleZodError", () => {
  it("returns 400 for validation errors from the installed Zod version", async () => {
    const result = z.object({ name: z.string() }).safeParse({ name: 123 })
    expect(result.success).toBe(false)
    if (result.success) throw new Error("Expected validation to fail")
    const response = handleApiError(result.error, "Error al guardar")
    expect(response.status).toBe(400)
    expect((await response.json()).details).toEqual(result.error.issues)
  })
  it("returns null for non-Zod errors", () => {
    expect(handleZodError(new Error("generic"))).toBeNull()
    expect(handleZodError("string error")).toBeNull()
    expect(handleZodError(null)).toBeNull()
  })

  it("returns 400 error with Zod issues for ZodError", () => {
    const zodError = { name: "ZodError", errors: [{ path: ["name"], message: "Required" }] }
    const res = handleZodError(zodError)
    expect(res).not.toBeNull()
    expect(res!.status).toBe(400)
    return res!.json().then((body) => {
      expect(body.error).toBe("Datos inválidos")
      expect(body.details).toEqual(zodError.errors)
    })
  })
})

describe("handleApiError", () => {
  it("delegates ZodError to handleZodError", () => {
    const zodError = { name: "ZodError", errors: [] }
    const res = handleApiError(zodError, "default message")
    expect(res.status).toBe(400)
  })

  it("returns default message for generic errors", () => {
    const res = handleApiError(new Error("something broke"), "Error al guardar")
    expect(res.status).toBe(500)
    return res.json().then((body) => expect(body.error).toBe("Error al guardar"))
  })

  it("uses custom status for generic errors", () => {
    const res = handleApiError("fail", "Custom error", 503)
    expect(res.status).toBe(503)
  })
})
