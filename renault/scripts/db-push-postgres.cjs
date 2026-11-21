// scripts/db-push-postgres.cjs
// Run: pnpm db:push:postgres
// Connects to PostgreSQL and pushes schema changes

const path = require("path")
const fs = require("fs")
require("dotenv").config({ override: true })
const { getPostgresDatabaseUrl } = require("../lib/shared/database-config")

const BASE_SCHEMA = path.resolve(__dirname, "../prisma/base/models.prisma")

// Parse schema
const MODEL_TO_TABLE = {
  User: "users", Client: "clients", Supplier: "suppliers",
  Category: "categories", Product: "products", Sale: "sales",
  SaleItem: "sale_items", Purchase: "purchases",
  PurchaseItem: "purchase_items", Quotation: "quotations",
  QuotationItem: "quotation_items", Commission: "commissions",
  Expense: "expenses", CashRecord: "cash_records",
  CashWithdrawal: "cash_withdrawals", Role: "roles",
}

function parseModels() {
  const content = fs.readFileSync(BASE_SCHEMA, "utf-8")
  const models = []
  const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/gs
  let match
  while ((match = modelRegex.exec(content)) !== null) {
    const modelName = match[1]
    const block = match[2]
    const tableName = MODEL_TO_TABLE[modelName]
    if (!tableName) continue
    const columns = []
    const fieldRegex = /^\s*(\w+)\s+(String|Int|Float|Boolean|DateTime|Json)(\?)?/gm
    let fm
    while ((fm = fieldRegex.exec(block)) !== null) {
      columns.push({ name: fm[1], nullable: fm[3] === "?" })
    }
    models.push({ modelName, tableName, columns })
  }
  return models
}

function buildSql(models) {
  const sql = []
  for (const model of models) {
    for (const col of model.columns) {
      const nullable = col.nullable ? "" : " NOT NULL DEFAULT ''"
      sql.push(`ALTER TABLE "${model.tableName}" ADD COLUMN IF NOT EXISTS "${col.name}" TEXT${nullable};`)
    }
  }
  return sql.join("\n")
}

// Config from env
let host, port, db, user, pass

const dbUrl = getPostgresDatabaseUrl()
const urlMatch = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/)
if (urlMatch) {
  user = urlMatch[1]
  pass = decodeURIComponent(urlMatch[2])
  host = urlMatch[3]
  port = urlMatch[4]
  db = urlMatch[5]
} else {
  host = process.env.DATABASE_HOST || process.env.PGHOST || "localhost"
  port = process.env.DATABASE_PORT || process.env.PGPORT || "5432"
  db = process.env.DATABASE_NAME || process.env.PGDATABASE || "renault"
  user = process.env.DATABASE_USER || process.env.PGUSER || "postgres"
  pass = process.env.DATABASE_PASSWORD || process.env.PGPASSWORD || ""
}

console.log("─── PostgreSQL (Web server) ───")
console.log(`📡 ${host}:${port}/${db}`)

let pg
try {
  pg = require("pg")
} catch (_) {}

async function tryPgClient() {
  if (!pg) {
    console.log("⚠️  pg module not available — using SQL file approach")
    return false
  }

  const { Client } = pg
  const client = new Client({ host, port: parseInt(port), database: db, user, password: pass })

  try {
    await client.connect()
    console.log("✅ Connected to PostgreSQL")

    const models = parseModels()
    let changes = 0

    for (const model of models) {
      try {
        const res = await client.query(
          `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1) AS ex`,
          [model.tableName]
        )
        if (!res.rows[0]?.ex) {
          console.log(`  ⚠️  Table "${model.tableName}" missing — skip`)
          continue
        }
      } catch {
        continue
      }

      const colsRes = await client.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND table_schema = 'public'`,
        [model.tableName]
      )
      const existing = new Set(colsRes.rows.map((r) => r.column_name))

      for (const col of model.columns) {
        if (existing.has(col.name)) continue
        try {
          const nullStr = col.nullable ? "" : " NOT NULL DEFAULT ''"
          await client.query(`ALTER TABLE "${model.tableName}" ADD COLUMN "${col.name}" TEXT${nullStr}`)
          changes++
          console.log(`  ✅ ${col.name} → ${model.tableName}`)
        } catch (err) {
          if (!err.message?.includes("already exists")) {
            console.log(`  ⚠️  ${col.name}: ${err.message}`)
          }
        }
      }
    }

    await client.end()
    return changes
  } catch (err) {
    console.log(`❌ Cannot connect: ${err.message}`)
    return -1
  }
}

async function tryPsqlFile() {
  const sql = buildSql(parseModels())
  const sqlFile = path.resolve(__dirname, "../prisma/migrate-pg.sql")
  fs.writeFileSync(sqlFile, sql, "utf-8")
  console.log("📄 SQL generated → prisma/migrate-pg.sql")
  console.log(`   ${sql.split("\n").length} statements`)
  return 0
}

tryPgClient().then(async (changes) => {
  if (changes === -1) {
    await tryPsqlFile()
    console.log("\n⚠️  PostgreSQL not reachable from this machine")
    console.log("💡 Run on the server:")
    console.log(`   psql -h ${host} -U ${user} -d ${db} -f prisma/migrate-pg.sql`)
    console.log("\nOr use any PostgreSQL client to execute the SQL in prisma/migrate-pg.sql")
  } else if (typeof changes === "number" && changes === 0) {
    console.log("✅ PostgreSQL: No changes needed")
  } else if (typeof changes === "number") {
    console.log(`✅ PostgreSQL: ${changes} columns added`)
  } else {
    await tryPsqlFile()
  }

  process.exit(0)
}).catch((err) => {
  console.error("❌", err.message)
  process.exit(1)
})
