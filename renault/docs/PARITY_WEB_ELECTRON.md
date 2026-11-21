# Paridad Web ⇄ Electron — revisión del 11 de noviembre de 2026

Revisión del backend compartido entre la versión web (`next start` + Postgres/SQLite)
y la app de escritorio (Electron + Next local + SQLite), más los cambios aplicados:
retiro del canal IPC de datos, unificación de respaldos y política de actualización.

## Resumen ejecutivo

La app de escritorio **nunca tuvo un backend propio en el uso normal**: `main.js`
arranca el mismo server de Next (`lib/electron/server-manager.js`) y la ventana carga
`http://localhost:<puerto>/login`. Sin ese server la interfaz ni siquiera abre
(`waitForServer` muestra un diálogo de error).

Aun así, el renderer desviaba **14 entidades** a un canal IPC
(`lib/api-client.ts` → `lib/ipc-client.ts` → `lib/electron/db-service.js`) que
reimplementaba los API routes y había quedado desactualizado. Esa duplicación producía
resultados distintos en pantalla, caja y stock (detalle en
[Hallazgos](#hallazgos-históricos)).

**Cambios aplicados**:

1. El renderer usa siempre el HTTP API; el backend IPC duplicado fue eliminado.
2. El respaldo JSON es portable y funciona igual en web y escritorio; la copia `.db` se
   genera en escritorio y se restaura en **ambos** entornos por el mismo endpoint, que
   la convierte al mismo payload antes de aplicar.
3. La base SQLite local ya **no se reinicia en cada actualización** (sólo se crea limpia
   en la primera ejecución del perfil), pero cada actualización **garantiza el usuario
   `admin@gmail.com` con contraseña `admin123`**, aunque se la haya cambiado.

## Backend único

| Situación                                | Antes                                   | Ahora    |
| ---------------------------------------- | --------------------------------------- | -------- |
| Web (navegador)                          | HTTP API                                | HTTP API |
| Electron en desarrollo                   | HTTP API                                | HTTP API |
| Electron empaquetado, entidades CRUD     | IPC (Prisma directo en el proceso main) | HTTP API |
| Electron empaquetado, resto de endpoints | HTTP API                                | HTTP API |

Archivos eliminados: `lib/electron/ipc-router.js`, `lib/electron/db-service.js`,
`lib/electron/handlers/*`, `lib/electron/transforms.js`, `lib/electron/auth.js`,
`lib/electron/permissions.js`, `lib/electron/permissions-store.js`, `lib/ipc-client.ts`
y sus tests (`ipc-client-mapping`, `electron-ipc-auth`, `electron-products`,
`electron-ipc-router`).

Se mantienen los canales IPC **nativos**, que no son lógica de negocio: generación de la
copia `.db` (lectura del archivo local), diálogos de archivo, impresión, exportación a
PDF, notificaciones del sistema y actualizaciones. La restauración de datos **no** es un
canal IPC: pasa siempre por `/api/backup/restore`.

En Electron se ignora `navigator.onLine`: el server es local, así que una PC sin
internet ya no encola mutaciones "offline" que nunca llegaban a la base.

## Hallazgos históricos

Divergencias que existían cuando el renderer desviaba al IPC. Se conservan como registro
de por qué se retiró el canal; **las rutas de `db-service.js`/`handlers/` citadas ya no
existen** y los defectos desaparecieron con la eliminación del backend duplicado.

| #   | Severidad | Área                                   | Web (API route)                                                                                                    | IPC eliminado                                                      |
| --- | --------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| 1   | Crítico   | Dashboard stats                        | `periodSalesTotal`, `periodSalesCount`, `lowStockProducts`, `recentSales`                                          | `totalSales`, `todaySales`, `monthSales`… → la UI mostraba ceros   |
| 2   | Crítico   | Dashboard charts                       | `salesByDay`, `topProducts`, `salesByCategory`, `paymentMethods`, `profitByDay`                                    | `salesData`, `expensesData` → gráficos vacíos                      |
| 3   | Crítico   | Reportes comparativos                  | Totales del período anterior                                                                                       | `thisMonth` / `lastMonth` → ceros                                  |
| 4   | Crítico   | Registrar compra                       | Valida productos/comprador, proveedor por defecto, stock sólo si `recibida`, crédito al proveedor, `paymentMethod` | Incrementaba stock siempre y no generaba deuda                     |
| 5   | Alto      | Listado de compras                     | `purchaseType`, `initialPayment`, `initialDebt`, `debtAmount`                                                      | No devolvía esos campos                                            |
| 6   | Alto      | Abrir caja                             | Rechaza con 409 si ya hay una abierta                                                                              | Permitía dos cajas `open`                                          |
| 7   | Alto      | Eliminar producto                      | Desactiva si tiene ventas/compras/cotizaciones                                                                     | Respondía 400                                                      |
| 8   | Alto      | Eliminar cliente                       | Desactiva si tiene ventas/cotizaciones/créditos                                                                    | Respondía 400                                                      |
| 9   | Alto      | Roles                                  | Sólo `Administrador` es `isSystem`                                                                                 | Marcaba los 5 roles por defecto como sistema y bloqueaba editarlos |
| 10  | Alto      | Cotización → venta                     | Valida stock; responde `{ message, saleId }`                                                                       | Sin validación de stock; creaba comisión                           |
| 11  | Medio     | `/api/reports` y `/api/reports/{type}` | Catálogo y reportes paginados                                                                                      | `reports_get` inexistente → 404                                    |
| 12  | Medio     | Comisiones                             | No crea `commission` al vender                                                                                     | Creaba comisión del 5%                                             |
| 13  | Medio     | Auditoría y notificaciones             | `logAudit` + `createNotification`                                                                                  | No existían                                                        |
| 14  | Medio     | Editar venta                           | Sólo método/splits/notas/estado, valida splits                                                                     | Escritura arbitraria sobre `sale`                                  |
| 15  | Medio     | Anular venta                           | Revierte caja y cancela el crédito                                                                                 | Sólo devolvía stock                                                |
| 16  | Medio     | Crear venta                            | Valida stock                                                                                                       | Podía dejar stock negativo                                         |
| 17  | Bajo      | Búsquedas y orden                      | Distintos criterios por entidad                                                                                    | Criterios distintos                                                |
| 18  | Bajo      | Paginación                             | `{ data, pagination }`                                                                                             | Varios listados sin paginar                                        |
| 19  | Bajo      | Categorías                             | Listado paginado                                                                                                   | Sin paginación                                                     |
| 20  | Bajo      | Crear/actualizar producto              | Respuesta según route                                                                                              | Transformación distinta                                            |

## Respaldos unificados

Formato canónico: **JSON** (`/api/backup` y `/api/backup/restore`), idéntico en web y
escritorio.

| Acción                | Web                                                       | Escritorio                                                        |
| --------------------- | --------------------------------------------------------- | ----------------------------------------------------------------- |
| Backup JSON           | Descarga del archivo                                      | Diálogo nativo de guardado (`save-backup-json`) con el mismo JSON |
| Restaurar JSON        | Selector `.json` → `POST /api/backup/restore`             | Selector nativo (`pick-backup-json`) → `POST /api/backup/restore` |
| Copia SQLite `.db`    | No se genera (el web usa Postgres)                        | Diálogo nativo; imagen completa de la base local                  |
| Restaurar copia `.db` | Selector `.db` → `POST /api/backup/restore` (`multipart`) | Selector `.db` → `POST /api/backup/restore` (`multipart`)         |

El respaldo JSON de escritorio se restaura en la web y viceversa.

La copia `.db` se restaura por ese mismo route: detecta la cabecera `SQLite format 3`,
lee las tablas con `sql.js` (SQLite en WASM, sin módulo nativo) y las normaliza al mismo
payload JSON que produce `/api/backup` (`lib/backup-sqlite.ts`). A partir de ahí se
aplica la misma transacción de restauración, así que web y escritorio comparten
conversión, validación, límites y rollback. Los tipos se derivan de `PRAGMA table_info`
(`BOOLEAN` → booleano, `DATETIME` → ISO, `REAL` → número), no de una lista fija.

El tope de tamaño depende del runtime: **25 MB** en web (el archivo viaja por la red) y
**256 MB** en escritorio (se lee del disco local y se procesa en memoria con `sql.js`).
Sólo cambia el tamaño aceptado; la cabecera SQLite, las tablas obligatorias, los límites
por modelo y la transacción se validan igual en los dos entornos.

El escritorio **no** reemplaza el archivo de la base: sube el `.db` al mismo endpoint,
igual que la web. Las dos vías terminan con los mismos datos y no requieren reiniciar la
app; si la conversión o la inserción falla, la transacción deja la base intacta. El
canal IPC `restore-database` (copia del archivo sobre la base activa) fue eliminado.

## Actualizaciones y base SQLite

Antes, `resolveInstallAction` (`lib/electron/install-state.js`) reiniciaba la base ante
tres señales: primera instalación, cambio de id del instalador y cambio de versión. Como
el instalador NSIS reescribe su id en **cada** actualización (y `electron-updater` cambia
la versión), toda actualización borraba los datos de la empresa y reseteaba la contraseña
del admin a `admin123` (guardando un `.pre-install-backup-*.db` no visible desde la UI).

Ahora:

- **Primera ejecución del perfil** (sin estado previo): se crea la base desde el template
  y el admin por defecto. Es el único caso que reinicia.
- **Actualización o reinstalación** (cambia el id del instalador o la versión): los datos
  se conservan, el esquema se pone al día con las migraciones versionadas y se ejecuta
  `ensureMinimumSecurityData(forcePassword: true)`, que crea `admin@gmail.com` si falta y
  **restablece su contraseña a `admin123`**. El resto de usuarios y sus contraseñas no se
  tocan.
- **Misma instalación y misma versión**: no se modifican datos ni credenciales.
- El id del instalador se sigue guardando como diagnóstico y, junto con la versión, es
  la señal de "actualización" (nunca de reinicio de la base).

Consecuencia a tener en cuenta: si el administrador cambia la contraseña del usuario
`admin@gmail.com`, la próxima actualización la vuelve a `admin123`. Para auditoría, el
log de escritorio registra cuando se asegura el admin (`usuario admin asegurado`).

## Migraciones de esquema en escritorio

Las bases SQLite se actualizan con un runner propio, no con `prisma migrate deploy` (el
CLI de Prisma no se empaqueta). `lib/electron/sqlite-migrations.js` lista las migraciones
en orden (`id` con prefijo timestamp) y registra las aplicadas en `_desktop_migrations`:

- Cada migración es idempotente (`CREATE TABLE IF NOT EXISTS`, o `hasColumn` antes de
  `ALTER TABLE`), así también puede correr sobre un template que ya trae el cambio.
- Al abrir la base, `applySchemaMigrations` respalda el archivo
  (`.pre-migration-backup-*.db`, rotación de 3) y aplica sólo lo pendiente.
- `getSqliteMigrationStatus(client)` devuelve `{ applied, pending, total }` para
  diagnóstico.
- Para un cambio de esquema nuevo: agregar una migración al final del array y reflejarlo
  en `prisma/base/models.prisma`; nunca editar una migración ya publicada.

Histórico: antes el esquema se "reparaba" con `repairLegacyDesktopDatabase`, un bloque
ad-hoc de tablas/columnas sin registro de lo aplicado que se ejecutaba entero en cada
arranque. Ese bloque se convirtió en las migraciones `2026111100*`.

## Autenticación y permisos

- Mismo JWT (HS256, cookie `access_token` httpOnly) y mismos permisos
  (`modulo.accion`, `*`) en ambos runtimes, aplicados por `proxy.ts` y por cada route.
- El admin-only de `/api/users`, `/api/roles`, `/api/permissions`, `/api/settings` y
  `/api/backup` vive en el proxy, común a web y escritorio.

## Matriz final

| Área                                  | Web                  | Escritorio           | Estado                       |
| ------------------------------------- | -------------------- | -------------------- | ---------------------------- |
| CRUD de todas las entidades           | HTTP API             | HTTP API             | Paridad                      |
| Dashboard, reportes, caja, créditos   | HTTP API             | HTTP API             | Paridad                      |
| Notificaciones, settings, backup JSON | HTTP API             | HTTP API             | Paridad                      |
| Backup `.db`                          | —                    | IPC nativo           | Sólo se genera en escritorio |
| Restaurar `.db`                       | HTTP API (convierte) | HTTP API (convierte) | Paridad                      |
| Impresión, PDF, auto-update           | Navegador / descarga | IPC nativo           | Diferencias intencionales    |

## Tests de contrato de paridad

`tests/integration/contract/web-desktop-parity.test.ts` ejecuta cada endpoint crítico dos
veces con el mismo set de datos, simulando `getAppRuntime()` = `web` y `electron`, y
verifica que status y JSON sean idénticos, además de los campos documentados del contrato:

| Módulo    | Endpoints                                                 |
| --------- | --------------------------------------------------------- |
| Dashboard | `/api/dashboard/stats`, `/api/dashboard/charts`           |
| Compras   | `/api/purchases`                                          |
| Caja      | `/api/cash-records`                                       |
| Reportes  | `/api/reports/{type}`, `/api/reports/comparison`          |
| Errores   | 401 sin sesión y 403 sin permisos en todos los anteriores |

## Recomendaciones pendientes

1. **Cifrado de respaldos**: el JSON incluye usuarios (con hash) y datos comerciales;
   hoy se descarga/guarda en claro.
2. **Backup `.db` desde la web**: hoy sólo se genera en escritorio porque es una imagen
   del archivo SQLite. Si se necesita desde la web habría que exportar el snapshot con
   `sql.js`.
3. **Restaurar `.db` de más de 256 MB**: el límite de escritorio está acotado por la
   memoria que consume `sql.js` al cargar la base completa. Subirlo requiere procesar la
   copia en streaming (por ejemplo `@sqlite.org/sqlite-wasm` con opfs) en vez de tenerla
   entera en memoria.
4. **Migraciones**: recordar agregar la migración al array cuando cambie el esquema de
   `prisma/base/models.prisma` (ver [Migraciones de esquema](#migraciones-de-esquema-en-escritorio)).

## Verificación

- `bun run typecheck`
- `bun run lint`
- `bun run test:unit`

Resultados en el mensaje de entrega. No se ejecutó el instalador ni un build empaquetado:
los diálogos nativos de respaldo y la política de actualización se validaron por código
y tests unitarios.
