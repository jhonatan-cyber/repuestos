import { PrismaClient } from "@prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import fs from "fs"
import path from "path"

// ponytail: script autónomo — upsert logo desde public/renaultreluz.png
// Soporta SQLite (por defecto) y PostgreSQL. Usa las mismas env vars que el app.

const LOGO_PATH = path.join(__dirname, "..", "public", "renaultreluz.png")

function getPrisma() {
  const dbUrl = process.env.DATABASE_URL_LOCAL
  if (dbUrl) {
    const adapter = new PrismaLibSql({ url: dbUrl })
    return new PrismaClient({ adapter })
  }
  const pgUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_WEB
  if (pgUrl) {
    const pool = new Pool({ connectionString: pgUrl })
    const adapter = new PrismaPg(pool)
    return new PrismaClient({ adapter })
  }
  console.error(
    "❌ Definí DATABASE_URL_LOCAL (SQLite) o DATABASE_URL / DATABASE_URL_WEB (PostgreSQL)",
  )
  process.exit(1)
}

async function seedLogo() {
  if (!fs.existsSync(LOGO_PATH)) {
    console.error("❌ No se encuentra public/renaultreluz.png")
    process.exit(1)
  }

  const logoBuffer = fs.readFileSync(LOGO_PATH)
  const logoBase64 = logoBuffer.toString("base64")
  const prisma = getPrisma()

  try {
    await prisma.$connect()
    const existing = await prisma.systemConfig.findFirst()
    if (existing) {
      await prisma.systemConfig.update({
        where: { id: existing.id },
        data: { logoMime: "image/png", logoBase64 },
      })
    } else {
      await prisma.systemConfig.create({
        data: { logoMime: "image/png", logoBase64 },
      })
    }
    console.log("✅ Logo por defecto guardado en SystemConfig")
  } finally {
    await prisma.$disconnect()
  }
}

seedLogo()
