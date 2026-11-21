import { describe, expect, it, beforeAll, beforeEach, afterEach } from "vitest"
import { createRequire } from "node:module"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { DatabaseSync } from "node:sqlite"
import bcrypt from "bcryptjs"

const require = createRequire(import.meta.url)
const { ensureAdminUser, ensureDesktopDatabase } = require("../../lib/electron/db-manager.js")

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

const ROLES_TABLE = `
  CREATE TABLE IF NOT EXISTS roles (
    id TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    permissions TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6B7280',
    status TEXT NOT NULL DEFAULT 'active',
    isSystem BOOLEAN NOT NULL DEFAULT false,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL,
    isDeleted BOOLEAN NOT NULL DEFAULT false,
    lastSyncedAt DATETIME
  )
`

async function createDatabase(filePath: string) {
  const db = new DatabaseSync(filePath)
  db.exec(USERS_TABLE)
  db.exec(ROLES_TABLE)
  db.close()
}

async function readUser(filePath: string, email: string) {
  const db = new DatabaseSync(filePath, { readOnly: true })
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as
    Record<string, unknown> | undefined
  db.close()
  return user
}

function updatePassword(filePath: string, email: string, password: string) {
  const db = new DatabaseSync(filePath)
  db.prepare("UPDATE users SET password = ? WHERE email = ?").run(
    bcrypt.hashSync(password, 10),
    email,
  )
  db.close()
}

function insertLegacyUser(filePath: string) {
  const db = new DatabaseSync(filePath)
  db.prepare(
    `INSERT INTO users (id, ci, firstName, lastName, address, phone, email, password, role, status, createdAt, updatedAt, isDeleted)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0)`,
  ).run(
    "old-user",
    "12345678",
    "Cliente",
    "Viejo",
    "Calle 1",
    "70000001",
    "viejo@gmail.com",
    bcrypt.hashSync("viejo123", 10),
    "Vendedor",
    "active",
    new Date().toISOString(),
    new Date().toISOString(),
  )
  db.close()
}

describe("db-manager: usuario admin por defecto", () => {
  // libsql (nativo) mantiene el archivo de la DB bloqueado en Windows incluso
  // despuÃ©s de close(), por eso cada test usa su propia carpeta y la limpieza
  // es best-effort (los restos se borran en la corrida siguiente).
  const baseDir = path.join(os.tmpdir(), "renault-db-manager-tests")
  let dir: string
  let dbPath: string
  let templatePath: string

  beforeAll(() => {
    try {
      fs.rmSync(baseDir, { recursive: true, force: true })
    } catch {
      // carpeta bloqueada por una corrida anterior
    }
  })

  beforeEach(async () => {
    fs.mkdirSync(baseDir, { recursive: true })
    dir = fs.mkdtempSync(path.join(baseDir, "case-"))
    dbPath = path.join(dir, "renault.db")
    templatePath = path.join(dir, "template.db")
    await createDatabase(dbPath)
    await createDatabase(templatePath)
  })

  afterEach(() => {
    try {
      fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
    } catch {
      // el archivo puede quedar bloqueado por libsql en Windows
    }
  })

  it("crea el usuario admin con la contraseÃ±a admin123", async () => {
    const result = await ensureAdminUser(dbPath)

    expect(result.created).toBe(true)

    const user = await readUser(dbPath, "admin@gmail.com")
    expect(user).toBeDefined()
    expect(user?.role).toBe("Administrador")
    expect(user?.status).toBe("active")
    expect(bcrypt.compareSync("admin123", String(user?.password))).toBe(true)
  })

  it("restaura la contraseÃ±a por defecto cuando se fuerza", async () => {
    await ensureAdminUser(dbPath)
    updatePassword(dbPath, "admin@gmail.com", "otra-clave")

    const result = await ensureAdminUser(dbPath, { forcePassword: true })

    expect(result.passwordReset).toBe(true)

    const user = await readUser(dbPath, "admin@gmail.com")
    expect(bcrypt.compareSync("admin123", String(user?.password))).toBe(true)
  })

  it("limpia la base de datos y recrea el admin cuando se reinicia", async () => {
    insertLegacyUser(dbPath)

    const { wiped } = await ensureDesktopDatabase(dbPath, templatePath, { resetDatabase: true })

    expect(wiped).toBe(true)
    expect(await readUser(dbPath, "viejo@gmail.com")).toBeUndefined()

    const admin = await readUser(dbPath, "admin@gmail.com")
    expect(admin).toBeDefined()
    expect(bcrypt.compareSync("admin123", String(admin?.password))).toBe(true)
  })

  it("no borra los datos cuando no se pide el reinicio", async () => {
    insertLegacyUser(dbPath)

    const { wiped } = await ensureDesktopDatabase(dbPath, templatePath)

    expect(wiped).toBe(false)
    expect(await readUser(dbPath, "viejo@gmail.com")).toBeDefined()
  })
})
