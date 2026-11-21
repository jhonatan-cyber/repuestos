import { NextResponse } from "next/server"

type ErrorDetails = Record<string, unknown> | Record<string, unknown>[]

export function createErrorResponse(message: string, status: number = 500, details?: ErrorDetails) {
  return NextResponse.json({ error: message, ...(details && { details }) }, { status })
}

export function createSuccessResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status })
}

export function handleZodError(error: unknown) {
  const zod = error as { name?: string; issues?: ErrorDetails; errors?: ErrorDetails } | null
  const issues = zod?.issues ?? zod?.errors
  if (zod?.name === "ZodError" && issues) {
    return createErrorResponse("Datos inválidos", 400, issues)
  }
  return null
}

export function handleApiError(error: unknown, defaultMessage: string, status: number = 500) {
  const zodError = handleZodError(error)
  if (zodError) return zodError
  if (isPrismaKnownRequestError(error)) {
    if (error.code === "P2002") return createErrorResponse("Conflicto: el registro ya existe", 409)
    if (error.code === "P2025") return createErrorResponse("Registro no encontrado", 404)
  }
  return createErrorResponse(defaultMessage, status)
}

// ponytail: `@prisma/client-runtime-utils` no se resuelve en el standalone de Electron
// (ESM import ignora NODE_PATH), así que detectamos el error por `name` en vez de `instanceof`.
export function isPrismaKnownRequestError(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { name?: unknown }).name === "PrismaClientKnownRequestError" &&
    typeof (error as { code?: unknown }).code === "string"
  )
}

export const PAGINATION_DEFAULTS = { page: 1, limit: 50, maxLimit: 100 } as const

export function getPaginationParams(searchParams: URLSearchParams) {
  const rawPage = parseInt(searchParams.get("page") || "1", 10)
  const rawLimit = parseInt(searchParams.get("limit") || String(PAGINATION_DEFAULTS.limit), 10)
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, PAGINATION_DEFAULTS.maxLimit)
      : PAGINATION_DEFAULTS.limit
  return { page, limit, skip: (page - 1) * limit }
}

export function buildPaginatedResponse<T>(data: T[], total: number, page: number, limit: number) {
  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}
