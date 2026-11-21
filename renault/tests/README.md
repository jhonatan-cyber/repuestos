# Tests

Unitarios/integración con Vitest + E2E con Playwright. Gestor: **bun**.

## Estructura

```
tests/
├── unit/                # validations, sales-utils, auth, api-security, backup-sqlite, migraciones SQLite…
├── integration/api/     # auth, settings, backup, listados
├── integration/contract/ # paridad web ⇄ escritorio (dashboard, compras, caja, reportes)
├── e2e/                 # specs Playwright (mayoría humo/stubs)
└── helpers/auth.ts
```

## Comandos

```bash
bun run test:unit        # vitest run (CI lo exige en verde)
bun run test:unit:watch  # vitest
bun run test:e2e         # playwright (usa build+start en CI)
bun run test:e2e:ui
```

## Configuración

- `vitest.config.ts`: cobertura en `lib/**` (app/components excluidos a propósito).
- `playwright.config.ts`: solo Chromium, `workers: 1`, base `http://localhost:5000`.
- En CI el webServer es `bun run start` (build previo); en local `bun run dev`.
- E2E necesita DB con datos y puerto 5000 libre.
