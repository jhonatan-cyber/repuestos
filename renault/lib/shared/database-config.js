const fs = require("fs")
const path = require("path")

function getFirstDefinedEnv(names) {
  for (const name of names) {
    const value = process.env[name]
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return ""
}

function getPostgresDatabaseUrl() {
  const value = getFirstDefinedEnv(["DATABASE_URL", "DATABASE_URL_WEB"])
  if (!value) {
    throw new Error(
      "Definí DATABASE_URL o DATABASE_URL_WEB en tu archivo .env para conectar a PostgreSQL.",
    )
  }
  return value
}

function getSqliteDatabaseUrl() {
  const value = getFirstDefinedEnv(["DATABASE_URL_LOCAL"])
  if (!value) {
    throw new Error("Definí DATABASE_URL_LOCAL en tu archivo .env para conectar a SQLite.")
  }
  return value
}

function decodeSqliteFilePath(databaseUrl = getSqliteDatabaseUrl()) {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error(`DATABASE_URL_LOCAL debe usar formato file:, recibido: ${databaseUrl}`)
  }

  const rawPath = databaseUrl.slice("file:".length)

  try {
    return rawPath.includes("%") ? decodeURIComponent(rawPath) : rawPath
  } catch {
    return rawPath
  }
}

function resolveSqliteDatabasePath(databaseUrl = getSqliteDatabaseUrl(), baseDir = process.cwd()) {
  const decodedPath = decodeSqliteFilePath(databaseUrl)
  return path.isAbsolute(decodedPath)
    ? path.normalize(decodedPath)
    : path.resolve(baseDir, decodedPath)
}

function resolveSqliteDatabaseUrl(databaseUrl = getSqliteDatabaseUrl(), baseDir = process.cwd()) {
  return `file:${resolveSqliteDatabasePath(databaseUrl, baseDir).replace(/\\/g, "/")}`
}

function getSqliteDatabaseFileName(databaseUrl = getSqliteDatabaseUrl(), baseDir = process.cwd()) {
  return path.basename(resolveSqliteDatabasePath(databaseUrl, baseDir))
}

function writeTemplateDatabaseConfig(configPath, config) {
  fs.mkdirSync(path.dirname(configPath), { recursive: true })
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
}

module.exports = {
  getPostgresDatabaseUrl,
  getSqliteDatabaseUrl,
  decodeSqliteFilePath,
  resolveSqliteDatabasePath,
  resolveSqliteDatabaseUrl,
  getSqliteDatabaseFileName,
  writeTemplateDatabaseConfig,
}
