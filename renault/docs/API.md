# API

Base: `/api`. Auth por cookie `access_token` (JWT). Errores: `{ error: string }`.

## Convenciones

- Listados: `GET ?search=&page=1&limit=50` → `{ data, pagination }`
  (reportes `[type]`: además `?all=true`, `?startDate=&endDate=`).
- Escrituras: JSON + validación Zod → `400` con mensaje; conflictos `409`.
- Permisos: `recurso.accion` (`sales.create`, `cash.withdraw`, …) o `*`.

## Módulos

| Recurso                 | Rutas                                                                                                                             |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Auth                    | `POST /auth/{login,logout,refresh,forgot-password,setup,change-password}`, `GET /auth/{me,setup/check}`, `/auth/profile[/avatar]` |
| Usuarios/Roles/Permisos | `/users[/[id]]`, `/roles[/[id]]`, `/permissions[/[id][/toggle-status]]`                                                           |
| Catálogo                | `/products[/[id][/import[/template]]]`, `/categories[/[id][/toggle-status]]`                                                      |
| Contactos               | `/clients[/[id]]`, `/suppliers[/[id][/toggle-status]]`, `/supplier-requests`                                                      |
| Ventas                  | `/sales[/[id][/cancel]]` (cancelar revierte caja y crédito)                                                                       |
| Compras                 | `/purchases`                                                                                                                      |
| Cotizaciones            | `/quotations[/[id][/convert][/supplier-requests]]`                                                                                |
| Créditos                | `/credits[/[id]/payments]`, `/purchase-credits[/[id]/payments]`                                                                   |
| Caja/Gastos             | `/cash-records[/[id][/close[/-summary][/withdraw]]][/today-summary]`, `/expenses[/[id]]`                                          |
| Reportes/Dashboard      | `/reports[/[type][/comparison]]`, `/dashboard/{stats,charts}`, `/ops/summary`                                                     |
| Sistema                 | `/settings/{company,logo}`, `/notifications[/[id]/read]`, `/backup[/restore]`                                                     |

## Reglas de negocio relevantes

- Ventas/compras/gastos exigen caja abierta (`400` si no).
- Venta valida stock en-tx (sin stock negativo); compra revalida productos en-tx.
- Anular venta revierte el ingreso (contado o inicial de crédito) y cancela su crédito.
- Pagos de crédito proveedor registran egreso en caja.
