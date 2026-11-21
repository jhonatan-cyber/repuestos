import { describe, expect, it, vi } from "vitest"
import { loadList, unwrapList } from "@/lib/api-list"

describe("unwrapList", () => {
  const clients = [{ id: "client-1", name: "Cliente" }]

  it.each([
    ["legacy", clients],
    ["paginated", { data: clients, pagination: { page: 1, total: 1, totalPages: 1 } }],
  ])("supports client lookup with %s responses", (_, payload) => {
    const result = unwrapList<(typeof clients)[number]>(payload)
    expect(result.find((client) => client.id === "client-1")).toEqual(clients[0])
    expect(result.map((client) => client.name)).toEqual(["Cliente"])
  })

  it.each([null, undefined, {}, { data: null }, { data: {} }, { error: "Sin permisos" }])(
    "returns an empty list for invalid responses: %j",
    (payload) => expect(unwrapList(payload)).toEqual([]),
  )
})

describe("loadList", () => {
  it("loads all pages while preserving date filters and server limits", async () => {
    const loader = vi
      .fn()
      .mockResolvedValueOnce({ data: [{ total: 10 }], pagination: { page: 1, totalPages: 3 } })
      .mockResolvedValueOnce({ data: [{ total: 20 }], pagination: { page: 2, totalPages: 3 } })
      .mockResolvedValueOnce({ data: [{ total: 30 }], pagination: { page: 3, totalPages: 3 } })
    const rows = await loadList<{ total: number }>(
      "/api/sales?startDate=2026-10-01&limit=100",
      loader,
    )
    expect(rows.reduce((sum, row) => sum + row.total, 0)).toBe(60)
    expect(loader.mock.calls.map(([url]) => url)).toEqual([
      "/api/sales?startDate=2026-10-01&limit=100",
      "/api/sales?startDate=2026-10-01&limit=100&page=2",
      "/api/sales?startDate=2026-10-01&limit=100&page=3",
    ])
  })

  it("supports Electron list responses without extra requests", async () => {
    const loader = vi.fn().mockResolvedValue([{ id: "1" }])
    expect(await loadList("/api/clients", loader)).toEqual([{ id: "1" }])
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it("does not return partial report totals when a later page fails", async () => {
    const loader = vi
      .fn()
      .mockResolvedValueOnce({ data: [{ total: 10 }], pagination: { page: 1, totalPages: 2 } })
      .mockRejectedValueOnce(new Error("Network error"))
    await expect(loadList("/api/sales", loader)).rejects.toThrow("Network error")
  })

  it("rejects a server that repeats the same page", async () => {
    const loader = vi.fn().mockResolvedValue({ data: [], pagination: { page: 1, totalPages: 3 } })
    await expect(loadList("/api/clients", loader)).rejects.toThrow("paginación")
    expect(loader).toHaveBeenCalledTimes(2)
  })

  it("stops for an empty paginated list", async () => {
    const loader = vi.fn().mockResolvedValue({ data: [], pagination: { page: 1, totalPages: 0 } })
    expect(await loadList("/api/clients", loader)).toEqual([])
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it("rejects HTTP errors instead of showing an empty list", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("Forbidden", { status: 403 }))
    try {
      await expect(loadList("/api/clients")).rejects.toThrow("403")
    } finally {
      fetchMock.mockRestore()
    }
  })
})
