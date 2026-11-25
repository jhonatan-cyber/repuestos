/**
 * Generates a clean SQLite template database for Electron distribution.
 * This ensures new desktop installations always start with a fresh schema
 * and no development data.
 *
 * Usage: node scripts/prepare-electron-db.js
 */
const { execSync } = require("child_process")
const path = require("path")
const fs = require("fs")
const {
  getSqliteDatabaseUrl,
  resolveSqliteDatabasePath,
  getSqliteDatabaseFileName,
} = require("../lib/shared/database-config")
require("dotenv").config({ override: true })

const sqliteUrl = getSqliteDatabaseUrl()
const dbPath = resolveSqliteDatabasePath(sqliteUrl, process.cwd())
const dbFileName = getSqliteDatabaseFileName(sqliteUrl, process.cwd())
const schemaPath = path.resolve("prisma/sqlite/schema.prisma")
const configPath = path.resolve("prisma/template-db-config.json")

// 1. Backup existing renault.db if it exists (rotación: conservar máx 3)
if (fs.existsSync(dbPath)) {
  const backupPath = `${dbPath}.pre-build-backup-${Date.now()}`
  fs.copyFileSync(dbPath, backupPath)
  console.log(`📦 Backed up existing renault.db → ${path.basename(backupPath)}`)
  const dir = path.dirname(dbPath)
  const base = path.basename(dbPath)
  const oldBackups = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith(`${base}.pre-build-backup-`))
    .map((f) => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t)
  for (const { f } of oldBackups.slice(3)) {
    fs.unlinkSync(path.join(dir, f))
    console.log(`🧹 Rotated old backup: ${f}`)
  }
  fs.unlinkSync(dbPath)
}

// 2. Push schema to create fresh database
try {
  execSync(`npx prisma db push --schema="${schemaPath}" --force-reset --accept-data-loss`, {
    stdio: "pipe",
    env: {
      ...process.env,
      APP_RUNTIME: "electron",
      DATABASE_URL_LOCAL: sqliteUrl,
      RUST_LOG: process.env.RUST_LOG || "info",
    },
  })
  console.log("✅ Fresh SQLite database created from schema")
} catch (err) {
  console.error("❌ Failed to create template database:", err.message)
  process.exit(1)
}

// 3. Verify the file was created
if (!fs.existsSync(dbPath)) {
  console.error("❌ Template database was not created at:", dbPath)
  process.exit(1)
}

const stats = fs.statSync(dbPath)
const sizeKB = (stats.size / 1024).toFixed(1)
console.log(`✅ Template database ready: ${sizeKB} KB`)
console.log(`📄 Location: ${dbPath}`)

console.log("\n🎉 Electron template DB is clean and ready for packaging.\n")
