import "dotenv/config"
import { defineConfig } from "prisma/config"
import { getPostgresDatabaseUrl, getSqliteDatabaseUrl, isElectronRuntime } from "./lib/runtime-env"

const isElectron = isElectronRuntime()

export default defineConfig({
  schema: isElectron ? "prisma/sqlite/schema.prisma" : "prisma/postgres/schema.prisma",
  datasource: {
    url: isElectron ? getSqliteDatabaseUrl() : getPostgresDatabaseUrl(),
  },
  migrations: {
    seed: "pnpm tsx ./prisma/seed.ts",
  },
})
