const path = require("path")
const fs = require("fs")
const { app } = require("electron")
const { getSqliteDatabaseFileName } = require("../shared/database-config")

const isDev = !app.isPackaged

function resolveExistingPath(candidates) {
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) return candidate
  }
  return null
}

const getUnpackedPath = (...s) => path.join(process.resourcesPath, "app.asar.unpacked", ...s)
const getAppPath = (...s) => path.join(app.getAppPath(), ...s)

function resolveAssetPath(...s) {
  return resolveExistingPath([
    !isDev && getUnpackedPath(...s),
    getAppPath(...s),
    path.join(__dirname, "..", "..", ...s), // Ajustado por la nueva ubicación en lib/electron/
    path.join(process.cwd(), ...s),
  ])
}

function getAppIconPath() {
  return (
    resolveAssetPath("public", "renaultreluz.ico") ||
    resolveAssetPath("public", "renaultreluz.png") ||
    resolveAssetPath("public", "icon-dark-32x32.png")
  )
}

function getTemplateDatabaseConfig() {
  const configPath = resolveAssetPath("prisma", "template-db-config.json")
  if (!configPath) return null

  try {
    return JSON.parse(fs.readFileSync(configPath, "utf8"))
  } catch {
    return null
  }
}

function findFallbackTemplateDatabasePath() {
  const prismaDirs = [
    !isDev && getUnpackedPath("prisma"),
    getAppPath("prisma"),
    path.join(__dirname, "..", "..", "prisma"),
    path.join(process.cwd(), "prisma"),
  ].filter(Boolean)

  for (const prismaDir of prismaDirs) {
    if (!fs.existsSync(prismaDir)) continue
    const dbFiles = fs.readdirSync(prismaDir).filter((entry) => entry.endsWith(".db"))
    if (dbFiles.length === 1) return path.join(prismaDir, dbFiles[0])
  }

  return null
}

function getTemplateDatabaseFileName() {
  try {
    return getSqliteDatabaseFileName()
  } catch {
    /* fall through to config-based lookup */
  }

  const config = getTemplateDatabaseConfig()
  if (config?.fileName) return config.fileName

  const fallbackPath = findFallbackTemplateDatabasePath()
  if (fallbackPath) return path.basename(fallbackPath)

  throw new Error("No se pudo resolver el nombre de la base SQLite template.")
}

function getTemplateDatabasePath() {
  return (
    resolveAssetPath("prisma", "renault.db") || path.join(process.cwd(), "prisma", "renault.db")
  )
}

module.exports = {
  isDev,
  resolveAssetPath,
  getAppIconPath,
  getTemplateDatabaseFileName,
  getTemplateDatabasePath,
}
