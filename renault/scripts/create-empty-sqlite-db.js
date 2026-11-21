/**
 * Genera una base de datos SQLite VACÍA con todas las tablas
 * iguales al schema de PostgreSQL.
 *
 * Uso: node scripts/create-empty-sqlite-db.js
 */
const { createClient } = require("@libsql/client")
const fs = require("fs")
const path = require("path")
require("dotenv").config({ override: true })
const {
  resolveSqliteDatabasePath,
  getSqliteDatabaseFileName,
} = require("../lib/shared/database-config")

const dbPath = path.resolve("prisma/renault.db")
const backupPath = path.resolve("prisma/renault.db.backup-" + Date.now() + ".db")

// Schema SQL equivalente al Prisma schema (SQLite syntax)
const TABLES = [
  // Users
  `CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ci" TEXT NOT NULL UNIQUE,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "image" TEXT,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" DATETIME
  )`,
  `CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role")`,
  `CREATE INDEX IF NOT EXISTS "users_status_idx" ON "users"("status")`,
  `CREATE INDEX IF NOT EXISTS "users_updatedAt_idx" ON "users"("updatedAt")`,
  `CREATE INDEX IF NOT EXISTS "users_lastSyncedAt_idx" ON "users"("lastSyncedAt")`,

  // Clients
  `CREATE TABLE IF NOT EXISTS "clients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "nit" TEXT,
    "address" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "totalPurchases" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" DATETIME
  )`,
  `CREATE INDEX IF NOT EXISTS "clients_status_idx" ON "clients"("status")`,
  `CREATE INDEX IF NOT EXISTS "clients_updatedAt_idx" ON "clients"("updatedAt")`,
  `CREATE INDEX IF NOT EXISTS "clients_lastSyncedAt_idx" ON "clients"("lastSyncedAt")`,

  // Suppliers
  `CREATE TABLE IF NOT EXISTS "suppliers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "totalPurchases" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" DATETIME
  )`,
  `CREATE INDEX IF NOT EXISTS "suppliers_updatedAt_idx" ON "suppliers"("updatedAt")`,
  `CREATE INDEX IF NOT EXISTS "suppliers_lastSyncedAt_idx" ON "suppliers"("lastSyncedAt")`,

  // Categories
  `CREATE TABLE IF NOT EXISTS "categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "color" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'product',
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" DATETIME
  )`,
  `CREATE INDEX IF NOT EXISTS "categories_type_idx" ON "categories"("type")`,
  `CREATE INDEX IF NOT EXISTS "categories_updatedAt_idx" ON "categories"("updatedAt")`,
  `CREATE INDEX IF NOT EXISTS "categories_lastSyncedAt_idx" ON "categories"("lastSyncedAt")`,

  // Products
  `CREATE TABLE IF NOT EXISTS "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "purchasePrice" REAL NOT NULL,
    "salePrice" REAL NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "minimumStock" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'unidad',
    "supplierId" TEXT NOT NULL,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" DATETIME,
    FOREIGN KEY ("categoryId") REFERENCES "categories"("id"),
    FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "products_categoryId_idx" ON "products"("categoryId")`,
  `CREATE INDEX IF NOT EXISTS "products_supplierId_idx" ON "products"("supplierId")`,
  `CREATE INDEX IF NOT EXISTS "products_updatedAt_idx" ON "products"("updatedAt")`,
  `CREATE INDEX IF NOT EXISTS "products_lastSyncedAt_idx" ON "products"("lastSyncedAt")`,

  // Sales
  `CREATE TABLE IF NOT EXISTS "sales" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "clientId" TEXT NOT NULL,
    "sellerUserId" TEXT NOT NULL,
    "subtotal" REAL NOT NULL,
    "tax" REAL NOT NULL DEFAULT 0,
    "discount" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paymentSplits" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completada',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" DATETIME,
    FOREIGN KEY ("clientId") REFERENCES "clients"("id"),
    FOREIGN KEY ("sellerUserId") REFERENCES "users"("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "sales_clientId_idx" ON "sales"("clientId")`,
  `CREATE INDEX IF NOT EXISTS "sales_sellerUserId_idx" ON "sales"("sellerUserId")`,
  `CREATE INDEX IF NOT EXISTS "sales_date_idx" ON "sales"("date")`,
  `CREATE INDEX IF NOT EXISTS "sales_status_idx" ON "sales"("status")`,
  `CREATE INDEX IF NOT EXISTS "sales_updatedAt_idx" ON "sales"("updatedAt")`,
  `CREATE INDEX IF NOT EXISTS "sales_lastSyncedAt_idx" ON "sales"("lastSyncedAt")`,

  // Sale Items
  `CREATE TABLE IF NOT EXISTS "sale_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" DATETIME,
    FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE,
    FOREIGN KEY ("productId") REFERENCES "products"("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "sale_items_saleId_idx" ON "sale_items"("saleId")`,
  `CREATE INDEX IF NOT EXISTS "sale_items_productId_idx" ON "sale_items"("productId")`,

  // Purchases
  `CREATE TABLE IF NOT EXISTS "purchases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "supplierId" TEXT NOT NULL,
    "buyerUserId" TEXT NOT NULL,
    "subtotal" REAL NOT NULL,
    "tax" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendiente',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" DATETIME,
    FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id"),
    FOREIGN KEY ("buyerUserId") REFERENCES "users"("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "purchases_supplierId_idx" ON "purchases"("supplierId")`,
  `CREATE INDEX IF NOT EXISTS "purchases_buyerUserId_idx" ON "purchases"("buyerUserId")`,
  `CREATE INDEX IF NOT EXISTS "purchases_date_idx" ON "purchases"("date")`,
  `CREATE INDEX IF NOT EXISTS "purchases_status_idx" ON "purchases"("status")`,
  `CREATE INDEX IF NOT EXISTS "purchases_updatedAt_idx" ON "purchases"("updatedAt")`,
  `CREATE INDEX IF NOT EXISTS "purchases_lastSyncedAt_idx" ON "purchases"("lastSyncedAt")`,

  // Purchase Items
  `CREATE TABLE IF NOT EXISTS "purchase_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchaseId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" DATETIME,
    FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE CASCADE,
    FOREIGN KEY ("productId") REFERENCES "products"("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "purchase_items_purchaseId_idx" ON "purchase_items"("purchaseId")`,
  `CREATE INDEX IF NOT EXISTS "purchase_items_productId_idx" ON "purchase_items"("productId")`,

  // Quotations
  `CREATE TABLE IF NOT EXISTS "quotations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "clientId" TEXT,
    "externalClientName" TEXT,
    "sellerUserId" TEXT NOT NULL,
    "subtotal" REAL NOT NULL,
    "tax" REAL NOT NULL DEFAULT 0,
    "discount" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "validUntil" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'activa',
    "convertedToSaleId" TEXT UNIQUE,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" DATETIME,
    FOREIGN KEY ("clientId") REFERENCES "clients"("id"),
    FOREIGN KEY ("sellerUserId") REFERENCES "users"("id"),
    FOREIGN KEY ("convertedToSaleId") REFERENCES "sales"("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "quotations_clientId_idx" ON "quotations"("clientId")`,
  `CREATE INDEX IF NOT EXISTS "quotations_sellerUserId_idx" ON "quotations"("sellerUserId")`,
  `CREATE INDEX IF NOT EXISTS "quotations_date_idx" ON "quotations"("date")`,
  `CREATE INDEX IF NOT EXISTS "quotations_status_idx" ON "quotations"("status")`,
  `CREATE INDEX IF NOT EXISTS "quotations_updatedAt_idx" ON "quotations"("updatedAt")`,
  `CREATE INDEX IF NOT EXISTS "quotations_lastSyncedAt_idx" ON "quotations"("lastSyncedAt")`,

  // Quotation Items
  `CREATE TABLE IF NOT EXISTS "quotation_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quotationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" DATETIME,
    FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE CASCADE,
    FOREIGN KEY ("productId") REFERENCES "products"("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "quotation_items_quotationId_idx" ON "quotation_items"("quotationId")`,
  `CREATE INDEX IF NOT EXISTS "quotation_items_productId_idx" ON "quotation_items"("productId")`,

  // Commissions
  `CREATE TABLE IF NOT EXISTS "commissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sellerId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "percentage" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendiente',
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" DATETIME,
    FOREIGN KEY ("sellerId") REFERENCES "users"("id"),
    FOREIGN KEY ("saleId") REFERENCES "sales"("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "commissions_sellerId_idx" ON "commissions"("sellerId")`,
  `CREATE INDEX IF NOT EXISTS "commissions_saleId_idx" ON "commissions"("saleId")`,
  `CREATE INDEX IF NOT EXISTS "commissions_date_idx" ON "commissions"("date")`,
  `CREATE INDEX IF NOT EXISTS "commissions_status_idx" ON "commissions"("status")`,

  // Expenses
  `CREATE TABLE IF NOT EXISTS "expenses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "category" TEXT NOT NULL,
    "responsibleUserId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" DATETIME,
    FOREIGN KEY ("responsibleUserId") REFERENCES "users"("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "expenses_date_idx" ON "expenses"("date")`,
  `CREATE INDEX IF NOT EXISTS "expenses_responsibleUserId_idx" ON "expenses"("responsibleUserId")`,
  `CREATE INDEX IF NOT EXISTS "expenses_category_idx" ON "expenses"("category")`,

  // Cash Records
  `CREATE TABLE IF NOT EXISTS "cash_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "openingBalance" REAL NOT NULL,
    "cashIncome" REAL NOT NULL DEFAULT 0,
    "cashExpenses" REAL NOT NULL DEFAULT 0,
    "closingBalance" REAL NOT NULL,
    "notes" TEXT,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'closed',
    "closedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" DATETIME,
    FOREIGN KEY ("userId") REFERENCES "users"("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "cash_records_date_idx" ON "cash_records"("date")`,
  `CREATE INDEX IF NOT EXISTS "cash_records_userId_idx" ON "cash_records"("userId")`,
  `CREATE INDEX IF NOT EXISTS "cash_records_status_idx" ON "cash_records"("status")`,

  // Cash Withdrawals
  `CREATE TABLE IF NOT EXISTS "cash_withdrawals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cashRecordId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" DATETIME,
    FOREIGN KEY ("cashRecordId") REFERENCES "cash_records"("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "users"("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "cash_withdrawals_cashRecordId_idx" ON "cash_withdrawals"("cashRecordId")`,
  `CREATE INDEX IF NOT EXISTS "cash_withdrawals_userId_idx" ON "cash_withdrawals"("userId")`,

  // Roles
  `CREATE TABLE IF NOT EXISTS "roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "description" TEXT NOT NULL,
    "permissions" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6B7280',
    "status" TEXT NOT NULL DEFAULT 'active',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" DATETIME
  )`,

  // Credits
  `CREATE TABLE IF NOT EXISTS "credits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleId" TEXT NOT NULL UNIQUE,
    "clientId" TEXT NOT NULL,
    "total" REAL NOT NULL,
    "balance" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dueDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" DATETIME,
    FOREIGN KEY ("saleId") REFERENCES "sales"("id"),
    FOREIGN KEY ("clientId") REFERENCES "clients"("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "credits_clientId_idx" ON "credits"("clientId")`,
  `CREATE INDEX IF NOT EXISTS "credits_status_idx" ON "credits"("status")`,
  `CREATE INDEX IF NOT EXISTS "credits_updatedAt_idx" ON "credits"("updatedAt")`,
  `CREATE INDEX IF NOT EXISTS "credits_lastSyncedAt_idx" ON "credits"("lastSyncedAt")`,

  // Credit Payments
  `CREATE TABLE IF NOT EXISTS "credit_payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creditId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT NOT NULL DEFAULT 'efectivo',
    "reference" TEXT,
    "notes" TEXT,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" DATETIME,
    FOREIGN KEY ("creditId") REFERENCES "credits"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "credit_payments_creditId_idx" ON "credit_payments"("creditId")`,
  `CREATE INDEX IF NOT EXISTS "credit_payments_updatedAt_idx" ON "credit_payments"("updatedAt")`,
  `CREATE INDEX IF NOT EXISTS "credit_payments_lastSyncedAt_idx" ON "credit_payments"("lastSyncedAt")`,
]

