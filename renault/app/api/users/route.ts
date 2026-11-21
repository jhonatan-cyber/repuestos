import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { UserSchema } from "@/lib/validations"
import { transformUserToAPI } from "@/lib/user-utils"
import {
  createErrorResponse,
  createSuccessResponse,
  handleApiError,
  getPaginationParams,
  buildPaginatedResponse,
} from "@/lib/api-utils"
import type { Prisma } from "@prisma/client"
import { USER_MESSAGES } from "@/lib/constants/messages"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"
import bcrypt from "bcryptjs"
export async function GET(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)
    if (!hasAnyPermission(actor, ["users.read", "users.list", "users.all", "users"])) {
      return createErrorResponse("Sin permisos para ver usuarios", 403)
    }
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const { page, limit, skip } = getPaginationParams(searchParams)

    const where: Prisma.UserWhereInput = { isDeleted: false }

    if (search) {
      const searchFilter = { contains: search, mode: "insensitive" as const }
      where.OR = [
        { firstName: searchFilter },
        { lastName: searchFilter },
        { email: searchFilter },
        { ci: searchFilter },
        { role: searchFilter },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          ci: true,
          firstName: true,
          lastName: true,
          address: true,
          phone: true,
          email: true,
          role: true,
          status: true,
          image: true,
          createdAt: true,
          // No incluir password por seguridad
        },
      }),
      prisma.user.count({ where }),
    ])

    const transformed = users.map((user) =>
      transformUserToAPI(user as Parameters<typeof transformUserToAPI>[0]),
    )

    return createSuccessResponse(buildPaginatedResponse(transformed, total, page, limit))
  } catch (error) {
    return handleApiError(error, USER_MESSAGES.error.fetch)
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)
    if (!hasAnyPermission(actor, ["users.create", "users.all", "users"])) {
      return createErrorResponse("Sin permisos para crear usuarios", 403)
    }
    const body = await request.json()
    const validated = UserSchema.parse(body)

    if (!validated.password) {
      return createErrorResponse("La contraseña es requerida", 400)
    }

    // Verificar si el CI ya existe
    const existingCI = await prisma.user.findUnique({
      where: { ci: validated.ci },
    })

    if (existingCI) {
      return createErrorResponse(USER_MESSAGES.error.ciExists, 400)
    }

    // Verificar si el email ya existe
    const existingEmail = await prisma.user.findUnique({
      where: { email: validated.email },
    })

    if (existingEmail) {
      return createErrorResponse(USER_MESSAGES.error.emailExists, 400)
    }

    // Hash de la contraseña (requerida, sin defaults predecibles)
    const hashedPassword = await bcrypt.hash(validated.password, 12)

    const user = await prisma.user.create({
      data: {
        ci: validated.ci,
        firstName: validated.firstName,
        lastName: validated.lastName,
        address: validated.address,
        phone: validated.phone,
        email: validated.email,
        password: hashedPassword,
        role: validated.role,
        status: validated.status || "active",
      },
      select: {
        id: true,
        ci: true,
        firstName: true,
        lastName: true,
        address: true,
        phone: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    })

    return createSuccessResponse(
      transformUserToAPI(user as Parameters<typeof transformUserToAPI>[0]),
      201,
    )
  } catch (error) {
    return handleApiError(error, USER_MESSAGES.error.create)
  }
}
