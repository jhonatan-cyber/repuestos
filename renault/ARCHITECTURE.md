# Arquitectura

## Runtime dual

- **Web**: Next.js 16 (`output: standalone`) + Postgres (`PrismaPg`).
- **Desktop**: Electron + Next local + SQLite (`PrismaLibSql`). `lib/runtime-env.ts` y
  `APP_RUNTIME` deciden el adaptador. Singleton único en `lib/prisma.ts` (`getPrismaClient()`).
- **Backend único**: web y escritorio usan los mismos API routes; no hay canal IPC de
  datos. El proceso main sólo expone capacidades nativas (respaldo/restauración,
  impresión, PDF, notificaciones y actualizaciones). Detalle en
  `docs/PARITY_WEB_ELECTRON.md`.

## Fuente única de schema

`prisma/base/models.prisma` → `scripts/generate-schemas.ts` genera
`prisma/sqlite/schema.prisma` y `prisma/postgres/schema.prisma`.
Migraciones por motor en `prisma/{sqlite,postgres}/migrations/`.
Nada de raw SQL en app: freeze documentado en `lib/prisma.ts`.

La base SQLite que ya está en la máquina del cliente no usa `prisma migrate deploy` (el
CLI no se empaqueta): se actualiza con `lib/electron/sqlite-migrations.js`, un runner con
migraciones ordenadas e idempotentes registradas en `_desktop_migrations`
(`migrateDesktopDatabase` respalda el archivo antes de aplicar lo pendiente).

## Auth

JWT (`jose`, access 15m + refresh 7d, cookies `httpOnly/lax`) en `lib/auth/tokens.ts`.
Defensa en profundidad: `proxy.ts` (Edge) + `getApiActor/hasAnyPermission` en cada
ruta API (`lib/api-security.ts`). Permisos en formato `modulo.accion` o `*`.

## Dinero y caja

Toda mutación de stock/caja es atómica (`increment/decrement` dentro de `$transaction`):
ventas, anulaciones (revierten ingreso y cancelan el crédito), compras, gastos,
retiros, cobros de crédito y pagos a proveedores (egreso). Solo una caja `open`
(guard en creación dentro de tx). Notificaciones/auditoría siempre fire-and-forget
(`.catch(() => {})`) salvo intentos de login.

## Listados

Paginación estándar `?page&limit` (cap 100; reportes cap 500, `?all=true` para
exportar): `{ data, pagination: { page, limit, total, totalPages } }`.
En frontend, `unwrapList()` (`lib/api-list.ts`) acepta ambos formatos.

## Observabilidad y límites

Rate-limit en memoria (`lib/rate-limit.ts`) en auth/import/backup/restore/reports.
Headers de seguridad en `next.config.mjs`. Logs vía `lib/logger.ts`.

## Respaldos

JSON portable (`/api/backup` ↔ `/api/backup/restore`) en ambos runtimes. La copia `.db`
se genera sólo en escritorio (lectura del archivo local vía IPC); se restaura en web y en
escritorio por el mismo route, que la convierte al mismo payload con
`lib/backup-sqlite.ts` (`sql.js`, sin módulo nativo) y aplica la misma transacción. No hay
camino de restauración alternativo en escritorio. Paridad y contratos:
`docs/PARITY_WEB_ELECTRON.md` y `tests/integration/contract/web-desktop-parity.test.ts`.
