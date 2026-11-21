import { createRequire } from "node:module"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

import { BACKUP_MODELS, SQLITE_MODEL_TABLES } from "@/lib/backup-models"

const require = createRequire(import.meta.url)

/** Copia SQLite mínima (sólo columnas id) para probar la restauración `.db`. */
async function sqliteBackupFile(skippedTables: string[] = []): Promise<File> {
  const { default: initSqlJs } = await import("sql.js")
  const SQL = await initSqlJs({ locateFile: (file) => require.resolve(`sql.js/dist/${file}`) })
  const db = new SQL.Database()
  for (const model of BACKUP_MODELS) {
    const table = SQLITE_MODEL_TABLES[model]
    if (skippedTables.includes(table)) continue
    db.run(`CREATE TABLE "${table}" (id TEXT PRIMARY KEY)`)
  }
  const bytes = db.export()
  db.close()
  return new File([new Uint8Array(bytes)], "renault.db", { type: "application/vnd.sqlite3" })
}

/** Archivo con cabecera SQLite válida pero contenido basura, del tamaño pedido. */
function fakeSqliteFile(bytes: number): File {
  const content = Buffer.alloc(bytes)
  content.write("SQLite format 3\0", 0, "latin1")
  return new File([new Uint8Array(content)], "renault.db", { type: "application/vnd.sqlite3" })
}

function multipartReq(file: File | null) {
  const formData = new FormData()
  if (file) formData.append("file", file)
  return new NextRequest(new URL("http://localhost:3000/api/backup/restore"), {
    method: "POST",
    headers: { cookie: "access_token=valid", "x-forwarded-for": uniqueIp() },
    body: formData,
  })
}

const mockPrisma = vi.hoisted(() => {
  const model = () => ({ findMany: vi.fn().mockResolvedValue([]) })
  return {
    role: model(),
    user: model(),
    category: model(),
    supplier: model(),
    client: model(),
    product: model(),
    sale: model(),
    saleItem: model(),
    purchase: model(),
    purchaseItem: model(),
    quotation: model(),
    quotationItem: model(),
    supplierRequest: model(),
    commission: model(),
    expense: model(),
    cashRecord: model(),
    cashWithdrawal: model(),
    credit: model(),
    creditPayment: model(),
    purchaseCredit: model(),
    purchaseCreditPayment: model(),
    auditLog: model(),
    notification: model(),
    systemConfig: model(),
  }
})

const mockTx = vi.hoisted(() => {
  const model = () => ({
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    createMany: vi.fn(async ({ data }: { data: unknown[] }) => ({ count: data.length })),
  })
  return {
    role: model(),
    user: model(),
    category: model(),
    supplier: model(),
    client: model(),
    product: model(),
    sale: model(),
    saleItem: model(),
    purchase: model(),
    purchaseItem: model(),
    quotation: model(),
    quotationItem: model(),
    supplierRequest: model(),
    commission: model(),
    expense: model(),
    cashRecord: model(),
    cashWithdrawal: model(),
    credit: model(),
    creditPayment: model(),
    purchaseCredit: model(),
    purchaseCreditPayment: model(),
    auditLog: model(),
    notification: model(),
    systemConfig: model(),
  }
})

vi.mock("@/lib/prisma", () => ({
  prisma: {
    ...mockPrisma,
    $transaction: async (callback: (tx: unknown) => Promise<unknown>) => callback(mockTx),
  },
}))

vi.mock("@/lib/auth/tokens", () => ({ verifyAccessToken: vi.fn() }))

import * as tokens from "@/lib/auth/tokens"
import { GET as getBackup } from "@/app/api/backup/route"
import { POST as postRestore } from "@/app/api/backup/restore/route"

// Cada request usa una IP distinta para no compartir el bucket del rate-limit.
let requestCount = 0
function uniqueIp() {
  requestCount += 1
  return `10.0.0.${requestCount}`
}

