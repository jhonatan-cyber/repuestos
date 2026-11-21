// @ts-nocheck
// scripts/clean-dbs.ts
// Run: bun scripts/clean-dbs.ts
// Cleans both databases using appropiate tools

import pg from "pg"
import fs from "fs"
import path from "path"
import dotenv from "dotenv"
const { resolveSqliteDatabasePath } = require("../lib/shared/database-config")

dotenv.config({ override: true })

const { Client } = pg
const SQLITE_DB = path.resolve(import.meta.dir, "../prisma/renault.db")

async function cleanSqlite() {
  console.log("─── SQLite (Electron) ───")
  if (!fs.existsSync(SQLITE_DB)) {
    console.log("  ✅ Already clean")
    return
  }
  // Backup
  const bak = SQLITE_DB + "." + Date.now() + ".bak"
  fs.copyFileSync(SQLITE_DB, bak)
  console.log(`  ✅ Backup: ${path.basename(bak)}`)
  // Delete
  fs.unlinkSync(SQLITE_DB)
  console.log("  ✅ Database deleted")
}

async function cleanPostgres() {
  console.log("─── PostgreSQL (Web) ───")
  const config = {
    host: process.env.DATABASE_HOST || process.env.PGHOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT || process.env.PGPORT || "5432"),
    database: process.env.DATABASE_NAME || process.env.PGDATABASE || "renault",
    user: process.env.DATABASE_USER || process.env.PGUSER || "postgres",
    password: process.env.DATABASE_PASSWORD || process.env.PGPASSWORD || "",
  }

  const client = new Client(config)
  try {
    await client.connect()
    console.log("  ✅ Connected")

    const res = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `)
    const tables = res.rows.map((r: any) => r.table_name)

    if (tables.length > 0) {
      await client.query(
        `DROP TABLE IF EXISTS ${tables.map((t: string) => `"${t}"`).join(", ")} CASCADE`,
      )
      console.log(`  ✅ Dropped ${tables.length} tables`)
    }
    await client.query(`DROP TABLE IF EXISTS "_prisma_migrations" CASCADE`)
    console.log("  ✅ Clean")
  } catch (err: any) {
    console.log(`  ⚠️  ${err.message}`)
  } finally {
    await client.end()
  }
}

async function main() {
  console.log("🧹 Cleaning both databases\n")

  await cleanSqlite()
  console.log()
  await cleanPostgres()

  console.log("\n✨ Both databases cleaned!")
}

await main()
