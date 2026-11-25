import { logger } from "@/lib/logger"
import { type NextRequest, NextResponse } from "next/server"
import { verifyAccessToken } from "@/lib/auth/tokens"
import { getAccessTokenFromRequest } from "@/lib/auth/request-token"
import { prisma } from "@/lib/prisma"
import { resolveSqliteDatabasePath } from "@/lib/runtime-env"
import { writeFile, unlink, mkdir, readFile } from "fs/promises"
import sharp from "sharp"
import path from "path"

function resolveUploadDir() {
  if (process.env.APP_RUNTIME === "electron") {
    const raw = (process.env.DATABASE_URL_LOCAL || "").replace(/^file:/, "")
    const decoded = raw.includes("%") ? decodeURIComponent(raw) : raw
    const dbPath = decoded || path.join(process.cwd(), "prisma", "renault.db")
    return path.join(path.dirname(dbPath), "uploads", "users")
  }

  return path.join(process.cwd(), "public", "img", "users")
}

function resolveLegacyPublicDir() {
  return path.join(process.cwd(), "public", "img", "users")
}

const MAX_SIZE = 5 * 1024 * 1024 // 5MB

/**
 * GET /api/auth/profile/avatar?name=<filename>
 * Sirve avatar desde ruta writable (Electron) o fallback public.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get("name")

    if (!name) {
      return NextResponse.json({ error: "Nombre de avatar requerido" }, { status: 400 })
    }

    const filename = path.basename(name)
    const uploadDir = resolveUploadDir()
    const primaryPath = path.join(uploadDir, filename)
    const fallbackPath = path.join(resolveLegacyPublicDir(), filename)

    let fileBuffer: Buffer | null = null

    try {
      fileBuffer = await readFile(primaryPath)
    } catch {
      try {
        fileBuffer = await readFile(fallbackPath)
      } catch {
        return NextResponse.json({ error: "Avatar no encontrado" }, { status: 404 })
      }
    }

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    })
  } catch (error) {
    logger.error("[avatar][GET] Error", { error: error instanceof Error ? error.message : error })
    return NextResponse.json({ error: "Error al obtener avatar" }, { status: 500 })
  }
}

/**
 * POST /api/auth/profile/avatar
 * Sube la foto de perfil del usuario autenticado.
 */
export async function POST(request: NextRequest) {
  try {
    const accessToken = getAccessTokenFromRequest(request)
    if (!accessToken) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const payload = await verifyAccessToken(accessToken)
    if (!payload) {
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 })
    }

    const userId = payload.sub

    const formData = await request.formData()
    const file = formData.get("avatar") as File | null

    if (!file) {
      return NextResponse.json({ error: "No se envió ninguna imagen" }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "La imagen no debe superar 5MB" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Solo se permiten imágenes" }, { status: 400 })
    }

    const UPLOAD_DIR = resolveUploadDir()

    // Asegurar directorio
    await mkdir(UPLOAD_DIR, { recursive: true })

    // Eliminar avatar anterior si existe
    const existingUser = await prisma.user.findUnique({ where: { id: userId } })
    if (existingUser?.image) {
      const oldPath = path.join(UPLOAD_DIR, existingUser.image)
      try {
        await unlink(oldPath)
      } catch {
        /* no existe */
      }
    }

    // Guardar nuevo avatar optimizado como WebP
    const filename = `${userId}.webp`
    const buffer = Buffer.from(await file.arrayBuffer())
    const optimized = await sharp(buffer)
      .resize(256, 256, { fit: "cover", position: "center" })
      .webp({ quality: 80 })
      .toBuffer()
    await writeFile(path.join(UPLOAD_DIR, filename), optimized)

    // Actualizar DB
    await prisma.user.update({
      where: { id: userId },
      data: { image: filename },
    })

    return NextResponse.json({
      success: true,
      image: filename,
      url: `/api/auth/profile/avatar?name=${encodeURIComponent(filename)}`,
    })
  } catch (error) {
    logger.error("[avatar] Error", { error: error instanceof Error ? error.message : error })
    return NextResponse.json({ error: "Error al subir la imagen" }, { status: 500 })
  }
}

/**
 * DELETE /api/auth/profile/avatar
 * Elimina la foto de perfil del usuario autenticado.
 */
export async function DELETE(request: NextRequest) {
  try {
    const accessToken = getAccessTokenFromRequest(request)
    if (!accessToken) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const payload = await verifyAccessToken(accessToken)
    if (!payload) {
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 })
    }

    const userId = payload.sub

    const UPLOAD_DIR = resolveUploadDir()

    const existingUser = await prisma.user.findUnique({ where: { id: userId } })
    if (existingUser?.image) {
      const oldPath = path.join(UPLOAD_DIR, existingUser.image)
      try {
        await unlink(oldPath)
      } catch {
        /* no existe */
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { image: null },
    })

    return NextResponse.json({ success: true, message: "Foto eliminada" })
  } catch (error) {
    logger.error("[avatar] Error", { error: error instanceof Error ? error.message : error })
    return NextResponse.json({ error: "Error al eliminar la imagen" }, { status: 500 })
  }
}
