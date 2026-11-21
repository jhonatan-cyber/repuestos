const fs = require("fs")
const path = require("path")

/**
 * Migraciones de esquema de la base SQLite de escritorio.
 *
 * Antes, `db-manager` "reparaba" bases viejas con un bloque ad-hoc de
 * `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE`, sin registro de qué se había
 * aplicado. Ahora cada cambio es una migración con id y se registra en la tabla
 * `_desktop_migrations`, así una base sólo ejecuta lo que le falta.
 *
 * Reglas:
 * - Los ids son inmutables y ordenan la ejecución (prefijo timestamp).
 * - Cada `up` debe poder correr sobre una base que ya tiene el cambio
 *   (el template nuevo ya trae las tablas): usar `IF NOT EXISTS` o `hasColumn`.
 * - No borrar ni editar migraciones ya publicadas: agregar una nueva.
 */

const MIGRATIONS_TABLE = "_desktop_migrations"

/** Máximo de copias previas a una migración que se conservan. */
const MAX_SCHEMA_BACKUPS = 3

async function hasTable(client, tableName) {
  const result = await client.execute({
    sql: "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    args: [tableName],
  })
  return Boolean(result.rows && result.rows.length > 0)
}

async function hasColumn(client, tableName, columnName) {
  if (!(await hasTable(client, tableName))) return false
  const result = await client.execute(`PRAGMA table_info("${tableName}")`)
  return (result.rows || []).some((row) => row.name === columnName)
}

async function addColumnIfMissing(client, tableName, columnName, definition) {
  // Si la tabla no existe no hay nada que migrar: las tablas base las crea el
  // template de Prisma, no estas migraciones.
  if (!(await hasTable(client, tableName))) return
  if (await hasColumn(client, tableName, columnName)) return
  await client.execute(`ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${definition}`)
}

