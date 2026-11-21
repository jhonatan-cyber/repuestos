import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

/**
 * Rate-limit en memoria (sliding window).
 *
 * LIMITACIÓN: el store vive en el proceso Node. En despliegues multi-instancia
 * (varios workers pm2, contenedores, etc.) cada instancia lleva su propio contador,
 * por lo que un atacante puede distribuir requests entre instancias y esquivar el límite.
 *
 * Para producción web multi-instancia reemplazar `buckets` por Redis/Upstash:
 *   import { Redis } from "@upstash/redis"
 *   const redis = new Redis({ url: process.env.UPSTASH_REDIS_URL, token: process.env.UPSTASH_REDIS_TOKEN })
 *   // INCR + EXPIRE en una pipeline atómica
 *
 * Para Electron (proceso único) este store es suficiente y no requiere dependencias externas.
 */
type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

function cleanup(now: number) {
  if (buckets.size < 1000) return
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k)
}

export function getClientKey(request: NextRequest, extra = ""): string {
  const fwd = request.headers.get("x-forwarded-for")
  const ip = fwd ? fwd.split(",")[0].trim() : request.headers.get("x-real-ip") || "unknown"
  return extra ? `${ip}:${extra}` : ip
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAfterSec: number
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  cleanup(now)
  const cur = buckets.get(key)
  if (!cur || cur.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAfterSec: Math.ceil(windowMs / 1000) }
  }
  if (cur.count >= limit) {
    return { allowed: false, remaining: 0, resetAfterSec: Math.ceil((cur.resetAt - now) / 1000) }
  }
  cur.count += 1
  return {
    allowed: true,
    remaining: limit - cur.count,
    resetAfterSec: Math.ceil((cur.resetAt - now) / 1000),
  }
}

/**
 * Retorna una respuesta 429 con los headers estándar `RateLimit-*` y `Retry-After`.
 * Úsalo cuando `checkRateLimit` devuelve `allowed: false`.
 */
export function rateLimitExceededResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    { error: "Demasiadas solicitudes. Intenta de nuevo en unos segundos." },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.resetAfterSec),
        "RateLimit-Remaining": "0",
        "RateLimit-Reset": String(Math.floor(Date.now() / 1000) + result.resetAfterSec),
      },
    },
  )
}

export const RATE_LIMITS = {
  /** 10 req/min por IP. El login añade un segundo factor: 3 intentos/15min por IP+email (via audit log). */
  auth: { limit: 10, windowMs: 60_000 },
  /** Operaciones costosas: import de productos, backup, restore. */
  sensitive: { limit: 20, windowMs: 60_000 },
  /** Generación de reportes y exports PDF/Excel. */
  reports: { limit: 30, windowMs: 60_000 },
} as const
