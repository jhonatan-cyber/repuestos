# Renault ERP

ERP web + desktop (Electron) para repuestos: ventas, compras, inventario, caja, créditos, reportes.

## Requisitos

- Bun 1.3.11 (`packageManager` fijado)
- Postgres local para web / SQLite embebido para Electron

## Puesta en marcha

```bash
cp .env.example .env   # completar secretos (ver .env.example)
bun install --frozen-lockfile
bun run schema:generate
bun run db:generate
# SQLite (Electron): APP_RUNTIME=electron bunx prisma migrate deploy --schema=prisma/sqlite/schema.prisma
# Postgres (web):    bun run db:migrate:deploy:postgres
bun run dev            # Next en :5000
```

Scripts clave: `dev`, `build`, `start`, `lint`, `typecheck`, `test:unit`, `test:e2e`,
`db:seed`, `electron:build`. Ver `ARCHITECTURE.md` y `docs/API.md`.
