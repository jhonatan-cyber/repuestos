import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"
import {
  createErrorResponse,
  createSuccessResponse,
  handleApiError,
  getPaginationParams,
  buildPaginatedResponse,
} from "@/lib/api-utils"
import { QuotationSchema } from "@/lib/validations"
import { QUOTATION_MESSAGES } from "@/lib/constants/messages"
import { normalizeQuotationStatus } from "@/lib/quotation-status"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"
import { logAudit } from "@/lib/audit-log"
import { formatDateLocal } from "@/lib/dates"
import { createNotification } from "@/lib/notifications"
import type { Prisma } from "@prisma/client"

type QuotationWithExternalClientName = {
  externalClientName: string | null
}

export async function GET(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) {
      return createErrorResponse("No autenticado", 401)
    }
    if (
      !hasAnyPermission(actor, [
        "quotations.read",
        "quotations.list",
        "quotations.all",
        "quotations",
      ])
    ) {
      return createErrorResponse("Sin permisos para ver cotizaciones", 403)
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const { page, limit, skip } = getPaginationParams(searchParams)

    const where: Prisma.QuotationWhereInput = { isDeleted: false }
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate) where.date.lte = new Date(endDate)
    }

    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        include: {
          client: true,
          seller: true,
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.quotation.count({ where }),
    ])

    const transformed = (
      quotations as Array<(typeof quotations)[number] & QuotationWithExternalClientName>
    ).map((quotation) => ({
      id: quotation.id,
      date: formatDateLocal(quotation.date),
      clientId: quotation.clientId,
      externalClientName: quotation.externalClientName,
      externalClientPhone: quotation.externalClientPhone,
      clientName: quotation.client?.name ?? quotation.externalClientName ?? "Cliente sin registrar",
      sellerUserId: quotation.sellerUserId,
      sellerName: `${quotation.seller.firstName} ${quotation.seller.lastName}`,
      items: quotation.items.map((item) => ({
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
      })),
      subtotal: quotation.subtotal,
      tax: quotation.tax,
      discount: quotation.discount,
      total: quotation.total,
      validUntil: formatDateLocal(quotation.validUntil),
      status: normalizeQuotationStatus(quotation.status),
      convertedToSaleId: quotation.convertedToSaleId,
      createdAt: formatDateLocal(quotation.createdAt),
    }))

    return createSuccessResponse(buildPaginatedResponse(transformed, total, page, limit))
  } catch (error) {
    return handleApiError(error, QUOTATION_MESSAGES.error.fetch)
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) {
      return createErrorResponse("No autenticado", 401)
    }
    if (!hasAnyPermission(actor, ["quotations.create", "quotations.all", "quotations"])) {
      return createErrorResponse("Sin permisos para crear cotizaciones", 403)
    }

    const body = await request.json()
    const parsed = QuotationSchema.safeParse({
      ...body,
      sellerUserId: body.sellerUserId,
      validUntil: body.validUntil,
    })
    if (!parsed.success) {
      return createErrorResponse(
        parsed.error.issues[0]?.message || QUOTATION_MESSAGES.error.invalidData,
        400,
      )
    }
    const {
      date,
      clientId,
      sellerUserId,
      items,
      subtotal,
      tax,
      discount,
      total,
      validUntil,
      status,
    } = parsed.data
    const { customClientName, customClientPhone } = body as {
      customClientName?: unknown
      customClientPhone?: unknown
    }
    const resolvedClientId =
      clientId === null || clientId === undefined || clientId === "" ? null : String(clientId)
    const resolvedExternalClientName = !resolvedClientId
      ? typeof customClientName === "string" && customClientName.trim()
        ? customClientName.trim()
        : "Sin cliente registrado"
      : null
    const resolvedExternalClientPhone = !resolvedClientId
      ? typeof customClientPhone === "string" && customClientPhone.trim()
        ? customClientPhone.trim()
        : null
      : null

    const quotation = await prisma.quotation.create({
      data: {
        date: date ? new Date(date) : new Date(),
        clientId: resolvedClientId,
        ...(resolvedExternalClientName ? { externalClientName: resolvedExternalClientName } : {}),
        ...(resolvedExternalClientPhone
          ? { externalClientPhone: resolvedExternalClientPhone }
          : {}),
        sellerUserId: String(sellerUserId),
        subtotal: Number(subtotal),
        tax: Number(tax) || 0,
        discount: Number(discount) || 0,
        total: Number(total),
        validUntil: new Date(validUntil),
        status: normalizeQuotationStatus(status),
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
          })),
        },
      },
      include: {
        client: true,
        seller: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    logAudit({
      action: "CREATE",
      entity: "quotation",
      entityId: quotation.id,
      userId: actor.userId,
      changes: {
        subtotal: quotation.subtotal,
        tax: quotation.tax,
        discount: quotation.discount,
        total: quotation.total,
        status: quotation.status,
      },
      metadata: {
        itemCount: quotation.items.length,
        hasClient: Boolean(quotation.clientId),
      },
    }).catch(() => {})

    const diffMs = quotation.validUntil.getTime() - Date.now()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    createNotification({
      type: diffDays <= 3 ? "warning" : "info",
      title: "Cotización creada",
      message: `Cotización por Bs ${quotation.total.toFixed(2)}${diffDays <= 3 ? ` vence en ${Math.max(diffDays, 0)} día(s)` : ""}.`,
      entity: "quotation",
      entityId: quotation.id,
      url: "/quotations",
      metadata: { validUntil: quotation.validUntil.toISOString() },
    }).catch(() => {})

    return createSuccessResponse(quotation, 201)
  } catch (error) {
    return handleApiError(error, QUOTATION_MESSAGES.error.create)
  }
}
