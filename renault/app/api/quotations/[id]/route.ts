import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { QUOTATION_MESSAGES } from "@/lib/constants/messages"
import { normalizeQuotationStatus } from "@/lib/quotation-status"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"
import { logAudit } from "@/lib/audit-log"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getApiActor(request)
    if (!actor) {
      return createErrorResponse("No autenticado", 401)
    }
    if (!hasAnyPermission(actor, ["quotations.update", "quotations.all", "quotations"])) {
      return createErrorResponse("Sin permisos para editar cotizaciones", 403)
    }

    const { id } = await params
    const body = await request.json()
    const {
      date,
      clientId,
      customClientName,
      customClientPhone,
      sellerUserId,
      items,
      subtotal,
      tax,
      discount,
      total,
      validUntil,
      status,
    } = body
    const resolvedClientId = clientId || null
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

    const quotation = await prisma.quotation.update({
      where: { id },
      data: {
        date: date ? new Date(date) : undefined,
        clientId: clientId !== undefined ? resolvedClientId : undefined,
        ...(clientId !== undefined ||
        customClientName !== undefined ||
        customClientPhone !== undefined
          ? resolvedExternalClientName
            ? {
                externalClientName: resolvedExternalClientName,
                externalClientPhone: resolvedExternalClientPhone,
              }
            : {}
          : {}),
        sellerUserId: sellerUserId,
        subtotal: subtotal !== undefined ? parseFloat(subtotal) : undefined,
        tax: tax !== undefined ? parseFloat(tax) : undefined,
        discount: discount !== undefined ? parseFloat(discount) : undefined,
        total: total !== undefined ? parseFloat(total) : undefined,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        status: status !== undefined ? normalizeQuotationStatus(status) : undefined,
        items: items
          ? {
              deleteMany: {},
              create: items.map(
                (item: {
                  productId: string
                  quantity: number
                  price: number
                  subtotal: number
                }) => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  price: item.price,
                  subtotal: item.subtotal,
                }),
              ),
            }
          : undefined,
      },
    })

    logAudit({
      action: "UPDATE",
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
        itemsReplaced: Boolean(items),
      },
    }).catch(() => {})

    return createSuccessResponse(quotation)
  } catch (error) {
    return handleApiError(error, QUOTATION_MESSAGES.error.update)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await getApiActor(request)
    if (!actor) {
      return createErrorResponse("No autenticado", 401)
    }
    if (!hasAnyPermission(actor, ["quotations.delete", "quotations.all", "quotations"])) {
      return createErrorResponse("Sin permisos para eliminar cotizaciones", 403)
    }

    const { id } = await params
    await prisma.quotation.delete({
      where: { id },
    })
    logAudit({
      action: "DELETE",
      entity: "quotation",
      entityId: id,
      userId: actor.userId,
      metadata: { deletedAt: new Date().toISOString() },
    }).catch(() => {})
    return createSuccessResponse({ message: "Quotation deleted successfully" })
  } catch (error) {
    return handleApiError(error, QUOTATION_MESSAGES.error.delete)
  }
}
