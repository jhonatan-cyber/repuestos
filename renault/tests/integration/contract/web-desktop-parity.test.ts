import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

/**
 * Contratos de paridad web ↔ escritorio.
 *
 * La web y la app de escritorio comparten los mismos API routes: cambia el motor
 * de base (PostgreSQL vs. SQLite), no el contrato. Estos tests llaman a cada
 * endpoint con el mismo set de datos simulando los dos runtimes y verifican que
 * la respuesta (status + JSON) sea idéntica y mantenga los campos documentados.
 */

const runtime = vi.hoisted(() => ({ current: "web" as "web" | "electron" }))

const mockPrisma = vi.hoisted(() => ({
  sale: { findMany: vi.fn(), count: vi.fn() },
  saleItem: { findMany: vi.fn() },
  product: { findMany: vi.fn(), count: vi.fn() },
  purchase: { findMany: vi.fn(), count: vi.fn() },
  cashRecord: { findMany: vi.fn(), count: vi.fn() },
  expense: { findMany: vi.fn() },
  client: { findMany: vi.fn(), count: vi.fn() },
}))

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))
vi.mock("@/lib/auth/tokens", () => ({ verifyAccessToken: vi.fn() }))
vi.mock("@/lib/runtime-env", () => ({
  getAppRuntime: () => runtime.current,
  isElectronRuntime: () => runtime.current === "electron",
  resolveSqliteDatabaseUrl: () => "file::memory:",
}))

import * as tokens from "@/lib/auth/tokens"
import { GET as getDashboardStats } from "@/app/api/dashboard/stats/route"
import { GET as getDashboardCharts } from "@/app/api/dashboard/charts/route"
import { GET as getPurchases } from "@/app/api/purchases/route"
import { GET as getCashRecords } from "@/app/api/cash-records/route"
import { GET as getReport } from "@/app/api/reports/[type]/route"
import { GET as getComparison } from "@/app/api/reports/comparison/route"

const REPORTS_PARAMS = { params: Promise.resolve({ type: "sales" }) }

let requestCount = 0

function authedReq(url: string) {
  requestCount += 1
  return new NextRequest(new URL(`http://localhost:3000${url}`), {
    headers: { cookie: "access_token=valid", "x-forwarded-for": `10.1.0.${requestCount}` },
  })
}

function tokenWith(permissions: string[]) {
  return { sub: "user-1", role: "Administrador", permissions }
}

function iso(date: string) {
  return new Date(date)
}

function saleRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "s1",
    date: iso("2026-11-05T10:00:00.000Z"),
    clientId: "c1",
    client: { name: "Cliente Uno", nit: "123" },
    sellerUserId: "u1",
    seller: { firstName: "Ana", lastName: "Perez" },
    subtotal: 100,
    tax: 13,
    discount: 0,
    total: 113,
    paymentMethod: "efectivo",
    status: "completada",
    createdAt: iso("2026-11-05T10:00:00.000Z"),
    isDeleted: false,
    items: [
      {
        productId: "p1",
        quantity: 2,
        price: 50,
        subtotal: 100,
        product: { code: "FILT-1", name: "Filtro", purchasePrice: 30 },
      },
    ],
    ...overrides,
  }
}

function purchaseRow() {
  return {
    id: "pu1",
    date: iso("2026-11-06T10:00:00.000Z"),
    supplierId: "sup1",
    supplier: { name: "Proveedor SA", company: "Proveedor SA" },
    buyerUserId: "u1",
    buyer: { firstName: "Ana", lastName: "Perez" },
    items: [
      {
        productId: "p1",
        quantity: 3,
        price: 20,
        product: { code: "FILT-1", name: "Filtro" },
      },
    ],
    subtotal: 60,
    tax: 6,
    total: 66,
    status: "recibida",
    paymentMethod: "efectivo",
    credit: null,
    createdAt: iso("2026-11-06T10:00:00.000Z"),
    isDeleted: false,
  }
}

function cashRecordRow() {
  return {
    id: "cash1",
    date: iso("2026-11-07T08:00:00.000Z"),
    openingBalance: 500,
    cashIncome: 120,
    cashExpenses: 20,
    closingBalance: 600,
    notes: null,
    userId: "u1",
    user: { firstName: "Ana", lastName: "Perez" },
    status: "closed",
    closedAt: iso("2026-11-07T20:00:00.000Z"),
    withdrawals: [
      {
        id: "w1",
        amount: 50,
        reason: "Cambio",
        createdAt: iso("2026-11-07T12:00:00.000Z"),
        userId: "u1",
        user: { firstName: "Ana", lastName: "Perez" },
      },
    ],
  }
}

