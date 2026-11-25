const { createClient } = require("@libsql/client")
const fs = require("fs")
const path = require("path")
const { app } = require("electron")
const { randomUUID } = require("crypto")
const { migrateDesktopDatabase } = require("./sqlite-migrations")

function toFileUrl(filePath) {
  return `file:${filePath.replace(/\\/g, "/").replace(/ /g, "%20")}`
}

const MAX_INSTALL_BACKUPS = 3

/** Borra los archivos auxiliares de la DB (-wal, -shm, -journal). */
function removeDatabaseSidecarFiles(databasePath) {
  for (const suffix of ["-wal", "-shm", "-journal"]) {
    const candidate = `${databasePath}${suffix}`
    try {
      if (fs.existsSync(candidate)) fs.unlinkSync(candidate)
    } catch (error) {
      console.warn(`[db-manager] No se pudo borrar ${candidate}:`, error?.message || error)
    }
  }
}

/** Borra la base de datos y sus archivos auxiliares (-wal, -shm, -journal). */
function removeDatabaseFiles(databasePath) {
  try {
    if (fs.existsSync(databasePath)) fs.unlinkSync(databasePath)
  } catch (error) {
    console.warn(`[db-manager] No se pudo borrar ${databasePath}:`, error?.message || error)
  }
  removeDatabaseSidecarFiles(databasePath)
}

/** Guarda una copia de la DB antes de reinicializarla (rotación: máx. 3). */
function backupDatabaseBeforeReset(databasePath) {
  if (!fs.existsSync(databasePath)) return null

  const backupPath = `${databasePath}.pre-install-backup-${Date.now()}.db`
  try {
    fs.copyFileSync(databasePath, backupPath)

    const dir = path.dirname(databasePath)
    const base = path.basename(databasePath)
    const oldBackups = fs
      .readdirSync(dir)
      .filter((file) => file.startsWith(`${base}.pre-install-backup-`))
      .map((file) => ({ file, time: fs.statSync(path.join(dir, file)).mtimeMs }))
      .sort((a, b) => b.time - a.time)

    for (const { file } of oldBackups.slice(MAX_INSTALL_BACKUPS)) {
      fs.unlinkSync(path.join(dir, file))
    }

    return backupPath
  } catch (error) {
    console.warn("[db-manager] No se pudo crear el backup previo:", error?.message || error)
    return null
  }
}

/**
 * Borra el contenido de todas las tablas conservando el esquema.
 * Se usa como fallback cuando no hay template de la DB disponible.
 */
