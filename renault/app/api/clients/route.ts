import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { ClientSchema } from "@/lib/validations"
import { transformClientToAPI } from "@/lib/client-utils"
import {
  createErrorResponse,
  createSuccessResponse,
  handleApiError,
  getPaginationParams,
  buildPaginatedResponse,
} from "@/lib/api-utils"
import type { Prisma } from "@prisma/client"
import { CLIENT_MESSAGES } from "@/lib/constants/messages"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"
export async function GET(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)
    if (!hasAnyPermission(actor, ["clients.read", "clients.list", "clients.all", "clients"])) {
      return createErrorResponse("Sin permisos para ver clientes", 403)
    }
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const { page, limit, skip } = getPaginationParams(searchParams)

    const where: Prisma.ClientWhereInput = { isDeleted: false }

    if (search) {
      const searchFilter = { contains: search, mode: "insensitive" as const }
      where.OR = [{ name: searchFilter }, { phone: searchFilter }]
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
      prisma.client.count({ where }),
    ])

    const transformed = clients.map(transformClientToAPI)

    return createSuccessResponse(buildPaginatedResponse(transformed, total, page, limit))
  } catch (error) {
    return handleApiError(error, CLIENT_MESSAGES.error.fetch)
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)
    if (!hasAnyPermission(actor, ["clients.create", "clients.all", "clients"])) {
      return createErrorResponse("Sin permisos para crear clientes", 403)
    }
    const body = await request.json()
    const validated = ClientSchema.parse(body)

    const client = await prisma.client.create({
      data: {
        name: validated.name,
        phone: validated.phone,
        address: validated.address || null,
        status: "active",
        totalPurchases: 0,
      },
    })

    return createSuccessResponse(transformClientToAPI(client), 201)
  } catch (error) {
    return handleApiError(error, CLIENT_MESSAGES.error.create)
  }
}