function productRow() {
  return {
    id: "p1",
    code: "FILT-1",
    name: "Filtro",
    categoryId: "cat1",
    category: { id: "cat1", name: "Filtros", color: "#f00" },
    supplierId: "sup1",
    supplier: { id: "sup1", name: "Proveedor SA" },
    purchasePrice: 30,
    salePrice: 50,
    stock: 1,
    minimumStock: 5,
    unit: "unidad",
    createdAt: iso("2026-10-01T10:00:00.000Z"),
    isDeleted: false,
  }
}

type RouteHandler = (request: NextRequest, context?: never) => Promise<Response>

/** Normaliza handlers con params dinámicos (`/api/reports/[type]`) al tipo común. */
function asHandler(handler: unknown): RouteHandler {
  return handler as RouteHandler
}

/** Ejecuta el handler en los dos runtimes y devuelve ambos resultados. */
async function captureAcrossRuntimes(
  handler: RouteHandler,
  url: string,
  context?: { params: Promise<{ type: string }> },
) {
  runtime.current = "web"
  const web = await handler(authedReq(url), context as never)

  runtime.current = "electron"
  const desktop = await handler(authedReq(url), context as never)

  return {
    web: { status: web.status, body: await web.json() },
    desktop: { status: desktop.status, body: await desktop.json() },
  }
}

function seedSalesData() {
  mockPrisma.sale.findMany.mockImplementation(
    async (args: { include?: unknown; select?: unknown }) => {
      if (args?.select) return [{ date: iso("2026-11-04T10:00:00.000Z"), total: 90 }]
      if (args?.include) return [saleRow()]
      return [saleRow()]
    },
  )
  mockPrisma.sale.count.mockResolvedValue(1)
}

function seedPurchasesData() {
  mockPrisma.purchase.findMany.mockResolvedValue([purchaseRow()])
  mockPrisma.purchase.count.mockResolvedValue(1)
}

function seedCashData() {
  mockPrisma.cashRecord.findMany.mockResolvedValue([cashRecordRow()])
  mockPrisma.cashRecord.count.mockResolvedValue(1)
}

beforeEach(() => {
  vi.clearAllMocks()
  runtime.current = "web"
  vi.mocked(tokens.verifyAccessToken).mockResolvedValue(tokenWith(["*"]) as never)
})

describe("contrato dashboard: web y escritorio", () => {
  beforeEach(() => {
    mockPrisma.product.count.mockResolvedValue(1)
    mockPrisma.product.findMany.mockResolvedValue([productRow()])
    seedSalesData()
  })

  it("/api/dashboard/stats devuelve el mismo payload en ambos runtimes", async () => {
    const { web, desktop } = await captureAcrossRuntimes(
      getDashboardStats,
      "/api/dashboard/stats?period=30days",
    )

    expect(web.status).toBe(200)
    expect(web.body).toEqual(desktop.body)
    expect(Object.keys(web.body).sort()).toEqual(
      [
        "lowStockCount",
        "lowStockProducts",
        "periodSalesCount",
        "periodSalesTotal",
        "recentSales",
        "totalProducts",
      ].sort(),
    )
    expect(web.body.periodSalesTotal).toBe(90)
    expect(web.body.lowStockCount).toBe(1)
    expect(web.body.recentSales[0]).toMatchObject({
      id: "s1",
      clientName: "Cliente Uno",
      sellerName: "Ana Perez",
      total: 113,
    })
    expect(web.body.lowStockProducts[0]).toMatchObject({
      category: "Filtros",
      supplierName: "Proveedor SA",
      stock: 1,
    })
  })

  it("/api/dashboard/charts devuelve el mismo payload en ambos runtimes", async () => {
    mockPrisma.sale.findMany.mockResolvedValue([saleRow({ paymentMethod: "efectivo" })])
    mockPrisma.saleItem.findMany.mockResolvedValue([
      {
        productId: "p1",
        quantity: 2,
        subtotal: 100,
        price: 50,
        sale: { date: iso("2026-11-05T10:00:00.000Z") },
      },
    ])

    const { web, desktop } = await captureAcrossRuntimes(
      getDashboardCharts,
      "/api/dashboard/charts?period=7days",
    )

    expect(web.status).toBe(200)
    expect(web.body).toEqual(desktop.body)
    expect(Object.keys(web.body).sort()).toEqual(
      ["paymentMethods", "profitByDay", "salesByCategory", "salesByDay", "topProducts"].sort(),
    )
    expect(web.body.topProducts[0]).toMatchObject({ name: "Filtro", quantity: 2, total: 100 })
    expect(web.body.salesByCategory[0]).toEqual({ category: "Filtros", total: 100 })
    expect(web.body.paymentMethods[0]).toEqual({ method: "efectivo", count: 1 })
  })
})

