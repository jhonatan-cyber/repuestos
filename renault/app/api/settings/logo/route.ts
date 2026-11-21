import { logger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"
import { readFileSync } from "fs"
import { join } from "path"

const FALLBACK_LOGO_PATH = join(process.cwd(), "public", "renaultreluz.png")

const NO_CACHE = {
  "Cache-Control": "no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

function serveFallback() {
  try {
    const buffer = readFileSync(FALLBACK_LOGO_PATH)
    return new NextResponse(buffer, {
      headers: { "Content-Type": "image/png", ...NO_CACHE },
    })
  } catch {
    return new NextResponse(null, { status: 404 })
  }
}

export async function GET() {
  try {
    const config = await prisma.systemConfig.findFirst()
    if (config?.logoBase64) {
      const buffer = Buffer.from(config.logoBase64, "base64")
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": config.logoMime || "image/png",
          ...NO_CACHE,
        },
      })
    }
    return serveFallback()
  } catch {
    return serveFallback()
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    if (!hasAnyPermission(actor, ["admin", "settings"])) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("logo") as File | null
    if (!file) return NextResponse.json({ error: "Archivo no encontrado" }, { status: 400 })

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Solo se permiten imágenes" }, { status: 400 })
    }
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Máximo 2MB" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString("base64")

    const existing = await prisma.systemConfig.findFirst()
    if (existing) {
      await prisma.systemConfig.update({
        where: { id: existing.id },
        data: { logoMime: file.type, logoBase64: base64 },
      })
    } else {
      await prisma.systemConfig.create({ data: { logoMime: file.type, logoBase64: base64 } })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("[api/settings/logo] Error", {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json({ error: "Error al guardar el logo" }, { status: 500 })
  }
}
