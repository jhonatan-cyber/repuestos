// ponytail: ─── FREEZE ───────────────────────────────
// Este archivo NO debe recibir más raw SQL inline.
// Cualquier nueva migración → schema.prisma + `prisma migrate dev`.
// Cualquier nueva consulta → query builder de Prisma, no SQL crudo.
// Si necesitás cambiar algo acá, primero hablá con el equipo.
// ────────────────────────────────────────────────────

import type { PrismaClient as SqlitePrismaClient } from "../node_modules/.prisma/client"
import type { PrismaClient as PostgresPrismaClient } from "../node_modules/.prisma/client-postgres"
import { isElectronRuntime } from "./app-runtime"

const usingElectronRuntime = isElectronRuntime()
const globalForPrisma = globalThis as unknown as {
  prismaV2: SqlitePrismaClient | PostgresPrismaClient | undefined
}

function createPrisma(): SqlitePrismaClient | PostgresPrismaClient {
  if (globalForPrisma.prismaV2) {
    return globalForPrisma.prismaV2
  }

  if (usingElectronRuntime) {
    const { PrismaLibSql } =
      require("@prisma/adapter-libsql") as typeof import("@prisma/adapter-libsql")
    const { resolveSqliteDatabaseUrl } = require("./runtime-env") as typeof import("./runtime-env")
    const { PrismaClient } =
      require("../node_modules/.prisma/client") as typeof import("../node_modules/.prisma/client")
    const dbUrl = resolveSqliteDatabaseUrl()
    const adapter = new PrismaLibSql({ url: dbUrl })
    const basePrisma = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    })
    globalForPrisma.prismaV2 = basePrisma
    return basePrisma
  }

  const { PrismaPg } = require("@prisma/adapter-pg") as typeof import("@prisma/adapter-pg")
  const { getPostgresDatabaseUrl } = require("./runtime-env") as typeof import("./runtime-env")
  const { PrismaClient } =
    require("../node_modules/.prisma/client-postgres") as typeof import("../node_modules/.prisma/client-postgres")

  const dbUrl = getPostgresDatabaseUrl()
  if (!dbUrl) {
    throw new Error(
      "[prisma] DATABASE_URL no está configurado. " +
        "Definí DATABASE_URL o DATABASE_URL_WEB en tu archivo .env para conectar a PostgreSQL.",
    )
  }

  const adapter = new PrismaPg({ connectionString: dbUrl })
  const basePrisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
  globalForPrisma.prismaV2 = basePrisma
  return basePrisma
}

function getPrisma() {
  if (!globalForPrisma.prismaV2) {
    globalForPrisma.prismaV2 = createPrisma()
  }
  return globalForPrisma.prismaV2
}

/** Accesor al singleton compartido (un solo pool por runtime). */
export function getPrismaClient() {
  return getPrisma()
}

export const prisma = new Proxy({} as SqlitePrismaClient, {
  get(_, prop) {
    return (getPrisma() as any)[prop]
  },
})