function req(url: string, init?: RequestInit) {
  return new NextRequest(new URL(`http://localhost:3000${url}`), {
    ...init,
    headers: { ...init?.headers, "x-forwarded-for": uniqueIp() },
  } as never)
}

function authedReq(url: string, init?: RequestInit) {
  return req(url, {
    ...init,
    headers: { ...init?.headers, cookie: "access_token=valid" },
  })
}

function tokenWith(permissions: string[]) {
  return { sub: "user-1", role: "Administrador", permissions }
}

function restoreBody(data: Record<string, unknown> = {}) {
  return JSON.stringify({ meta: { format: "json" }, data })
}

function emptyBackupData() {
  return Object.fromEntries(BACKUP_MODELS.map((model) => [model, []]))
}

describe("GET /api/backup", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    for (const model of Object.values(mockPrisma)) model.findMany.mockResolvedValue([])
  })

  it("returns 401 without a session", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(null)
    const res = await getBackup(req("/api/backup"))
    expect(res.status).toBe(401)
  })

  it("returns 403 without backup permissions", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(tokenWith(["dashboard"]) as never)
    const res = await getBackup(authedReq("/api/backup"))
    expect(res.status).toBe(403)
  })

  it("includes every backup model and runtime metadata", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(tokenWith(["reports.read"]) as never)
    const res = await getBackup(authedReq("/api/backup"))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(Object.keys(body.data).sort()).toEqual([...BACKUP_MODELS].sort())
    expect(body.meta.models).toEqual([...BACKUP_MODELS])
    expect(body.meta.format).toBe("json")
    expect(body.meta.runtime).toBe("web")
    expect(res.headers.get("Content-Disposition")).toContain("renault-backup-web-")
  })

  it("rejects a backup that exceeds the per-model limit", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(tokenWith(["reports.all"]) as never)
    mockPrisma.product.findMany.mockResolvedValue(
      Array.from({ length: 50001 }, (_, index) => ({ id: String(index) })),
    )
    const res = await getBackup(authedReq("/api/backup"))
    expect(res.status).toBe(500)
    expect((await res.json()).error).toBe("No se pudo generar el backup")
  })
})

