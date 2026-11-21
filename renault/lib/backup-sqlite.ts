import { BACKUP_MODELS, LEGACY_OPTIONAL_BACKUP_MODELS, SQLITE_MODEL_TABLES } from "./backup-models"

/**
 * Convierte una copia cruda de SQLite (`.db`) al mismo payload que genera
 * `/api/backup`, para que una copia hecha en escritorio se pueda restaurar desde
 * la web y viceversa.
 *
 * La lectura usa `sql.js` (SQLite en WASM) para no depender de un módulo nativo:
 * en web la base es PostgreSQL, así que el `.db` nunca se abre como base activa,
 * sólo se lee para exportar sus filas.
 */

/**
 * Tope de la copia `.db` en web: el archivo viaja por la red, así que el límite
 * es chico y se controla antes de leerlo.
 */
export const MAX_SQLITE_BACKUP_BYTES = 25 * 1024 * 1024

/**
 * Tope en escritorio: el archivo se lee del disco de la misma máquina y no viaja
 * por la red, así que puede ser bastante más grande. No se desactiva ninguna
 * validación (cabecera SQLite, tablas presentes, límites por modelo y
 * transacción); sólo cambia el tamaño máximo aceptado.
 */
export const MAX_SQLITE_BACKUP_BYTES_DESKTOP = 256 * 1024 * 1024

/** Tamaño máximo de `.db` según el runtime que hace la restauración. */
export function getMaxSqliteBackupBytes(runtime?: string): number {
  return runtime === "electron" ? MAX_SQLITE_BACKUP_BYTES_DESKTOP : MAX_SQLITE_BACKUP_BYTES
}

/** Tamaño máximo del backup JSON según el runtime que hace la restauración. */
export const MAX_JSON_BACKUP_BYTES = 25 * 1024 * 1024
export const MAX_JSON_BACKUP_BYTES_DESKTOP = 256 * 1024 * 1024

export function getMaxJsonBackupBytes(runtime?: string): number {
  return runtime === "electron" ? MAX_JSON_BACKUP_BYTES_DESKTOP : MAX_JSON_BACKUP_BYTES
}

/** Límite en MB legible para los mensajes de error. */
export function formatBackupByteLimit(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))}MB`
}

const SQLITE_HEADER = "SQLite format 3"

export class SqliteBackupError extends Error {
  readonly status = 400

  constructor(message: string) {
    super(message)
    this.name = "SqliteBackupError"
  }
}

export interface BackupPayload {
  meta: {
    format: "json"
    generatedAt: string
    runtime?: string
    sourceDatabase: string
    models: readonly string[]
    restoredFrom?: string
  }
  data: Record<string, Record<string, unknown>[]>
}

export function isSqliteBackup(buffer: Buffer): boolean {
  if (buffer.length < SQLITE_HEADER.length) return false
  return buffer.subarray(0, SQLITE_HEADER.length).toString("latin1") === SQLITE_HEADER
}

/** Normaliza un valor de SQLite al tipo que espera Prisma. */
export function normalizeSqliteValue(declaredType: string, value: unknown): unknown {
  if (value === null || value === undefined) return null

  const type = declaredType.toUpperCase()

  if (type.includes("BOOL")) return Boolean(value)

  if (type.includes("DATE") || type.includes("TIME")) {
    const date = value instanceof Date ? value : new Date(value as string | number)
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
  }

  if (type.includes("INT")) return Number(value)

  if (
    type.includes("REAL") ||
    type.includes("FLOA") ||
    type.includes("DOUB") ||
    type.includes("NUM")
  ) {
    return Number(value)
  }

  if (value instanceof Uint8Array) return Buffer.from(value).toString("base64")

  return value
}

export async function sqliteBufferToBackupPayload(
  buffer: Buffer,
  options: { runtime?: string; maxBytes?: number } = {},
): Promise<BackupPayload> {
  const maxBytes = options.maxBytes ?? getMaxSqliteBackupBytes(options.runtime)

  if (buffer.length === 0) throw new SqliteBackupError("El archivo está vacío")
  if (buffer.length > maxBytes) {
    throw new SqliteBackupError(
      `La copia SQLite supera el máximo de ${formatBackupByteLimit(maxBytes)}`,
    )
  }
  if (!isSqliteBackup(buffer)) {
    throw new SqliteBackupError("El archivo no es una base SQLite válida")
  }

  const db = await openSqliteDatabase(buffer)

  try {
    const tables = new Set<string>()
    for (const row of db.exec("SELECT name FROM sqlite_master WHERE type = 'table'")[0]?.values ??
      []) {
      tables.add(String(row[0]))
    }

    const data: Record<string, Record<string, unknown>[]> = {}

    for (const model of BACKUP_MODELS) {
      const table = SQLITE_MODEL_TABLES[model]

      if (!tables.has(table)) {
        if (LEGACY_OPTIONAL_BACKUP_MODELS.has(model)) continue
        throw new SqliteBackupError(
          `La copia SQLite no contiene la tabla "${table}". Generá una copia con esta versión de la app.`,
        )
      }

      const columns = db.exec(`PRAGMA table_info("${table}")`)[0]?.values ?? []
      const declaredTypes = new Map<string, string>(
        columns.map((column) => [String(column[1]), String(column[2] ?? "")]),
      )

      const result = db.exec(`SELECT * FROM "${table}"`)[0]
      if (!result) {
        data[model] = []
        continue
      }

      data[model] = result.values.map((values) => {
        const record: Record<string, unknown> = {}
        result.columns.forEach((column, index) => {
          record[column] = normalizeSqliteValue(declaredTypes.get(column) ?? "", values[index])
        })
        return record
      })
    }

    return {
      meta: {
        format: "json",
        generatedAt: new Date().toISOString(),
        runtime: options.runtime,
        sourceDatabase: "sqlite",
        models: BACKUP_MODELS,
        restoredFrom: "sqlite-file",
      },
      data,
    }
  } catch (error) {
    if (error instanceof SqliteBackupError) throw error
    throw new SqliteBackupError(
      "La copia SQLite está dañada o no se puede leer (¿se copió completa?)",
    )
  } finally {
    db.close()
  }
}

/**
 * Abre la copia con `sql.js` traduciendo cualquier fallo a un error 400.
 * `sql.js` resuelve `sql-wasm.wasm` desde su propio directorio (está en
 * `serverExternalPackages`, así que en runtime se carga desde node_modules).
 */
async function openSqliteDatabase(buffer: Buffer) {
  try {
    const { default: initSqlJs } = await import("sql.js")
    const SQL = await initSqlJs()
    return new SQL.Database(new Uint8Array(buffer))
  } catch (error) {
    if (error instanceof SqliteBackupError) throw error
    throw new SqliteBackupError(
      "La copia SQLite está dañada o no se puede leer (¿se copió completa?)",
    )
  }
}
