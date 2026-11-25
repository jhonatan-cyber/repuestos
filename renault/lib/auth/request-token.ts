import type { NextRequest } from "next/server"

export function getAccessTokenFromRequest(request: Pick<NextRequest, "cookies" | "headers">) {
  const authorization = request.headers?.get?.("authorization")
  const bearerToken = authorization?.match(/^Bearer\s+(\S+)$/i)?.[1]

  return bearerToken ?? request.cookies.get("access_token")?.value
}