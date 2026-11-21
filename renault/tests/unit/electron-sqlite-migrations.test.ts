import { describe, expect, it, beforeAll, beforeEach, afterEach } from "vitest"
import { createRequire } from "node:module"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { DatabaseSync } from "node:sqlite"

const require = createRequire(import.meta.url)
const {
  MIGRATIONS,
  MIGRATIONS_TABLE,
  migrateDesktopDatabase,
} = require("../../lib/electron/sqlite-migrations.js")
const { ensureDesktopDatabase } = require("../../lib/electron/db-manager.js")

const USERS_TABLE = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT NOT NULL PRIMARY KEY,
    ci TEXT NOT NULL UNIQUE,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    image TEXT,
    role TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL,
    isDeleted BOOLEAN NOT NULL DEFAULT false,
    lastSyncedAt DATETIME
  )
`

const SALES_TABLE = `
  CREATE TABLE IF NOT EXISTS sales (
    id TEXT NOT NULL PRIMARY KEY,
    total REAL NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`

const QUOTATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS quotations (
    id TEXT NOT NULL PRIMARY KEY,
    total REAL NOT NULL
  )
`

/** Base "vieja": sólo algunas tablas y sin las columnas agregadas después. */
function createLegacyDatabase(filePath: string) {
  const db = new DatabaseSync(filePath)
  db.exec(USERS_TABLE)
  db.exec(SALES_TABLE)
  db.exec(QUOTATIONS_TABLE)
  db.close()
}

function query(filePath: string, sql: string, args: unknown[] = []) {
  const db = new DatabaseSync(filePath, { readOnly: true })
  try {
    return db.prepare(sql).all(...(args as never[])) as Record<string, unknown>[]
  } finally {
    db.close()
  }
}

function tableNames(filePath: string): string[] {
  return query(filePath, "SELECT name FROM sqlite_master WHERE type = 'table'").map((row) =>
    String(row.name),
  )
}

function columnNames(filePath: string, table: string): string[] {
  return query(filePath, `PRAGMA table_info("${table}")`).map((row) => String(row.name))
}

describe("migraciones de esquema SQLite (escritorio)", () => {
  const baseDir = path.join(os.tmpdir(), "renault-sqlite-migrations-tests")
  let dir: string
  let dbPath: string

  beforeAll(() => {
    try {
      fs.rmSync(baseDir, { recursive: true, force: true })
    } catch {
      // carpeta bloqueada por una corrida anterior
    }
  })

  beforeEach(() => {
    fs.mkdirSync(baseDir, { recursive: true })
    dir = fs.mkdtempSync(path.join(baseDir, "case-"))
    dbPath = path.join(dir, "renault.db")
    createLegacyDatabase(dbPath)
  })

  afterEach(() => {
    try {
      fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
    } catch {
      // libsql puede dejar el archivo bloqueado en Windows
    }
  })

  it("crea las tablas y columnas faltantes de una base vieja", async () => {
    const result = await migrateDesktopDatabase(dbPath, { logger: { log: () => {} } })

    expect(result.applied).toEqual(MIGRATIONS.map((migration: { id: string }) => migration.id))
    expect(result.backupPath).toBeTruthy()
    expect(fs.existsSync(result.backupPath)).toBe(true)

    const tables = tableNames(dbPath)
    for (const table of [
      "roles",
      "cash_withdrawals",
      "notifications",
      "purchase_credits",
      "purchase_credit_payments",
      "permissions",
      "supplier_requests",
    ]) {
      expect(tables).toContain(table)
    }

    expect(columnNames(dbPath, "sales")).toEqual(expect.arrayContaining(["paymentSplits", "notes"]))
    expect(columnNames(dbPath, "quotations")).toContain("externalClientPhone")
  })

  it("registra las migraciones aplicadas y no las repite", async () => {
    await migrateDesktopDatabase(dbPath, { logger: { log: () => {} } })

    const recorded = query(dbPath, `SELECT id, name, appliedAt FROM ${MIGRATIONS_TABLE}`)
    expect(recorded).toHaveLength(MIGRATIONS.length)
    expect(recorded.map((row) => String(row.id)).sort()).toEqual(
      MIGRATIONS.map((migration: { id: string }) => migration.id).sort(),
    )
    expect(recorded[0].appliedAt).toBeTruthy()

    const second = await migrateDesktopDatabase(dbPath, { logger: { log: () => {} } })
    expect(second.applied).toEqual([])
    // Sin pendientes no se genera otra copia previa.
    expect(second.backupPath).toBeNull()
  })

  it("sólo aplica la migración de columnas pendiente", async () => {
    await migrateDesktopDatabase(dbPath, { logger: { log: () => {} } })

    // Simula una base migrada por una versión anterior: se olvida una migración.
    const db = new DatabaseSync(dbPath)
    db.prepare(`DELETE FROM ${MIGRATIONS_TABLE} WHERE id = ?`).run(
      "20261111000800_desktop_quotations_external_client_phone",
    )
    db.close()

    const result = await migrateDesktopDatabase(dbPath, { logger: { log: () => {} } })

    expect(result.applied).toEqual(["20261111000800_desktop_quotations_external_client_phone"])
  })

  it("deja el esquema listo al instalar (ensureDesktopDatabase)", async () => {
    const templatePath = path.join(dir, "template.db")
    const template = new DatabaseSync(templatePath)
    template.exec(USERS_TABLE)
    template.exec(SALES_TABLE)
    template.exec(QUOTATIONS_TABLE)
    template.close()

    const { wiped } = await ensureDesktopDatabase(dbPath, templatePath)

    expect(wiped).toBe(false)
    expect(tableNames(dbPath)).toContain("notifications")
    expect(query(dbPath, `SELECT COUNT(*) AS count FROM ${MIGRATIONS_TABLE}`)[0].count).toBe(
      MIGRATIONS.length,
    )
    expect(
      query(dbPath, "SELECT email FROM users WHERE email = ?", ["admin@gmail.com"]),
    ).toHaveLength(1)
  })
})
