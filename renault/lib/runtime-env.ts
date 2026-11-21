import process from "process"
import { getAppRuntime, isElectronRuntime } from "./app-runtime"

const {
  getPostgresDatabaseUrl: getPostgresDatabaseUrlFromConfig,
  getSqliteDatabaseUrl: getSqliteDatabaseUrlFromConfig,
  resolveSqliteDatabaseUrl: resolveSqliteDatabaseUrlFromConfig,
  resolveSqliteDatabasePath: resolveSqliteDatabasePathFromConfig,
  getSqliteDatabaseFileName: getSqliteDatabaseFileNameFromConfig,
} = require("./shared/database-config")

export type { AppRuntime } from "./app-runtime"
export { getAppRuntime, isElectronRuntime }

export function getPostgresDatabaseUrl() {
  return getPostgresDatabaseUrlFromConfig()
}

export function getSqliteDatabaseUrl() {
  return process.env.DATABASE_URL_LOCAL || "file:./prisma/renault.db"
}

export function getCloudUrl() {
  return process.env.CLOUD_URL || ""
}

export function resolveSqliteDatabaseUrl() {
  return resolveSqliteDatabaseUrlFromConfig(getSqliteDatabaseUrl(), process.cwd())
}

export function resolveSqliteDatabasePath() {
  return resolveSqliteDatabasePathFromConfig(getSqliteDatabaseUrl(), process.cwd())
}

export function getSqliteDatabaseFileName() {
  return getSqliteDatabaseFileNameFromConfig(getSqliteDatabaseUrl(), process.cwd())
}
