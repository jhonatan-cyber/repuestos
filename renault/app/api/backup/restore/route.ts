import { logger } from "@/lib/logger"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"
import { createErrorResponse, createSuccessResponse } from "@/lib/api-utils"
import { checkRateLimit, getClientKey } from "@/lib/rate-limit"
import { BACKUP_MODELS as RESTORE_ORDER, LEGACY_OPTIONAL_BACKUP_MODELS } from "@/lib/backup-models"
import {
  SqliteBackupError,
  formatBackupByteLimit,
  getMaxJsonBackupBytes,
  getMaxSqliteBackupBytes,
  isSqliteBackup,
  sqliteBufferToBackupPayload,
} from "@/lib/backup-sqlite"
import { getAppRuntime } from "@/lib/runtime-env"

// Tables to clear before restore (reverse order to respect FK constraints)
const CLEAR_ORDER = [...RESTORE_ORDER].reverse()

interface RestoreBody {
  meta?: unknown
  data?: Record<string, unknown>
}

/** Valida el payload (JSON o convertido desde `.db`). Devuelve un mensaje de error o null. */
function validatePayload(body: RestoreBody): string | null {
  if (!body?.meta || !body?.data || typeof body.data !== "object" || Array.isArray(body.data)) {
    return "Archivo de backup inválido: faltan campos meta o data"
  }

  const { data } = body

  // Validación mínima del payload: solo modelos conocidos, arrays con cap
  for (const key of Object.keys(data)) {
    if (!(RESTORE_ORDER as readonly string[]).includes(key)) {
      return `Modelo desconocido en backup: ${key}`
    }
  }
  for (const model of RESTORE_ORDER) {
    if (data[model] === undefined && LEGACY_OPTIONAL_BACKUP_MODELS.has(model)) continue
    if (!Array.isArray(data[model])) {
      return `Backup inválido: faltan registros de ${model}`
    }
    if ((data[model] as unknown[]).length > 50000) {
      return `Demasiados registros en ${model} (máx 50000)`
    }
  }

  return null
}

/**
 * Lee el backup del request. Acepta:
 * - `application/json`: backup portable generado por `/api/backup`.
 * - `multipart/form-data` con el campo `file`: copia SQLite (`.db`) de escritorio,
 *   que se convierte al mismo payload JSON antes de restaurar.
 */
async function readPayload(request: NextRequest): Promise<RestoreBody> {
  const contentType = request.headers.get("content-type") ?? ""
  const runtime = getAppRuntime()

  if (contentType.includes("multipart/form-data")) {
    // En escritorio el archivo es local, así que se acepta una copia más grande;
    // en web viaja por la red y se mantiene el tope chico. El resto de la
    // validación (cabecera, tablas, límites por modelo, transacción) es igual.
    const maxSqliteBytes = getMaxSqliteBackupBytes(runtime)
    const form = await request.formData()
    const file = form.get("file")

    if (!file || typeof file === "string") {
      throw new SqliteBackupError("Falta el archivo de backup")
    }
    if (file.size === 0) throw new SqliteBackupError("El archivo está vacío")
    if (file.size > maxSqliteBytes) {
      throw new SqliteBackupError(
        `La copia SQLite supera el máximo de ${formatBackupByteLimit(maxSqliteBytes)}`,
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    if (!isSqliteBackup(buffer)) {
      throw new SqliteBackupError("El archivo no es una base SQLite válida (.db)")
    }

    return (await sqliteBufferToBackupPayload(buffer, {
      runtime,
      maxBytes: maxSqliteBytes,
    })) as RestoreBody
  }

  const body = (await request.json()) as RestoreBody
  // Límite anti-DoS: en web el backup JSON viaja por la red; en escritorio el
  // archivo es local, así que se acepta uno más grande. La validación del
  // payload (modelos conocidos, arrays, límites por modelo) es igual.
  const maxJsonBytes = getMaxJsonBackupBytes(runtime)
  if (JSON.stringify(body).length > maxJsonBytes) {
    throw new SqliteBackupError(
      `Backup demasiado grande (máx ${formatBackupByteLimit(maxJsonBytes)})`,
    )
  }
  return body
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) {
      return createErrorResponse("No autenticado", 401)
    }
    if (!hasAnyPermission(actor, ["sync", "reports.all"])) {
      return createErrorResponse("Sin permisos para restaurar backup", 403)
    }
    const rl = checkRateLimit(`restore:${getClientKey(request)}`, 5, 60_000)
    if (!rl.allowed) return createErrorResponse("Demasiadas restauraciones, intentá más tarde", 429)

    const body = await readPayload(request)

    const validationError = validatePayload(body)
    if (validationError) return createErrorResponse(validationError, 400)

    const data = body.data as Record<string, unknown[]>
    const stats: Record<string, number> = {}

    // Run everything in a transaction
    await prisma.$transaction(
      async (tx) => {
        // 1. Clear all tables in reverse order
        for (const model of CLEAR_ORDER) {
          // Legacy backups did not contain company settings; preserve the current settings.
          if (model === "systemConfig" && data[model] === undefined) continue
          if ((tx as any)[model]) {
            await (tx as any)[model].deleteMany()
          }
        }

        // 2. Restore every record; any failure must roll back the whole transaction.
        for (const model of RESTORE_ORDER) {
          const records = data[model]
          if (!Array.isArray(records) || records.length === 0) {
            stats[model] = 0
            continue
          }
          const result = await (tx as any)[model].createMany({ data: records })
          if (result.count !== records.length) throw new Error(`Restauración incompleta: ${model}`)
          stats[model] = result.count
        }
      },
      { timeout: 120_000 },
    )

    const totalRecords = Object.values(stats).reduce((a, b) => a + b, 0)

    logger.info("[api/backup/restore] Restore completed", { stats, totalRecords })

    return createSuccessResponse({
      message: "Base de datos restaurada exitosamente",
      totalRecords,
      stats,
    })
  } catch (error) {
    if (error instanceof SqliteBackupError) {
      return createErrorResponse(error.message, error.status)
    }
    logger.error("[api/backup/restore] Error restoring backup", {
      error: error instanceof Error ? error.message : error,
    })
    return createErrorResponse("No se pudo restaurar el backup", 500)
  }
}
