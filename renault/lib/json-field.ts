/**
 * Helpers para campos que Prisma almacena como `String` pero contienen JSON.
 *
 * POR QUÉ existen: SQLite no tiene tipo JSON nativo; el schema dual (SQLite + Postgres)
 * obliga a usar `String` en el modelo base para que ambos motores sean compatibles.
 * Postgres podría usar `Json` nativo, pero cambiar el tipo rompería la generación del
 * schema dual sin beneficio real para la lógica de la app.
 *
 * USO:
 *   // Leer desde la BD (Prisma devuelve String)
 *   const splits = parseJsonField<PaymentSplit[]>(sale.paymentSplits, [])
 *
 *   // Escribir hacia la BD
 *   const data = { paymentSplits: serializeJsonField(splits) }
 */

/** Parsea un campo String? que contiene JSON. Devuelve `fallback` en caso de error. */
export function parseJsonField<T>(value: string | null | undefined, fallback: T): T {
  if (value == null || value === "") return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

/** Serializa un valor a JSON string para guardarlo en la BD. Devuelve null si el valor es null/undefined. */
export function serializeJsonField<T>(value: T | null | undefined): string | null {
  if (value == null) return null
  return JSON.stringify(value)
}

// ─── Role.permissions ─────────────────────────────────────────────────────────
// `Role.permissions` es un String que contiene un array JSON de strings, ej.:
//   '["sales.create","sales.read","cash.withdraw"]'
// Fuente única de parsing/serialización para evitar duplicación en las rutas API.

/** Parsea `Role.permissions` (String) en string[]. Filtra valores no-string. */
export function parsePermissions(raw: string | null | undefined): string[] {
  const arr = parseJsonField<unknown[]>(raw, [])
  return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : []
}

/** Serializa un array de permisos a String para guardarlo en `Role.permissions`. */
export function serializePermissions(permissions: string[]): string {
  return JSON.stringify(permissions)
}

// ─── Tipos de los campos JSON conocidos ──────────────────────────────────────

export interface PaymentSplit {
  method: "efectivo" | "transferencia" | "crédito" | "qr"
  amount: number
  reference?: string
}

export interface AuditChanges {
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  description?: string
}

export interface AuditMetadata {
  cashImpact?: number
  creditId?: string
  [key: string]: unknown
}

export interface NotificationMetadata {
  [key: string]: unknown
}
