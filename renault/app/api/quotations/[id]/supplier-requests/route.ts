import { logger } from "@/lib/logger"
import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"
import { createNotification } from "@/lib/notifications"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getApiActor(request)
    if (!actor) {
      return createErrorResponse("No autenticado", 401)
    }
    if (!hasAnyPermission(actor, ["quotations.update", "quotations.all", "quotations"])) {
      return createErrorResponse("Sin permisos", 403)
    }

    const { id } = await params
    const { supplierIds, notes } = await request.json()

    if (!Array.isArray(supplierIds) || supplierIds.length === 0) {
      return createErrorResponse("Seleccioná al menos un proveedor", 400)
    }

    // Verify quotation exists
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      select: { id: true, status: true },
    })
    if (!quotation) {
      return createErrorResponse("Cotización no encontrada", 404)
    }

    // Verify suppliers exist
    const suppliers = await prisma.supplier.findMany({
      where: { id: { in: supplierIds }, isDeleted: false },
      select: { id: true, name: true },
    })
    if (suppliers.length === 0) {
      return createErrorResponse("Proveedores no encontrados", 404)
    }

    const foundIds = new Set(suppliers.map((s) => s.id))
    const missingIds = supplierIds.filter((sid: string) => !foundIds.has(sid))
    // ponytail: silently skip missing suppliers, they won't match the FK constraint anyway

    const now = new Date()
    const records = suppliers.map((supplier) => ({
      quotationId: id,
      supplierId: supplier.id,
      status: "enviado" as const,
      sentAt: now,
      notes: notes || null,
      updatedAt: now,
    }))

    // Query builder (el modelo existe en ambos clientes generados)
    await prisma.supplierRequest.createMany({ data: records })

    // Notify relevant users
    const supplierNames = suppliers.map((s) => s.name).join(", ")
    createNotification({
      type: "info",
      title: "Solicitud de cotización enviada",
      message: `Se solicitó cotización a: ${supplierNames}`,
      entity: "quotation",
      entityId: id,
      url: `/quotations`,
    }).catch(() => {})

    return createSuccessResponse({
      count: records.length,
      suppliers: suppliers.map((s) => ({ id: s.id, name: s.name })),
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    logger.error("[supplier-requests POST]", {
      msg,
      error: error instanceof Error ? error.message : error,
    })
    return createErrorResponse(`Error al enviar solicitud: ${msg}`, 500)
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getApiActor(request)
    if (!actor) {
      return createErrorResponse("No autenticado", 401)
    }

    const { id } = await params

    const requests = await prisma.supplierRequest.findMany({
      where: { quotationId: id, isDeleted: false },
      include: { supplier: { select: { name: true } } },
      orderBy: { sentAt: "desc" },
    })

    return createSuccessResponse(
      requests.map((r) => ({
        id: r.id,
        quotationId: r.quotationId,
        supplierId: r.supplierId,
        supplierName: r.supplier.name,
        status: r.status,
        sentAt: r.sentAt.toISOString(),
        respondedAt: r.respondedAt?.toISOString() ?? null,
        notes: r.notes,
        response: r.response,
        updatedAt: r.updatedAt.toISOString(),
      })),
    )
  } catch (error) {
    logger.error("[supplier-requests GET]", {
      error: error instanceof Error ? error.message : error,
    })
    return handleApiError(error, "Error al obtener solicitudes")
  }
}
