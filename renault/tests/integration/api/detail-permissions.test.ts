import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

/**
 * Matriz de rutas de detalle: toda ruta `/{recurso}/{id}` tiene que exigir sesión
 * (401), permiso específico (403) y dejar pasar al portador del permiso.
 * El objetivo es la autorización, no la lógica de cada entidad: con permiso, el
 * prisma simulado devuelve null y la ruta responde 404.
 */

const mockPrisma = vi.hoisted(() => {
  const model = () =>
    new Proxy(
      {},
      {
        get: () => vi.fn().mockResolvedValue(null),
      },
    )

  const prisma: any = new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (prop === "$transaction")
          return vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback(prisma))
        if (prop === "$queryRawUnsafe" || prop === "$executeRawUnsafe")
          return vi.fn().mockResolvedValue([])
        return model()
      },
    },
  )

  return prisma
})

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))
vi.mock("@/lib/auth/tokens", () => ({ verifyAccessToken: vi.fn() }))

import * as tokens from "@/lib/auth/tokens"

import {
  PUT as putProduct,
  PATCH as patchProduct,
  DELETE as deleteProduct,
} from "@/app/api/products/[id]/route"
import { GET as getClient, DELETE as deleteClient } from "@/app/api/clients/[id]/route"
import { GET as getSupplier, DELETE as deleteSupplier } from "@/app/api/suppliers/[id]/route"
import { PATCH as patchCategory, DELETE as deleteCategory } from "@/app/api/categories/[id]/route"
import { GET as getExpense, DELETE as deleteExpense } from "@/app/api/expenses/[id]/route"
import { GET as getCashRecord } from "@/app/api/cash-records/[id]/route"
import { GET as getSale, PATCH as patchSale } from "@/app/api/sales/[id]/route"
import { PATCH as patchQuotation, DELETE as deleteQuotation } from "@/app/api/quotations/[id]/route"
import { GET as getUser, DELETE as deleteUser } from "@/app/api/users/[id]/route"
import { PUT as putRole, DELETE as deleteRole } from "@/app/api/roles/[id]/route"

interface DetailRoute {
  name: string
  perm: string
  handler: any
  method: string
  url: string
  body?: string
}

const routes: DetailRoute[] = [
  {
    name: "producto PUT",
    perm: "products.update",
    handler: putProduct,
    method: "PUT",
    url: "/api/products/p1",
    body: "{}",
  },
  {
    name: "producto PATCH",
    perm: "products.update",
    handler: patchProduct,
    method: "PATCH",
    url: "/api/products/p1",
    body: "{}",
  },
  {
    name: "producto DELETE",
    perm: "products.delete",
    handler: deleteProduct,
    method: "DELETE",
    url: "/api/products/p1",
  },
  {
    name: "cliente GET",
    perm: "clients.read",
    handler: getClient,
    method: "GET",
    url: "/api/clients/c1",
  },
  {
    name: "cliente DELETE",
    perm: "clients.delete",
    handler: deleteClient,
    method: "DELETE",
    url: "/api/clients/c1",
  },
  {
    name: "proveedor GET",
    perm: "suppliers.read",
    handler: getSupplier,
    method: "GET",
    url: "/api/suppliers/s1",
  },
  {
    name: "proveedor DELETE",
    perm: "suppliers.delete",
    handler: deleteSupplier,
    method: "DELETE",
    url: "/api/suppliers/s1",
  },
  {
    name: "categoría PATCH",
    perm: "categories.update",
    handler: patchCategory,
    method: "PATCH",
    url: "/api/categories/cat1",
    body: "{}",
  },
  {
    name: "categoría DELETE",
    perm: "categories.delete",
    handler: deleteCategory,
    method: "DELETE",
    url: "/api/categories/cat1",
  },
  {
    name: "gasto GET",
    perm: "expenses.read",
    handler: getExpense,
    method: "GET",
    url: "/api/expenses/e1",
  },
  {
    name: "gasto DELETE",
    perm: "expenses.delete",
    handler: deleteExpense,
    method: "DELETE",
    url: "/api/expenses/e1",
  },
  {
    name: "caja GET",
    perm: "cash.read",
    handler: getCashRecord,
    method: "GET",
    url: "/api/cash-records/cr1",
  },
  {
    name: "venta GET",
    perm: "sales.read",
    handler: getSale,
    method: "GET",
    url: "/api/sales/sale1",
  },
  {
    name: "venta PATCH",
    perm: "sales.update",
    handler: patchSale,
    method: "PATCH",
    url: "/api/sales/sale1",
    body: "{}",
  },
  {
    name: "cotización PATCH",
    perm: "quotations.update",
    handler: patchQuotation,
    method: "PATCH",
    url: "/api/quotations/q1",
    body: "{}",
  },
  {
    name: "cotización DELETE",
    perm: "quotations.delete",
    handler: deleteQuotation,
    method: "DELETE",
    url: "/api/quotations/q1",
  },
  {
    name: "usuario GET",
    perm: "users.read",
    handler: getUser,
    method: "GET",
    url: "/api/users/u1",
  },
  {
    name: "usuario DELETE",
    perm: "users.delete",
    handler: deleteUser,
    method: "DELETE",
    url: "/api/users/u1",
  },
  {
    name: "rol PUT",
    perm: "roles.update",
    handler: putRole,
    method: "PUT",
    url: "/api/roles/r1",
    body: "{}",
  },
  {
    name: "rol DELETE",
    perm: "roles.delete",
    handler: deleteRole,
    method: "DELETE",
    url: "/api/roles/r1",
  },
]

function request(route: DetailRoute, withCookie: boolean) {
  const headers: Record<string, string> = {}
  if (withCookie) headers.cookie = "access_token=valid"
  if (route.body) headers["content-type"] = "application/json"
  return new NextRequest(new URL(`http://localhost:3000${route.url}`), {
    method: route.method,
    headers,
    body: route.body,
  } as never)
}

function call(route: DetailRoute, withCookie: boolean) {
  return route.handler(request(route, withCookie), {
    params: Promise.resolve({ id: route.url.split("/").pop() }),
  })
}

describe("Rutas de detalle — autenticación", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue(null)
  })

  it.each(routes)("$name exige sesión (401)", async (route) => {
    const res = await call(route, false)
    expect(res.status).toBe(401)
  })
})

describe("Rutas de detalle — autorización", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue({
      sub: "user-1",
      role: "Vendedor",
      permissions: ["dashboard"],
    } as never)
  })

  it.each(routes)("$name rechaza sin el permiso $perm (403)", async (route) => {
    const res = await call(route, true)
    expect(res.status).toBe(403)
  })
})

describe("Rutas de detalle — con permiso", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each(routes)("$name deja pasar con $perm", async (route) => {
    vi.mocked(tokens.verifyAccessToken).mockResolvedValue({
      sub: "user-1",
      role: "Administrador",
      permissions: [route.perm],
    } as never)

    const res = await call(route, true)
    expect([401, 403]).not.toContain(res.status)
  })
})