async function main() {
  // Backup existing DB
  if (fs.existsSync(dbPath)) {
    fs.copyFileSync(dbPath, backupPath)
    console.log(`Backup creado: ${backupPath}`)
    fs.unlinkSync(dbPath)
    console.log(`DB anterior eliminada: ${dbPath}`)
  }

  // Create new empty DB
  const client = createClient({ url: "file:" + dbPath.replace(/\\/g, "/") })

  console.log("Creando tablas vacías...")
  for (const sql of TABLES) {
    await client.execute(sql)
  }

  // ── SEMILLA MÍNIMA: 1 rol + 1 usuario ──
  // Usar bcryptjs para hash (mismo que usa el login)
  const bcrypt = require("bcryptjs")
  const hashedPassword = bcrypt.hashSync("admin123", 10)
  const now = new Date().toISOString()

  console.log("\n🌱 Insertando datos iniciales...")

  // Prisma migrations table (necesaria para evitar errores)
  await client.execute(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "checksum" TEXT NOT NULL,
      "finished_at" DATETIME,
      "migration_name" TEXT NOT NULL,
      "logs" TEXT,
      "rolled_back_at" DATETIME,
      "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    )
  `)

  // 1. Rol Administrador (UUID fijo para consistencia con PostgreSQL)
  await client.execute({
    sql: `INSERT INTO roles (id, name, description, permissions, color, status, "isSystem", "createdAt", "updatedAt", "isDeleted")
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      "6ccf70c8-78b8-4d0d-b32c-7d3cb1692eb3",
      "Administrador",
      "Acceso completo al sistema",
      JSON.stringify([
        "dashboard",
        "clients",
        "quotations",
        "sales",
        "products",
        "suppliers",
        "purchases",
        "categories",
        "inventory",
        "expenses",
        "cash",
        "reports",
        "users",
        "roles",
        "permissions",
        "sync",
      ]),
      "#EF4444",
      "active",
      true, // isSystem
      now,
      now,
      false, // isDeleted
    ],
  })

  // 2. Usuario Administrador (UUID fijo)
  await client.execute({
    sql: `INSERT INTO users (id, ci, "firstName", "lastName", address, phone, email, password, role, status, "createdAt", "updatedAt", "isDeleted")
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      "b92ad810-b72e-4897-8d86-9bdeaadba5c8",
      "0000001",
      "Admin",
      "Sistema",
      "Av. Principal",
      "70000001",
      "admin@gmail.com",
      hashedPassword,
      "administrador",
      "active",
      now,
      now,
      false, // isDeleted
    ],
  })

  console.log("  ✅ Rol: Administrador (16 permisos)")
  console.log("  ✅ Usuario: admin@gmail.com / admin123")

  // Verify
  const tables = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  )

  console.log("\nTablas creadas:")
  console.log("=".repeat(50))
  for (const row of tables.rows) {
    const count = await client.execute('SELECT COUNT(*) as cnt FROM "' + row.name + '"')
    const marker = count.rows[0].cnt > 0 ? "📦" : "✓"
    console.log(`  ${marker} ${row.name.padEnd(25)} ${count.rows[0].cnt} rows`)
  }
  console.log("=".repeat(50))
  console.log(`\nTotal: ${tables.rows.length} tablas`)
  console.log(`DB lista en: ${dbPath}`)
  console.log(`Tamaño: ${(fs.statSync(dbPath).length / 1024).toFixed(1)} KB`)

  await client.close()
}

main().catch((err) => {
  console.error("Error:", err)
  process.exit(1)
})
