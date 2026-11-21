import { requireApiActor } from "@/lib/api-security"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { ClientSchema } from "@/lib/validations"
import { transformClientToAPI } from "@/lib/client-utils"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { CLIENT_MESSAGES } from "@/lib/constants/messages"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authError } = await requireApiActor(request, [
      "clients.read",
      "clients.all",
      "clients",
      "clients.list",
    ])
    if (authError) return authError
    const { id } = await params

    if (!id) {
      return createErrorResponse(CLIENT_MESSAGES.error.required, 400)
    }

    const client = await prisma.client.findUnique({
      where: { id },
    })

    if (!client) {
      return createErrorResponse(CLIENT_MESSAGES.error.notFound, 404)
    }

    return createSuccessResponse(transformClientToAPI(client))
  } catch (error) {
    return handleApiError(error, CLIENT_MESSAGES.error.fetch)
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authError } = await requireApiActor(request, [
      "clients.update",
      "clients.all",
      "clients",
    ])
    if (authError) return authError
    const { id } = await params

    if (!id) {
      return createErrorResponse(CLIENT_MESSAGES.error.required, 400)
    }

    const body = await request.json()
    const validated = ClientSchema.parse(body)

    const existingClient = await prisma.client.findUnique({
      where: { id },
    })

    if (!existingClient) {
      return createErrorResponse(CLIENT_MESSAGES.error.notFound, 404)
    }

    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        name: validated.name,
        phone: validated.phone,
        address: validated.address || null,
      },
    })

    return createSuccessResponse(transformClientToAPI(updatedClient))
  } catch (error) {
    return handleApiError(error, CLIENT_MESSAGES.error.update)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authError } = await requireApiActor(request, [
      "clients.update",
      "clients.all",
      "clients",
    ])
    if (authError) return authError
    const { id } = await params

    if (!id) {
      return createErrorResponse(CLIENT_MESSAGES.error.required, 400)
    }

    const body = await request.json()
    const { status } = body

    if (!status || !["active", "inactive"].includes(status)) {
      return createErrorResponse(`Estado inválido: ${status}`, 400)
    }

    const existingClient = await prisma.client.findUnique({
      where: { id },
    })

    if (!existingClient) {
      return createErrorResponse(CLIENT_MESSAGES.error.notFound, 404)
    }

    const updatedClient = await prisma.client.update({
      where: { id },
      data: { status },
    })

    return createSuccessResponse(transformClientToAPI(updatedClient))
  } catch (error) {
    return handleApiError(error, CLIENT_MESSAGES.error.toggleStatus)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { error: authError } = await requireApiActor(request, [
      "clients.delete",
      "clients.all",
      "clients",
    ])
    if (authError) return authError
    const { id } = await params

    if (!id) {
      return createErrorResponse(CLIENT_MESSAGES.error.required, 400)
    }

    const existingClient = await prisma.client.findUnique({
      where: { id },
      include: {
        sales: true,
        quotations: true,
        credits: true,
      },
    })

    if (!existingClient) {
      return createErrorResponse(CLIENT_MESSAGES.error.notFound, 404)
    }

    const hasAssociations =
      existingClient.sales.length > 0 ||
      existingClient.quotations.length > 0 ||
      existingClient.credits.length > 0

    if (hasAssociations) {
      const updatedClient = await prisma.client.update({
        where: { id },
        data: { isDeleted: true, status: "inactive" },
      })

      return createSuccessResponse({
        action: "deactivated",
        client: transformClientToAPI(updatedClient),
      })
    }

    await prisma.client.delete({
      where: { id },
    })

    return createSuccessResponse({ action: "deleted", message: CLIENT_MESSAGES.success.deleted })
  } catch (error) {
    return handleApiError(error, CLIENT_MESSAGES.error.delete)
  }
}