describe("contrato compras: web y escritorio", () => {
  beforeEach(seedPurchasesData)

  it("/api/purchases devuelve el mismo payload en ambos runtimes", async () => {
    const { web, desktop } = await captureAcrossRuntimes(getPurchases, "/api/purchases")

    expect(web.status).toBe(200)
    expect(web.body).toEqual(desktop.body)
    expect(web.body.pagination).toEqual({ page: 1, limit: 50, total: 1, totalPages: 1 })
    expect(web.body.data[0]).toMatchObject({
      id: "pu1",
      purchaseType: "contado",
      supplierName: "Proveedor SA",
      buyerName: "Ana Perez",
      total: 66,
      initialPayment: 66,
      initialDebt: 0,
      debtAmount: 0,
      status: "recibida",
    })
  })
})

describe("contrato caja: web y escritorio", () => {
  beforeEach(seedCashData)

  it("/api/cash-records devuelve el mismo payload en ambos runtimes", async () => {
    const { web, desktop } = await captureAcrossRuntimes(getCashRecords, "/api/cash-records")

    expect(web.status).toBe(200)
    expect(web.body).toEqual(desktop.body)
    expect(web.body.pagination).toEqual({ page: 1, limit: 50, total: 1, totalPages: 1 })
    expect(web.body.data[0]).toMatchObject({
      id: "cash1",
      userName: "Ana Perez",
      status: "closed",
      openingBalance: 500,
      closingBalance: 600,
    })
    expect(web.body.data[0].withdrawals[0]).toMatchObject({
      id: "w1",
      amount: 50,
      userName: "Ana Perez",
    })
  })
})

describe("contrato reportes: web y escritorio", () => {
  it("/api/reports/sales devuelve el mismo payload en ambos runtimes", async () => {
    mockPrisma.sale.findMany.mockImplementation(async (args: { include?: unknown }) =>
      args?.include ? [saleRow()] : [{ date: iso("2026-11-04T10:00:00.000Z"), total: 90 }],
    )
    mockPrisma.sale.count.mockResolvedValue(1)

    const { web, desktop } = await captureAcrossRuntimes(
      asHandler(getReport),
      "/api/reports/sales?startDate=2026-11-01&endDate=2026-11-10",
      REPORTS_PARAMS,
    )

    expect(web.status).toBe(200)
    expect(web.body).toEqual(desktop.body)
    expect(web.body.report).toBe("sales")
    expect(web.body.period).toEqual({ startDate: "2026-11-01", endDate: "2026-11-10" })
    expect(web.body.pagination).toMatchObject({ page: 1, total: 1 })
    expect(web.body.data[0]).toMatchObject({
      id: "s1",
      clientName: "Cliente Uno",
      sellerName: "Ana Perez",
      total: 113,
      items: [{ productCode: "FILT-1", quantity: 2, unitPrice: 50 }],
    })
    expect(web.body.stats).toMatchObject({ average: 113 })
  })

  it("/api/reports/comparison devuelve el mismo payload en ambos runtimes", async () => {
    mockPrisma.sale.findMany.mockResolvedValue([{ total: 1000 }])
    seedPurchasesData()
    mockPrisma.expense.findMany.mockResolvedValue([{ amount: 200 }])

    const { web, desktop } = await captureAcrossRuntimes(
      getComparison,
      "/api/reports/comparison?startDate=2026-11-01&endDate=2026-11-10",
    )

    expect(web.status).toBe(200)
    expect(web.body).toEqual(desktop.body)
    expect(web.body).toMatchObject({
      totalSales: 1000,
      totalPurchases: 66,
      totalExpenses: 200,
      netProfit: 734,
    })
    expect(web.body.period).toEqual({ startDate: "2026-10-22", endDate: "2026-10-31" })
  })
})

describe("contrato de errores: mismo status en web y escritorio", () => {
  it("401 sin sesión en los cuatro módulos", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(null)

    const endpoints: Array<[RouteHandler, string]> = [
      [asHandler(getDashboardStats), "/api/dashboard/stats"],
      [asHandler(getDashboardCharts), "/api/dashboard/charts"],
      [asHandler(getPurchases), "/api/purchases"],
      [asHandler(getCashRecords), "/api/cash-records"],
    ]

    for (const [handler, url] of endpoints) {
      const { web, desktop } = await captureAcrossRuntimes(handler, url)
      expect(web.status).toBe(401)
      expect(web).toEqual(desktop)
    }
  })

  it("403 sin permisos en los cuatro módulos", async () => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(tokenWith(["dashboard"]) as never)

    const { web, desktop } = await captureAcrossRuntimes(getPurchases, "/api/purchases")
    expect(web.status).toBe(403)
    expect(web).toEqual(desktop)

    const cash = await captureAcrossRuntimes(getCashRecords, "/api/cash-records")
    expect(cash.web.status).toBe(403)
    expect(cash.web).toEqual(cash.desktop)

    const report = await captureAcrossRuntimes(
      asHandler(getReport),
      "/api/reports/sales",
      REPORTS_PARAMS,
    )
    expect(report.web.status).toBe(403)
    expect(report.web).toEqual(report.desktop)
  })
})
