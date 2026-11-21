"use client"

import { offlineStorage } from "./offline-storage"
import { tryRefreshToken } from "./auth-refresh"

interface FetchOptions extends RequestInit {
  useCache?: boolean
  cacheTime?: number
}

export class ApiError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.details = details
  }
}

export class OfflineCacheMissError extends Error {
  constructor(message = "No hay conexión y no hay datos en cache") {
    super(message)
    this.name = "OfflineCacheMissError"
  }
}

const FAKE_SUCCESS_RESPONSE = {
  success: true,
  offline: true,
  message: "Operación guardada para sincronizar cuando estés online",
}

/**
 * El renderer de escritorio habla con un server local (127.0.0.1), no con
 * internet: `navigator.onLine` no aplica. Si se dejara aplicar, una PC sin
 * internet encolaría mutaciones "offline" que nunca llegan a la base local.
 */
function isDesktopRenderer(): boolean {
  return typeof window !== "undefined" && !!window.electron
}

/**
 * Attempts to refresh the access token via /api/auth/refresh.
 * Returns true if the refresh succeeded (new cookies were set), false otherwise.
 * Uses a module-level flag to prevent concurrent refresh storms.
 * Exported for use in places that call fetch() directly instead of apiClient().
 *
 * La implementación vive en lib/auth-refresh.ts (compartida con el cliente IPC).
 */
export { tryRefreshToken }

/**
 * Parses a Response's error body into an ApiError.
 * Consumes the response body — do not call response.json() after this.
 */
async function parseErrorResponse(response: Response): Promise<ApiError> {
  let errorMessage = `HTTP error! status: ${response.status}`
  let errorBody: unknown = null
  try {
    errorBody = (await response.json()) as { error?: string; message?: string }
    if (errorBody && typeof errorBody === "object" && "error" in errorBody) {
      errorMessage = (errorBody as { error: string }).error
    } else if (errorBody && typeof errorBody === "object" && "message" in errorBody) {
      errorMessage = (errorBody as { message: string }).message
    }
  } catch {
    // Keep generic message when response is not JSON.
  }
  return new ApiError(errorMessage, response.status, errorBody)
}

/**
 * Único cliente de datos: HTTP API de Next (mismo backend en web y escritorio).
 */
export async function apiClient<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const { useCache = true, cacheTime = 3600000, ...fetchOptions } = options
  const isOnline = isDesktopRenderer()
    ? true
    : typeof navigator === "undefined"
      ? true
      : navigator.onLine !== false
  const method = fetchOptions.method?.toUpperCase() || "GET"

  if (method === "GET" && !isOnline && useCache) {
    const cached = await offlineStorage.get<T>("api", url)
    if (cached) {
      return cached
    }
    throw new OfflineCacheMissError()
  }

  if (
    (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE") &&
    !isOnline
  ) {
    try {
      const payload = fetchOptions.body
        ? typeof fetchOptions.body === "string"
          ? JSON.parse(fetchOptions.body)
          : fetchOptions.body
        : null

      await offlineStorage.addPendingMutation({
        operation: method as "POST" | "PUT" | "PATCH" | "DELETE",
        endpoint: url,
        payload,
        timestamp: Date.now(),
      })

      return FAKE_SUCCESS_RESPONSE as T
    } catch (error) {
      throw new Error("No se pudo guardar la operación para sincronizar offline")
    }
  }

  // Ensure credentials are always included so httpOnly cookies travel with the request
  const requestOptions: RequestInit = { ...fetchOptions, credentials: "include" }

  try {
    const response = await fetch(url, requestOptions)

    // On 401: attempt a token refresh once, then retry the original request
    if (response.status === 401) {
      const refreshed = await tryRefreshToken()
      if (refreshed) {
        const retryResponse = await fetch(url, requestOptions)
        if (!retryResponse.ok) {
          throw await parseErrorResponse(retryResponse)
        }
        const retryData = await retryResponse.json()
        if (useCache && method === "GET") {
          await offlineStorage.set("api", url, retryData, cacheTime)
        }
        return retryData as T
      }
      // Refresh failed — surface the original 401
      throw await parseErrorResponse(response)
    }

    if (!response.ok) {
      throw await parseErrorResponse(response)
    }

    const data = await response.json()

    if (useCache && method === "GET") {
      await offlineStorage.set("api", url, data, cacheTime)
    }

    return data
  } catch (error) {
    if (method === "GET" && useCache) {
      const cached = await offlineStorage.get<T>("api", url)
      if (cached) {
        return cached
      }
    }

    throw error
  }
}
