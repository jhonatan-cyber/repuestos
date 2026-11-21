/**
 * Seed both databases (SQLite template + PostgreSQL) with the default admin.
 *
 * Usage:
 *   node scripts/seed-default-admin.js          # seeds both
 *   node scripts/seed-default-admin.js sqlite    # SQLite template only
 *   node scripts/seed-default-admin.js pg        # PostgreSQL only
 */
const { execSync } = require("child_process")
const path = require("path")
const fs = require("fs")
require("dotenv").config({ override: true })
const {
  getPostgresDatabaseUrl,
  getSqliteDatabaseFileName,
  resolveSqliteDatabasePath,
} = require("../lib/shared/database-config")

const target = process.argv[2] || "both" // "sqlite" | "pg" | "both"
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@gmail.com"
// NUNCA hardcodear: usar SEED_ADMIN_PASSWORD o generar una temporal e imprimirla una vez
function resolveSeedPassword() {
  if (process.env.SEED_ADMIN_PASSWORD && process.env.SEED_ADMIN_PASSWORD.length >= 8) {
    return { password: process.env.SEED_ADMIN_PASSWORD, generated: false }
  }
  const gen = require("crypto").randomBytes(9).toString("base64url")
  return { password: gen, generated: true }
}
const { password: ADMIN_PASSWORD, generated: ADMIN_PASSWORD_GENERATED } = resolveSeedPassword()
if (ADMIN_PASSWORD_GENERATED) {
  console.log(
    "🔑 SEED_ADMIN_PASSWORD no definido: se generó una contraseña temporal (mostrada una vez).",
  )
  console.log(`   Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD} — cambiala al primer login.`)
}
const ROLE_NAME = "Administrador"
const FULL_PERMISSIONS = '["*"]'

async function seedPostgres() {
  console.log("\n--- PostgreSQL ---")
  const { Client } = require("pg")
  const { hashSync } = require("bcryptjs")

  let dbUrl
  try {
    dbUrl = getPostgresDatabaseUrl()
  } catch {
    console.log("  Skipped: no DATABASE_URL / DATABASE_URL_WEB set")
    return
  }

  const client = new Client({ connectionString: dbUrl })
  await client.connect()

  try {
    // Ensure role
    const roleRes = await client.query("SELECT id FROM roles WHERE name = $1", [ROLE_NAME])
    let roleId
    if (roleRes.rows.length === 0) {
      const id = crypto.randomUUID()
      const now = new Date().toISOString()
      await client.query(
        `INSERT INTO roles (id, name, description, permissions, color, status, "createdAt", "updatedAt", "isSystem") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
        [id, ROLE_NAME, "Acceso total al sistema", FULL_PERMISSIONS, "#EF4444", "active", now, now],
      )
      roleId = id
      console.log("  Role created:", ROLE_NAME)
    } else {
      roleId = roleRes.rows[0].id
    }

    // Ensure admin user
    const userRes = await client.query("SELECT id FROM users WHERE email = $1", [ADMIN_EMAIL])
    if (userRes.rows.length === 0) {
      const id = crypto.randomUUID()
      const hash = hashSync(ADMIN_PASSWORD, 12)
      const now = new Date().toISOString()
      await client.query(
        `INSERT INTO users (id, ci, "firstName", "lastName", address, phone, email, password, image, role, status, "createdAt", "updatedAt", "isDeleted")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULL, $9, 'active', $10, $11, false)`,
        [
          id,
          "10000001",
          "Admin",
          "Sistema",
          "N/A",
          "70000000",
          ADMIN_EMAIL,
          hash,
          ROLE_NAME,
          now,
          now,
        ],
      )
      console.log("  Admin created:", ADMIN_EMAIL, "/", ADMIN_PASSWORD)
    } else {
      console.log("  Admin already exists:", ADMIN_EMAIL)
    }
  } finally {
    await client.end()
  }
}

async function seedSqliteTemplate() {
  console.log("\n--- SQLite (template prisma/renault.db) ---")
  const { createClient } = require("@libsql/client")
  const { hashSync } = require("bcryptjs")

  const dbPath = path.resolve("prisma/renault.db")
  if (!fs.existsSync(dbPath)) {
    console.log(
      "  Skipped: prisma/renault.db not found. Run `node scripts/prepare-electron-db.js` first.",
    )
    return
  }

  const client = createClient({ url: `file:${dbPath}` })

  try {
    // Ensure role
    const roleRes = await client.execute("SELECT id FROM roles WHERE name = ?", [ROLE_NAME])
    let roleId
    const now = new Date().toISOString()
    if (!roleRes.rows || roleRes.rows.length === 0) {
      roleId = crypto.randomUUID()
      await client.execute({
        sql: `INSERT INTO roles (id, name, description, permissions, color, status, "createdAt", "updatedAt", "isSystem") VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        args: [
          roleId,
          ROLE_NAME,
          "Acceso total al sistema",
          FULL_PERMISSIONS,
          "#EF4444",
          "active",
          now,
          now,
        ],
      })
      console.log("  Role created:", ROLE_NAME)
    } else {
      roleId = roleRes.rows[0].id
    }

    // Ensure admin user
    const userRes = await client.execute("SELECT id FROM users WHERE email = ?", [ADMIN_EMAIL])
    if (!userRes.rows || userRes.rows.length === 0) {
      const id = crypto.randomUUID()
      const hash = hashSync(ADMIN_PASSWORD, 12)
      await client.execute({
        sql: `INSERT INTO users (id, ci, "firstName", "lastName", address, phone, email, password, image, role, status, "createdAt", "updatedAt", "isDeleted")
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, 'active', ?, ?, 0)`,
        args: [
          id,
          "10000001",
          "Admin",
          "Sistema",
          "N/A",
          "70000000",
          ADMIN_EMAIL,
          hash,
          ROLE_NAME,
          now,
          now,
        ],
      })
      console.log("  Admin created:", ADMIN_EMAIL, "/", ADMIN_PASSWORD)
    } else {
      console.log("  Admin already exists:", ADMIN_EMAIL)
    }
  } finally {
    await client.close()
  }
}

;(async () => {
  try {
    if (target === "sqlite" || target === "both") await seedSqliteTemplate()
    if (target === "pg" || target === "both") await seedPostgres()
    console.log("\nDone.")
  } catch (err) {
    console.error("Seed error:", err)
    process.exit(1)
  }
})()
