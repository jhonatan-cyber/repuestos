// scripts/generate-schemas.ts
// Run: pnpm schema:generate
// Generates sqlite and postgres schemas from the base template

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE_PATH = path.resolve(__dirname, "../prisma/base/models.prisma")
const SQLITE_PATH = path.resolve(__dirname, "../prisma/sqlite/schema.prisma")
const POSTGRES_PATH = path.resolve(__dirname, "../prisma/postgres/schema.prisma")

const HEADER_SQLITE = `generator client {
  provider = "prisma-client-js"
  output   = "../../node_modules/.prisma/client"
}

datasource db {
  provider = "sqlite"
}

`

const HEADER_POSTGRES = `generator client {
  provider        = "prisma-client-js"
  output          = "../../node_modules/.prisma/client-postgres"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "postgresql"
}

`

function readBase(): string {
  if (!fs.existsSync(BASE_PATH)) {
    throw new Error(`Base schema not found at ${BASE_PATH}`)
  }
  return fs.readFileSync(BASE_PATH, "utf-8")
}

function writeIfDifferent(filePath: string, content: string): boolean {
  const exists = fs.existsSync(filePath)
  if (!exists) {
    fs.writeFileSync(filePath, content, "utf-8")
    console.log(`✅ Created: ${filePath}`)
    return true
  }
  const current = fs.readFileSync(filePath, "utf-8")
  if (current !== content) {
    fs.writeFileSync(filePath, content, "utf-8")
    console.log(`🔄 Updated: ${filePath}`)
    return true
  }
  console.log(`✅ Unchanged: ${filePath}`)
  return false
}

async function run() {
  console.log("🔄 Generating Prisma schemas from base...\n")

  const baseContent = readBase()
  console.log("📋 Base models loaded from:", BASE_PATH)

  const sqliteContent = HEADER_SQLITE + baseContent
  const postgresContent = HEADER_POSTGRES + baseContent

  const sqliteChanged = writeIfDifferent(SQLITE_PATH, sqliteContent)
  const postgresChanged = writeIfDifferent(POSTGRES_PATH, postgresContent)

  console.log("\n✨ Schema generation complete!")
  console.log(`   SQLite: ${SQLITE_PATH}`)
  console.log(`   PostgreSQL: ${POSTGRES_PATH}`)

  if (sqliteChanged || postgresChanged) {
    console.log("\n⚠️  Schemas changed - run 'pnpm db:generate' to regenerate clients")
  }
}

run()
  .then(() => {
    console.log("Done")
    process.exit(0)
  })
  .catch((err) => {
    console.error("❌ Error:", err)
    process.exit(1)
  })
