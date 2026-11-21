import type { PrismaClient } from "../node_modules/.prisma/client-postgres"
import { getPrismaClient } from "./prisma"

/**
 * Compat: antes creaba un SEGUNDO pool PG propio. Ahora delega al singleton
 * compartido de `@/lib/prisma` (un solo `PrismaPg` por proceso web).
 */
export function getPostgresPrisma(): PrismaClient {
  return getPrismaClient() as unknown as PrismaClient
}