async function wipeDatabaseContents(databasePath) {
  const client = createClient({ url: toFileUrl(databasePath) })

  try {
    await client.execute("PRAGMA foreign_keys = OFF")
    const tables = await client.execute(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
    )

    for (const row of tables.rows) {
      const tableName = String(row.name).replace(/"/g, '""')
      await client.execute(`DELETE FROM "${tableName}"`)
    }

    await client.execute("PRAGMA foreign_keys = ON")
    return true
  } finally {
    await client.close()
  }
}

/**
 * Pone el esquema al día aplicando las migraciones versionadas.
 * Reemplaza el viejo `repairLegacyDesktopDatabase`, que creaba tablas y columnas
 * a mano sin dejar registro de lo aplicado (ver lib/electron/sqlite-migrations.js).
 */
async function applySchemaMigrations(databasePath) {
  const result = await migrateDesktopDatabase(databasePath)

  if (result.applied.length === 0) {
    console.log("[migrations] esquema ya actualizado")
    return result
  }

  console.log(`[migrations] ${result.applied.length} migración(es) aplicadas`)
  if (result.backupPath) {
    console.log(`[migrations] copia previa: ${result.backupPath}`)
  }
  return result
}

async function ensureMinimumSecurityData(databasePath) {
  const client = createClient({ url: toFileUrl(databasePath) })

  try {
    // La tabla `permissions` la crea la migración 20261111000500; acá sólo se
    // siembran los permisos por defecto.
    const now = new Date().toISOString()
    const defaultPermissions = [
      ["dashboard", "Dashboard", "Acceso al panel principal"],
      ["clients", "Clientes", "Gestion de clientes"],
      ["suppliers", "Proveedores", "Gestion de proveedores"],
      ["inventory", "Inventario", "Control de inventario"],
      ["quotations", "Cotizaciones", "Gestion de cotizaciones"],
      ["purchases", "Compras", "Gestion de compras"],
      ["sales", "Ventas", "Gestion de ventas"],
      ["expenses", "Gastos", "Gestion de gastos"],
      ["reports", "Reportes", "Acceso a reportes"],
      ["cash", "Caja", "Control de caja"],
      ["categories", "Categorias", "Gestion de categorias"],
      ["users", "Usuarios", "Gestion de usuarios"],
      ["roles", "Roles", "Gestion de roles"],
      ["permissions", "Permisos", "Gestion de permisos"],
      ["sync", "Sincronizacion", "Sincronizacion de datos"],
    ]

    for (const [key, label, description] of defaultPermissions) {
      await client.execute({
        sql: `
          INSERT OR IGNORE INTO permissions (
            id, key, label, description, status, isSystem, createdAt, updatedAt, isDeleted
          ) VALUES (?, ?, ?, ?, 'active', 1, ?, ?, 0)
        `,
        args: [randomUUID(), key, label, description, now, now],
      })
    }

    const rolesCountResult = await client.execute("SELECT COUNT(*) as count FROM roles")
    const rolesCount = Number(rolesCountResult.rows?.[0]?.count || 0)

    if (rolesCount === 0) {
      await client.execute({
        sql: `
          INSERT OR IGNORE INTO roles (
            id, name, description, permissions, color, status, isSystem, createdAt, updatedAt, isDeleted
          ) VALUES (?, 'Administrador', 'Acceso total al sistema', ?, '#EF4444', 'active', 1, ?, ?, 0)
        `,
        args: [randomUUID(), JSON.stringify(["*"]), now, now],
      })
    }

  } finally {
    await client.close()
  }
}

/**
 * Prepara la base de datos local de la app de escritorio.
 *
 * @param {string} dbPath Ruta del archivo SQLite en userData.
 * @param {string} templateDbPath Ruta del template limpio (prisma/renault.db).
 * @param {object} options
 * @param {boolean} options.resetDatabase  Limpia la DB (instalación nueva).
 * @returns {Promise<{wiped: boolean, backupPath: string|null}>}
 */
async function ensureDesktopDatabase(dbPath, templateDbPath, options = {}) {
  const { resetDatabase = false } = options
  const templateAvailable = Boolean(templateDbPath && fs.existsSync(templateDbPath))
  let wiped = false
  let backupPath = null

  try {
    // Ensure parent directory exists (handles paths with spaces)
    const parentDir = path.dirname(dbPath)
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true })
    }

    if (resetDatabase) {
      if (templateAvailable) {
        // Se respalda la DB anterior y se reemplaza por el template limpio.
        backupPath = backupDatabaseBeforeReset(dbPath)
        removeDatabaseFiles(dbPath)
        fs.copyFileSync(templateDbPath, dbPath)
        // Se limpian los journals por si quedó alguno del intento anterior.
        removeDatabaseSidecarFiles(dbPath)
        wiped = true
      } else if (fs.existsSync(dbPath)) {
        // Sin template disponible: se vacían las tablas conservando el esquema.
        console.warn("[db-manager] Template no encontrado: se vacía la DB existente")
        backupPath = backupDatabaseBeforeReset(dbPath)
        wiped = await wipeDatabaseContents(dbPath)
      }
    }

    if (!fs.existsSync(dbPath) && templateDbPath) {
      fs.copyFileSync(templateDbPath, dbPath)
    }

    if (fs.existsSync(dbPath)) {
      await applySchemaMigrations(dbPath)
      await ensureMinimumSecurityData(dbPath)
    }
  } catch (error) {
    throw error
  }

  return { wiped, backupPath }
}

module.exports = {
  applySchemaMigrations,
  ensureDesktopDatabase,
  removeDatabaseFiles,
  removeDatabaseSidecarFiles,
  wipeDatabaseContents,
}
