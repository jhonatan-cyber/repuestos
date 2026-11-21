import { createRequire } from "node:module"
import { describe, expect, it } from "vitest"
import initSqlJs from "sql.js"
import { BACKUP_MODELS, SQLITE_MODEL_TABLES } from "../../lib/backup-models"
import {
  MAX_JSON_BACKUP_BYTES,
  MAX_JSON_BACKUP_BYTES_DESKTOP,
  MAX_SQLITE_BACKUP_BYTES,
  MAX_SQLITE_BACKUP_BYTES_DESKTOP,
  getMaxJsonBackupBytes,
  getMaxSqliteBackupBytes,
  isSqliteBackup,
  normalizeSqliteValue,
  sqliteBufferToBackupPayload,
  SqliteBackupError,
} from "../../lib/backup-sqlite"

const require = createRequire(import.meta.url)

async function createSqliteFile(
  extraSql: string[] = [],
  skippedTables: string[] = [],
): Promise<Buffer> {
  const SQL = await initSqlJs({
    locateFile: (file) => require.resolve(`sql.js/dist/${file}`),
  })
  const db = new SQL.Database()

  for (const model of BACKUP_MODELS) {
    const table = SQLITE_MODEL_TABLES[model]
    if (skippedTables.includes(table)) continue
    db.run(`CREATE TABLE "${table}" (id TEXT PRIMARY KEY)`)
  }
  for (const sql of extraSql) db.run(sql)

  const exported = Buffer.from(db.export())
  db.close()
  return exported
}

/** Copia SQLite válida de más de 25MB (un solo registro con texto grande). */
async function createLargeSqliteFile(contentBytes: number): Promise<Buffer> {
  const SQL = await initSqlJs({
    locateFile: (file) => require.resolve(`sql.js/dist/${file}`),
  })
  const db = new SQL.Database()

  for (const model of BACKUP_MODELS) {
    db.run(`CREATE TABLE "${SQLITE_MODEL_TABLES[model]}" (id TEXT PRIMARY KEY)`)
  }
  db.run(`ALTER TABLE "notifications" ADD COLUMN "payload" TEXT`)
  db.run(`INSERT INTO "notifications" (id, payload) VALUES (?, ?)`, [
    "n1",
    "x".repeat(contentBytes),
  ])

  const exported = Buffer.from(db.export())
  db.close()
  return exported
}

