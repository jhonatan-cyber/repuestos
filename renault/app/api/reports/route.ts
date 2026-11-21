import { NextRequest, NextResponse } from "next/server"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { logger } from "@/lib/logger"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"

// Reportes disponibles
const AVAILABLE_REPORTS = [
  {
    id: "sales",
    name: "Reporte de Ventas",
    description: "Reporte de ventas realizadas en el período",
    endpoint: "/api/reports/sales",
  },
  {
    id: "purchases",
    name: "Reporte de Compras",
    description: "Reporte de compras realizadas en el período",
    endpoint: "/api/reports/purchases",
  },
  {
    id: "inventory",
    name: "Reporte de Inventario",
    description: "Estado actual del inventario de productos",
    endpoint: "/api/reports/inventory",
  },
  {
    id: "clients",
    name: "Reporte de Clientes",
    description: "Reporte de clientes y sus compras",
    endpoint: "/api/reports/clients",
  },
]

export async function GET(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) {
      return createErrorResponse("No autenticado", 401)
    }
    if (!hasAnyPermission(actor, ["reports.read", "reports.list", "reports.all", "reports"])) {
      return createErrorResponse("Sin permisos para ver reportes", 403)
    }

    return createSuccessResponse({
      reports: AVAILABLE_REPORTS,
    })
  } catch (error) {
    logger.error("Error al obtener reportes", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al obtener reportes")
  }
}
