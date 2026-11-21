/**
 * Refresh del access token.
 *
 * Vive en su propio módulo para que lo usen tanto `lib/api-client.ts` como los
 * hooks que llaman `fetch` directamente y necesitan reintentar tras un 401.
 */

let _refreshInFlight: Promise<boolean> | null = null

/**
 * Attempts to refresh the access token via /api/auth/refresh.
 * Returns true if the refresh succeeded (new cookies were set), false otherwise.
 * Uses a module-level flag to prevent concurrent refresh storms.
 */
export async function tryRefreshToken(): Promise<boolean> {
  if (_refreshInFlight) return _refreshInFlight

  _refreshInFlight = (async () => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      })
      return res.ok
    } catch {
      return false
    } finally {
      _refreshInFlight = null
    }
  })()

  return _refreshInFlight
}
