import { logger } from "@/lib/logger"
import { prisma } from "@/lib/prisma"
import { parseJsonField } from "@/lib/json-field"

export interface AuditLogEntry {
  action: "CREATE" | "UPDATE" | "DELETE"
  entity: string
  entityId: string
  userId?: string | null
  changes?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
}

/**
 * @deprecated No-op. La tabla `audit_logs` la crean las migraciones Prisma
 * (`20260903000100_drift_baseline` + schema). Se conserva por compatibilidad
 * con llamadas existentes.
 */
export async function ensureAuditLogTable(): Promise<void> {
  return
}

/**
 * Registra una entrada de auditoría (query builder, sin raw SQL).
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        userId: entry.userId || null,
        changes: entry.changes ? JSON.stringify(entry.changes) : null,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
      },
    })
  } catch (error) {
    logger.warn("[audit] Failed to write audit log", {
      error: error instanceof Error ? error.message : error,
    })
  }
}

/**
 * Obtiene el historial de auditoría para una entidad específica.
 */
export async function getAuditTrail(
  entity: string,
  entityId: string,
  limit = 50,
): Promise<AuditLogEntry[]> {
  try {
    const rows = await prisma.auditLog.findMany({
      where: { entity, entityId },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return rows.map((row) => ({
      action: row.action as AuditLogEntry["action"],
      entity: row.entity,
      entityId: row.entityId,
      userId: row.userId,
      changes: parseJsonField<Record<string, unknown> | null>(row.changes, null),
      metadata: parseJsonField<Record<string, unknown> | null>(row.metadata, null),
    }))
  } catch (error) {
    return []
  }
}

/**
 * Obtiene todas las entradas de auditoría recientes.
 */
export async function getRecentAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
  try {
    const rows = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return rows.map((row) => ({
      action: row.action as AuditLogEntry["action"],
      entity: row.entity,
      entityId: row.entityId,
      userId: row.userId,
      changes: parseJsonField<Record<string, unknown> | null>(row.changes, null),
      metadata: parseJsonField<Record<string, unknown> | null>(row.metadata, null),
    }))
  } catch (error) {
    return []
  }
}