const MIGRATIONS = [
  {
    id: "20261111000000_desktop_roles_table",
    name: "roles + índices",
    async up(client) {
      await client.execute(`
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
      `)
      await client.execute(`CREATE INDEX IF NOT EXISTS roles_updatedAt_idx ON roles(updatedAt)`)
      await client.execute(
        `CREATE INDEX IF NOT EXISTS roles_lastSyncedAt_idx ON roles(lastSyncedAt)`,
      )
    },
  },
  {
    id: "20261111000100_desktop_cash_withdrawals_table",
    name: "cash_withdrawals + índices",
    async up(client) {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS cash_withdrawals (
          id TEXT NOT NULL PRIMARY KEY,
          cashRecordId TEXT NOT NULL,
          userId TEXT NOT NULL,
          amount REAL NOT NULL,
          reason TEXT NOT NULL,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL,
          isDeleted BOOLEAN NOT NULL DEFAULT false,
          lastSyncedAt DATETIME,
          FOREIGN KEY (cashRecordId) REFERENCES cash_records(id) ON DELETE CASCADE,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
        )
      `)
      await client.execute(
        `CREATE INDEX IF NOT EXISTS cash_withdrawals_cashRecordId_idx ON cash_withdrawals(cashRecordId)`,
      )
      await client.execute(
        `CREATE INDEX IF NOT EXISTS cash_withdrawals_userId_idx ON cash_withdrawals(userId)`,
      )
    },
  },
  {
    id: "20261111000200_desktop_notifications_table",
    name: "notifications + índices",
    async up(client) {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT NOT NULL PRIMARY KEY,
          userId TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'info',
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          entity TEXT,
          entityId TEXT,
          url TEXT,
          metadata TEXT,
          isRead BOOLEAN NOT NULL DEFAULT false,
          readAt DATETIME,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL,
          isDeleted BOOLEAN NOT NULL DEFAULT false,
          lastSyncedAt DATETIME,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        )
      `)
      await client.execute(
        `CREATE INDEX IF NOT EXISTS notifications_userId_idx ON notifications(userId)`,
      )
      await client.execute(
        `CREATE INDEX IF NOT EXISTS notifications_userId_isRead_idx ON notifications(userId, isRead)`,
      )
      await client.execute(
        `CREATE INDEX IF NOT EXISTS notifications_createdAt_idx ON notifications(createdAt)`,
      )
    },
  },
  {
    id: "20261111000300_desktop_purchase_credits_table",
    name: "purchase_credits + índices",
    async up(client) {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS purchase_credits (
          id TEXT NOT NULL PRIMARY KEY,
          purchaseId TEXT NOT NULL UNIQUE,
          supplierId TEXT NOT NULL,
          total REAL NOT NULL,
          balance REAL NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          dueDate DATETIME NOT NULL,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL,
          isDeleted BOOLEAN NOT NULL DEFAULT false,
          lastSyncedAt DATETIME,
          FOREIGN KEY (purchaseId) REFERENCES purchases(id) ON DELETE CASCADE,
          FOREIGN KEY (supplierId) REFERENCES suppliers(id) ON DELETE RESTRICT ON UPDATE CASCADE
        )
      `)
      await client.execute(
        `CREATE INDEX IF NOT EXISTS purchase_credits_supplierId_idx ON purchase_credits(supplierId)`,
      )
      await client.execute(
        `CREATE INDEX IF NOT EXISTS purchase_credits_status_idx ON purchase_credits(status)`,
      )
    },
  },
  {
    id: "20261111000400_desktop_purchase_credit_payments_table",
    name: "purchase_credit_payments + índice",
    async up(client) {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS purchase_credit_payments (
          id TEXT NOT NULL PRIMARY KEY,
          purchaseCreditId TEXT NOT NULL,
          amount REAL NOT NULL,
          date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          paymentMethod TEXT NOT NULL DEFAULT 'efectivo',
          reference TEXT,
          notes TEXT,
          updatedAt DATETIME NOT NULL,
          isDeleted BOOLEAN NOT NULL DEFAULT false,
          lastSyncedAt DATETIME,
          FOREIGN KEY (purchaseCreditId) REFERENCES purchase_credits(id) ON DELETE CASCADE
        )
      `)
      await client.execute(
        `CREATE INDEX IF NOT EXISTS purchase_credit_payments_purchaseCreditId_idx ON purchase_credit_payments(purchaseCreditId)`,
      )
    },
  },
  {
    id: "20261111000500_desktop_permissions_table",
    name: "permissions",
    async up(client) {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS permissions (
          id TEXT NOT NULL PRIMARY KEY,
          key TEXT NOT NULL UNIQUE,
          label TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          isSystem BOOLEAN NOT NULL DEFAULT true,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL,
          isDeleted BOOLEAN NOT NULL DEFAULT false
        )
      `)
    },
  },
  {
    id: "20261111000600_desktop_supplier_requests_table",
    name: "supplier_requests + índices",
    async up(client) {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS supplier_requests (
          id TEXT NOT NULL PRIMARY KEY,
          "quotationId" TEXT NOT NULL,
          "supplierId" TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pendiente',
          "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "respondedAt" DATETIME,
          notes TEXT,
          response TEXT,
          "updatedAt" DATETIME NOT NULL,
          "isDeleted" BOOLEAN NOT NULL DEFAULT false,
          "lastSyncedAt" DATETIME,
          FOREIGN KEY ("quotationId") REFERENCES quotations(id) ON DELETE CASCADE,
          FOREIGN KEY ("supplierId") REFERENCES suppliers(id) ON DELETE RESTRICT ON UPDATE CASCADE
        )
      `)
      await client.execute(
        `CREATE INDEX IF NOT EXISTS idx_supplier_requests_quotation ON supplier_requests("quotationId")`,
      )
      await client.execute(
        `CREATE INDEX IF NOT EXISTS idx_supplier_requests_supplier ON supplier_requests("supplierId")`,
      )
      await client.execute(
        `CREATE INDEX IF NOT EXISTS idx_supplier_requests_status ON supplier_requests(status)`,
      )
    },
  },
  {
    id: "20261111000700_desktop_sales_payment_splits_and_notes",
    name: "sales.paymentSplits y sales.notes",
    async up(client) {
      await addColumnIfMissing(client, "sales", "paymentSplits", "TEXT")
      await addColumnIfMissing(client, "sales", "notes", "TEXT")
    },
  },
  {
    id: "20261111000800_desktop_quotations_external_client_phone",
    name: "quotations.externalClientPhone",
    async up(client) {
      await addColumnIfMissing(client, "quotations", "externalClientPhone", "TEXT")
    },
  },
  {
    id: "20261111000900_desktop_clients_email_and_metadata",
    name: "clients.email, nit, address, status, totalPurchases, updatedAt, isDeleted, lastSyncedAt",
    async up(client) {
      await addColumnIfMissing(client, "clients", "email", "TEXT")
      await addColumnIfMissing(client, "clients", "nit", "TEXT")
      await addColumnIfMissing(client, "clients", "address", "TEXT")
      await addColumnIfMissing(client, "clients", "status", "TEXT")
      await addColumnIfMissing(client, "clients", "totalPurchases", "REAL")
      await addColumnIfMissing(client, "clients", "updatedAt", "DATETIME")
      await addColumnIfMissing(client, "clients", "isDeleted", "BOOLEAN")
      await addColumnIfMissing(client, "clients", "lastSyncedAt", "DATETIME")
    },
  },
  {
    id: "20261111001000_desktop_suppliers_email_and_metadata",
    name: "suppliers.email, company, address, totalPurchases, updatedAt, isDeleted, lastSyncedAt",
    async up(client) {
      await addColumnIfMissing(client, "suppliers", "email", "TEXT")
      await addColumnIfMissing(client, "suppliers", "company", "TEXT")
      await addColumnIfMissing(client, "suppliers", "address", "TEXT")
      await addColumnIfMissing(client, "suppliers", "totalPurchases", "REAL")
      await addColumnIfMissing(client, "suppliers", "updatedAt", "DATETIME")
      await addColumnIfMissing(client, "suppliers", "isDeleted", "BOOLEAN")
      await addColumnIfMissing(client, "suppliers", "lastSyncedAt", "DATETIME")
    },
  },
]

