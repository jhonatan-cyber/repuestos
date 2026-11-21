import { apiClient } from "./api-client"

/** Unwrap de respuestas list: soporta `[]` legacy y `{ data: [], pagination }` nuevo. */
export function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (payload && typeof payload === "object") {
    const data = (payload as { data?: unknown }).data
    if (Array.isArray(data)) return data as T[]
  }
  return []
}

async function fetchListPage(url: string): Promise<unknown> {
  return apiClient(url)
}

/** Load every server page for screens that filter, total and paginate locally. */
export async function loadList<T>(
  url: string,
  loadPage: (url: string) => Promise<unknown> = fetchListPage,
): Promise<T[]> {
  const results: T[] = []
  let nextUrl = url
  let requestedPage = 0

  while (true) {
    const payload = await loadPage(nextUrl)
    results.push(...unwrapList<T>(payload))
    if (!payload || typeof payload !== "object" || !("pagination" in payload)) break
    const pagination = payload.pagination as { page?: unknown; totalPages?: unknown } | null
    const page = pagination?.page
    const totalPages = pagination?.totalPages
    if (
      typeof page !== "number" ||
      typeof totalPages !== "number" ||
      !Number.isSafeInteger(page) ||
      !Number.isSafeInteger(totalPages) ||
      page < 1 ||
      page >= totalPages
    )
      break
    if (page <= requestedPage) throw new Error("La paginación de la API no avanzó")
    requestedPage = page
    const [path, query = ""] = url.split("?")
    const params = new URLSearchParams(query)
    params.set("page", String(page + 1))
    nextUrl = `${path}?${params.toString()}`
  }

  return results
}