describe("POST /api/backup/restore", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    for (const model of Object.values(mockTx)) {
      model.deleteMany.mockResolvedValue({ count: 0 })
      model.createMany.mockImplementation(async ({ data }: { data: unknown[] }) => ({
        count: data.length,
      }))
    }
  })

  it("returns 401 without a session", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(null)
    const res = await postRestore(
      req("/api/backup/restore", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: restoreBody(emptyBackupData()),
      }),
    )
    expect(res.status).toBe(401)
  })

  it("returns 403 without restore permissions", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(tokenWith(["dashboard"]) as never)
    const res = await postRestore(
      authedReq("/api/backup/restore", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: restoreBody(emptyBackupData()),
      }),
    )
    expect(res.status).toBe(403)
  })

  it("returns 400 when meta or data is missing", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(tokenWith(["reports.all"]) as never)
    const res = await postRestore(
      authedReq("/api/backup/restore", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: emptyBackupData() }),
      }),
    )
    expect(res.status).toBe(400)
  })

  it("returns 400 for unknown models", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(tokenWith(["reports.all"]) as never)
    const res = await postRestore(
      authedReq("/api/backup/restore", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: restoreBody({ ...emptyBackupData(), notAModel: [] }),
      }),
    )
    expect(res.status).toBe(400)
    expect((await res.json()).error).toContain("Modelo desconocido")
  })

  it("returns 400 when a required model is missing", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(tokenWith(["reports.all"]) as never)
    const data = emptyBackupData()
    delete (data as Record<string, unknown>).client
    const res = await postRestore(
      authedReq("/api/backup/restore", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: restoreBody(data),
      }),
    )
    expect(res.status).toBe(400)
    expect((await res.json()).error).toContain("faltan registros de client")
  })

  it("restores records and reports the totals", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(tokenWith(["sync"]) as never)
    const data = emptyBackupData()
    ;(data as Record<string, unknown>).client = [{ id: "c1", name: "Cliente" }]
    ;(data as Record<string, unknown>).role = [{ id: "r1", name: "Vendedor" }]

    const res = await postRestore(
      authedReq("/api/backup/restore", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: restoreBody(data),
      }),
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.totalRecords).toBe(2)
    expect(body.stats.client).toBe(1)
    expect(body.stats.role).toBe(1)
    expect(mockTx.client.createMany).toHaveBeenCalledWith({
      data: [{ id: "c1", name: "Cliente" }],
    })
    // El orden de limpieza es el inverso al de restauración.
    expect(mockTx.systemConfig.deleteMany).toHaveBeenCalled()
  })

  it("restaura una copia SQLite (.db) enviada como multipart", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(tokenWith(["reports.all"]) as never)

    const res = await postRestore(multipartReq(await sqliteBackupFile()))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.totalRecords).toBe(0)
    expect(mockTx.user.deleteMany).toHaveBeenCalled()
  })

  it("returns 400 when the multipart request has no file", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(tokenWith(["reports.all"]) as never)
    const res = await postRestore(multipartReq(null))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toContain("Falta el archivo")
  })

  it("returns 400 when the uploaded file is not SQLite", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(tokenWith(["reports.all"]) as never)
    const fake = new File(["{ not a database }"], "renault.db")
    const res = await postRestore(multipartReq(fake))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toContain("no es una base SQLite válida")
  })

  it("returns 400 when the SQLite file lacks a required table", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(tokenWith(["reports.all"]) as never)
    const res = await postRestore(multipartReq(await sqliteBackupFile(["clients"])))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toContain("clients")
  })

  it("rejects a .db over 25MB when the restore runs on the web", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(tokenWith(["reports.all"]) as never)
    const res = await postRestore(multipartReq(fakeSqliteFile(26 * 1024 * 1024)))

    expect(res.status).toBe(400)
    expect((await res.json()).error).toContain("supera el máximo de 25MB")
    expect(mockTx.user.deleteMany).not.toHaveBeenCalled()
  })

  it("accepts the size of a .db over 25MB on the desktop and still validates it", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(tokenWith(["reports.all"]) as never)
    process.env.APP_RUNTIME = "electron"

    try {
      const res = await postRestore(multipartReq(fakeSqliteFile(26 * 1024 * 1024)))
      const body = await res.json()

      // Pasó el control de tamaño (mensaje distinto) pero la copia es basura:
      // la validación sigue rechazándola antes de tocar la base.
      expect(res.status).toBe(400)
      expect(body.error).toContain("dañada")
      expect(mockTx.user.deleteMany).not.toHaveBeenCalled()
    } finally {
      delete process.env.APP_RUNTIME
    }
  })

  it("rejects a JSON backup over 25MB when the restore runs on the web", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(tokenWith(["reports.all"]) as never)

    const data = emptyBackupData()
    ;(data as Record<string, unknown>).notification = [
      { id: "n1", payload: "x".repeat(26 * 1024 * 1024) },
    ]

    const res = await postRestore(
      authedReq("/api/backup/restore", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: restoreBody(data),
      }),
    )

    expect(res.status).toBe(400)
    expect((await res.json()).error).toContain("demasiado grande")
    expect(mockTx.user.deleteMany).not.toHaveBeenCalled()
  })

  it("accepts a JSON backup over 25MB on the desktop", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(tokenWith(["reports.all"]) as never)
    process.env.APP_RUNTIME = "electron"

    try {
      const data = emptyBackupData()
      ;(data as Record<string, unknown>).notification = [
        { id: "n1", payload: "x".repeat(26 * 1024 * 1024) },
      ]

      const res = await postRestore(
        authedReq("/api/backup/restore", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: restoreBody(data),
        }),
      )

      expect(res.status).toBe(200)
      expect((await res.json()).totalRecords).toBe(1)
    } finally {
      delete process.env.APP_RUNTIME
    }
  })
})