describe("backup SQLite (.db) → payload JSON", () => {
  it("normaliza booleanos, fechas y montos al tipo de Prisma", () => {
    expect(normalizeSqliteValue("BOOLEAN", 1)).toBe(true)
    expect(normalizeSqliteValue("BOOLEAN", 0)).toBe(false)
    expect(normalizeSqliteValue("DATETIME", "2026-01-02T03:04:05.000Z")).toBe(
      "2026-01-02T03:04:05.000Z",
    )
    expect(normalizeSqliteValue("REAL", 12.5)).toBe(12.5)
    expect(normalizeSqliteValue("INTEGER", "7")).toBe(7)
    expect(normalizeSqliteValue("TEXT", null)).toBeNull()
  })

  it("detecta la cabecera de SQLite", async () => {
    const db = await createSqliteFile()
    expect(isSqliteBackup(db)).toBe(true)
    expect(isSqliteBackup(Buffer.from('{"meta":{}}'))).toBe(false)
    expect(isSqliteBackup(Buffer.alloc(0))).toBe(false)
  })

  it("convierte todas las tablas al payload de backup", async () => {
    const db = await createSqliteFile([
      `ALTER TABLE "users" ADD COLUMN "firstName" TEXT`,
      `ALTER TABLE "users" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false`,
      `ALTER TABLE "users" ADD COLUMN "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`,
      `INSERT INTO "users" (id, firstName, isDeleted, createdAt) VALUES ('u1', 'Ana', 0, '2026-01-02 03:04:05')`,
      `ALTER TABLE "cash_withdrawals" ADD COLUMN "amount" REAL NOT NULL DEFAULT 0`,
      `INSERT INTO "cash_withdrawals" (id, amount) VALUES ('w1', 150.75)`,
    ])

    const payload = await sqliteBufferToBackupPayload(db, { runtime: "web" })

    expect(payload.meta.format).toBe("json")
    expect(payload.meta.sourceDatabase).toBe("sqlite")
    expect(payload.meta.models).toEqual(BACKUP_MODELS)
    expect(payload.data.user).toEqual([
      {
        id: "u1",
        firstName: "Ana",
        isDeleted: false,
        createdAt: new Date("2026-01-02T03:04:05").toISOString(),
      },
    ])
    expect(payload.data.cashWithdrawal).toEqual([{ id: "w1", amount: 150.75 }])
    expect(payload.data.client).toEqual([])
  })

  it("ignora tablas opcionales de backups viejos", async () => {
    const db = await createSqliteFile([], ["system_config"])
    const payload = await sqliteBufferToBackupPayload(db)

    expect(payload.data.systemConfig).toBeUndefined()
    expect(payload.data.user).toEqual([])
  })

  it("rechaza una copia a la que le falta una tabla obligatoria", async () => {
    const db = await createSqliteFile([], ["clients"])

    await expect(sqliteBufferToBackupPayload(db)).rejects.toBeInstanceOf(SqliteBackupError)
    await expect(sqliteBufferToBackupPayload(db)).rejects.toThrow(/clients/)
  })

  it("rechaza archivos que no son SQLite", async () => {
    await expect(sqliteBufferToBackupPayload(Buffer.from('{"data":[]}'))).rejects.toThrow(
      /no es una base SQLite válida/,
    )
  })

  it("traduce una copia dañada a un error 400 en vez de reventar", async () => {
    const damaged = Buffer.concat([Buffer.from("SQLite format 3\0", "latin1"), Buffer.alloc(4096)])

    await expect(sqliteBufferToBackupPayload(damaged)).rejects.toBeInstanceOf(SqliteBackupError)
    await expect(sqliteBufferToBackupPayload(damaged)).rejects.toThrow(/dañada/)
  })
})

describe("límite de tamaño de la copia .db", () => {
  it("es más grande en escritorio que en web", () => {
    expect(getMaxSqliteBackupBytes("web")).toBe(MAX_SQLITE_BACKUP_BYTES)
    expect(getMaxSqliteBackupBytes(undefined)).toBe(MAX_SQLITE_BACKUP_BYTES)
    expect(getMaxSqliteBackupBytes("electron")).toBe(MAX_SQLITE_BACKUP_BYTES_DESKTOP)
    expect(MAX_SQLITE_BACKUP_BYTES_DESKTOP).toBeGreaterThan(MAX_SQLITE_BACKUP_BYTES)
  })

  it("acepta en escritorio una copia que la web rechaza por tamaño", async () => {
    const db = await createLargeSqliteFile(26 * 1024 * 1024)

    expect(db.length).toBeGreaterThan(MAX_SQLITE_BACKUP_BYTES)
    await expect(sqliteBufferToBackupPayload(db, { runtime: "web" })).rejects.toThrow(/25MB/)

    const payload = await sqliteBufferToBackupPayload(db, { runtime: "electron" })
    expect(payload.meta.runtime).toBe("electron")
    expect(payload.data.notification).toHaveLength(1)
    expect((payload.data.notification[0].payload as string).length).toBe(26 * 1024 * 1024)
  })

  it("respeta un tope explícito menor al del runtime", async () => {
    const db = await createSqliteFile()

    await expect(
      sqliteBufferToBackupPayload(db, { runtime: "electron", maxBytes: 512 }),
    ).rejects.toThrow(/supera el máximo/)
  })
})

describe("límite de tamaño del backup JSON", () => {
  it("es más grande en escritorio que en web", () => {
    expect(getMaxJsonBackupBytes("web")).toBe(MAX_JSON_BACKUP_BYTES)
    expect(getMaxJsonBackupBytes(undefined)).toBe(MAX_JSON_BACKUP_BYTES)
    expect(getMaxJsonBackupBytes("electron")).toBe(MAX_JSON_BACKUP_BYTES_DESKTOP)
    expect(MAX_JSON_BACKUP_BYTES_DESKTOP).toBeGreaterThan(MAX_JSON_BACKUP_BYTES)
  })
})
