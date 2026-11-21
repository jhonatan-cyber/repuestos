// scripts/db-push.cjs
// Run: node scripts/db-push.cjs [--sqlite] [--postgres]
// Pushes schema changes to SQLite and/or PostgreSQL using Node.js built-in sqlite

const { DatabaseSync } = require('node:sqlite')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ override: true })
const {
  resolveSqliteDatabasePath,
  getSqliteDatabaseFileName,
} = require('../lib/shared/database-config')

// ===== Paths =====
const SQLITE_DB = path.resolve(__dirname, '../prisma/renault.db')
const SQLITE_SCHEMA = path.resolve(__dirname, '../prisma/sqlite/schema.prisma')
const SQLITE_DB_FILE_NAME = getSqliteDatabaseFileName(undefined, path.resolve(__dirname, '..'))

// ===== SQLite helpers =====
function backupSqlite() {
  const bak = SQLITE_DB + '.bak'
  if (!fs.existsSync(bak)) {
    fs.copyFileSync(SQLITE_DB, bak)
    console.log('✅ Backup created: prisma/renault.db.bak')
  } else {
    console.log('✅ Backup already exists')
  }
}

function migrateSqlite() {
  console.log('\n📋 Reading schema from:', SQLITE_SCHEMA)
  const schema = fs.readFileSync(SQLITE_SCHEMA, 'utf-8')

  const db = new DatabaseSync(SQLITE_DB, { readonly: false })

  // Get existing tables
  const tables = db.prepare('PRAGMA table_list').all()
  const tableNames = tables.map(t => t.name)
  console.log('📋 Current tables:', tableNames.join(', '))

  // Map model name → actual table name in DB
  const modelToTable = {
    user: 'users',
    client: 'clients',
    supplier: 'suppliers',
    category: 'categories',
    product: 'products',
    sale: 'sales',
    saleitem: 'sale_items',
    purchase: 'purchases',
    purchaseitem: 'purchase_items',
    quotation: 'quotations',
    quotationitem: 'quotation_items',
    commission: 'commissions',
    expense: 'expenses',
    cashrecord: 'cash_records',
    cashwithdrawal: 'cash_withdrawals',
    role: 'roles',
  }

  // Parse models from schema
  const modelRegex = /model\s+(\w+)\s*\{/g
  let match
  const changes = []

  while ((match = modelRegex.exec(schema)) !== null) {
    const modelName = match[1]
    const tableName = modelToTable[modelName.toLowerCase()]
    if (!tableName) continue

    if (!tableNames.includes(tableName)) {
      console.log(`  ⚠️  Table "${tableName}" doesn't exist yet`)
      continue
    }

    // Get existing columns
    const cols = db.prepare(`PRAGMA table_info("${tableName}")`).all()
    const existingCols = new Set(cols.map(c => c.name))

    // Find fields in model block
    const blockStart = match.index + match[0].length
    let braceCount = 1
    let blockEnd = blockStart
    while (braceCount > 0 && blockEnd < schema.length) {
      if (schema[blockEnd] === '{') braceCount++
      else if (schema[blockEnd] === '}') braceCount--
      blockEnd++
    }
    const block = schema.slice(blockStart, blockEnd - 1)

    // Extract field types (simplified - String, Int, Float, Boolean, DateTime, Json)
    const fieldRegex = /(\w+)\s+(String|Int|Float|Boolean|DateTime|Json)(\?)?/g
    const fieldMatch = [...block.matchAll(fieldRegex)]

    for (const fm of fieldMatch) {
      const colName = fm[1]

      // Skip reserved words and internal fields
      if (['id', 'createdAt', 'updatedAt', 'isDeleted', 'lastSyncedAt'].includes(colName)) {
        continue
      }

      if (!existingCols.has(colName)) {
        try {
          db.exec(`ALTER TABLE "${tableName}" ADD COLUMN "${colName}" TEXT`)
          changes.push(`${colName} → ${tableName}`)
          console.log(`  ✅ Added: ${colName} → ${tableName}`)
        } catch (err) {
          if (err.message.includes('duplicate column')) {
            console.log(`  ✅ Already exists: ${colName}`)
          } else {
            console.log(`  ⚠️  ${colName}: ${err.message}`)
          }
        }
      } else {
        console.log(`  ✅ Already exists: ${colName} in ${tableName}`)
      }
    }
  }

  db.close()
  return changes
}

// ===== PostgreSQL helpers =====
function migratePostgres() {
  console.log('\n📋 PostgreSQL migration')
  console.log('   (Use "pnpm db:push:postgres" or run prisma migrate directly)')
  console.log('   To add paymentSplits and notes columns manually:')
  console.log('')
  console.log('   ALTER TABLE sales ADD COLUMN paymentSplits TEXT;')
  console.log('   ALTER TABLE sales ADD COLUMN notes TEXT;')
  console.log('')
  return []
}

// ===== Main =====
const args = process.argv.slice(2)
const sqliteOnly = args.includes('--sqlite')
const postgresOnly = args.includes('--postgres')
const showHelp = args.includes('--help') || args.includes('-h')

if (showHelp) {
  console.log(`
📖 DB Push Script

Usage:
  node scripts/db-push.cjs           Push to both (SQLite only currently)
  node scripts/db-push.cjs --sqlite   Push to SQLite only
  node scripts/db-push.cjs --postgres  Show PostgreSQL instructions

Environment (PostgreSQL):
  DATABASE_HOST, DATABASE_PORT, DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD
`)
  process.exit(0)
}

console.log('🔄 Database Schema Push')
console.log('======================\n')

// SQLite
if (!postgresOnly) {
  console.log('--- SQLite (Electron) ---')
  console.log('📂 Database:', SQLITE_DB)

  if (!fs.existsSync(SQLITE_DB)) {
    console.log('❌ SQLite database not found')
  } else {
    backupSqlite()
    const changes = migrateSqlite()
    console.log('\n✅ SQLite:', changes.length > 0 ? `${changes.length} columns added` : 'No changes needed')
  }
}

// PostgreSQL
if (!sqliteOnly) {
  console.log('\n--- PostgreSQL (Web) ---')
  migratePostgres()
}

console.log('\n✨ Done!')
