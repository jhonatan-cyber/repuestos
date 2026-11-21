import { logger } from "@/lib/logger"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"
import { getAppRuntime } from "@/lib/runtime-env"
import { BACKUP_MODELS } from "@/lib/backup-models"

export async function GET(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) {
      return new Response(JSON.stringify({ error: "No autenticado" }), {
        status: 401,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      })
    }
    if (
      !hasAnyPermission(actor, ["reports.read", "reports.export", "reports.all", "reports", "sync"])
    ) {
      return new Response(JSON.stringify({ error: "Sin permisos para generar backup" }), {
        status: 403,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      })
    }

    const payload: Record<string, unknown> = {}

    // Paralelo en vez de secuencial; counts para detectar backups gigantes
    const entries = await Promise.all(
      BACKUP_MODELS.map(async (model) => {
        const rows = await (prisma as any)[model].findMany({ take: 50001 })
        if (rows.length > 50000) throw new Error(`Demasiados registros para backup: ${model}`)
        return [model, rows] as const
      }),
    )
    for (const [model, rows] of entries) payload[model] = rows

    const generatedAt = new Date()
    const fileSafeTimestamp = generatedAt.toISOString().replace(/[:.]/g, "-")
    const runtime = getAppRuntime()
    const backup = {
      meta: {
        generatedAt: generatedAt.toISOString(),
        runtime,
        format: "json",
        sourceDatabase: runtime === "electron" ? "sqlite" : "postgresql",
        models: BACKUP_MODELS,
      },
      data: payload,
    }

    return new Response(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="renault-backup-${runtime}-${fileSafeTimestamp}.json"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    logger.error("[api/backup] Error generating backup", {
      error: error instanceof Error ? error.message : error,
    })
    return new Response(JSON.stringify({ error: "No se pudo generar el backup" }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    })
  }
}