async function ensureMigrationsTable(client) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id TEXT NOT NULL PRIMARY KEY,
      name TEXT NOT NULL,
      appliedAt DATETIME NOT NULL
    )
  `)
}

async function getAppliedMigrationIds(client) {
  await ensureMigrationsTable(client)
  const result = await client.execute(`SELECT id FROM ${MIGRATIONS_TABLE}`)
  return new Set((result.rows || []).map((row) => String(row.id)))
}

async function getPendingMigrations(client) {
  const applied = await getAppliedMigrationIds(client)
  return MIGRATIONS.filter((migration) => !applied.has(migration.id))
}

/**
 * Aplica las migraciones pendientes en orden y las registra.
 * @param {object} client Cliente libsql ya abierto sobre la DB.
 * @returns {Promise<{applied: string[]}>}
 */
async function runSqliteMigrations(client, options = {}) {
  const logger = options.logger || console
  await ensureMigrationsTable(client)

  const applied = await getAppliedMigrationIds(client)
  const pending = MIGRATIONS.filter((migration) => !applied.has(migration.id))

  for (const migration of pending) {
    logger.log(`[migrations] aplicando ${migration.id} (${migration.name})`)
    await migration.up(client)
    await client.execute({
      sql: `INSERT OR REPLACE INTO ${MIGRATIONS_TABLE} (id, name, appliedAt) VALUES (?, ?, ?)`,
      args: [migration.id, migration.name, new Date().toISOString()],
    })
  }

  return { applied: pending.map((migration) => migration.id) }
}

/** Estado actual para diagnóstico (`/api` de salud o logs de escritorio). */
async function getSqliteMigrationStatus(client) {
  const applied = await getAppliedMigrationIds(client)
  return {
    applied: MIGRATIONS.filter((migration) => applied.has(migration.id)).map((m) => m.id),
    pending: MIGRATIONS.filter((migration) => !applied.has(migration.id)).map((m) => m.id),
    total: MIGRATIONS.length,
  }
}

/** Copia de seguridad del archivo antes de migrar (rotación: máx. 3). */
function backupDatabaseBeforeMigrations(databasePath) {
  if (!fs.existsSync(databasePath)) return null

  const backupPath = `${databasePath}.pre-migration-backup-${Date.now()}.db`
  try {
    fs.copyFileSync(databasePath, backupPath)

    const dir = path.dirname(databasePath)
    const base = path.basename(databasePath)
    const oldBackups = fs
      .readdirSync(dir)
      .filter((file) => file.startsWith(`${base}.pre-migration-backup-`))
      .map((file) => ({ file, time: fs.statSync(path.join(dir, file)).mtimeMs }))
      .sort((a, b) => b.time - a.time)

    for (const { file } of oldBackups.slice(MAX_SCHEMA_BACKUPS)) {
      fs.unlinkSync(path.join(dir, file))
    }

    return backupPath
  } catch (error) {
    console.warn("[migrations] No se pudo crear la copia previa a migrar:", error?.message || error)
    return null
  }
}

/**
 * Punto de entrada para `db-manager`: abre la DB, respalda si hay pendientes y
 * aplica las migraciones.
 */
async function migrateDesktopDatabase(databasePath, options = {}) {
  const { createClient } = require("@libsql/client")
  const { logger = console } = options
  const toFileUrl = (filePath) => `file:${filePath.replace(/\\/g, "/").replace(/ /g, "%20")}`

  // 1. ¿Hay algo pendiente? Se cierra el cliente antes de copiar el archivo,
  //    así la copia previa a migrar es consistente.
  let pending = []
  let client = createClient({ url: toFileUrl(databasePath) })
  try {
    pending = await getPendingMigrations(client)
  } finally {
    await client.close()
  }

  const backupPath = pending.length > 0 ? backupDatabaseBeforeMigrations(databasePath) : null

  // 2. Aplicar (vuelve a calcular pendientes por si cambió el archivo).
  client = createClient({ url: toFileUrl(databasePath) })
  try {
    const result = await runSqliteMigrations(client, { logger })
    return { ...result, backupPath, pendingBefore: pending.map((migration) => migration.id) }
  } finally {
    await client.close()
  }
}

module.exports = {
  MIGRATIONS,
  MIGRATIONS_TABLE,
  getAppliedMigrationIds,
  getPendingMigrations,
  getSqliteMigrationStatus,
  migrateDesktopDatabase,
  runSqliteMigrations,
}
