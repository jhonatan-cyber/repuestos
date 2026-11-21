import { logger } from "@/lib/logger"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"

export async function GET(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)
    if (!hasAnyPermission(actor, ["dashboard.read", "dashboard", "reports.read", "reports"])) {
      return createErrorResponse("Sin permisos", 403)
    }
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get("period") || "7days"

    // Calcular fecha de inicio según el período
    const now = new Date()
    const startDate = new Date(now)

    if (period === "7days") {
      startDate.setDate(startDate.getDate() - 7)
    } else if (period === "30days") {
      startDate.setDate(startDate.getDate() - 30)
    } else if (period === "90days") {
      startDate.setDate(startDate.getDate() - 90)
    } else if (period === "year") {
      startDate.setFullYear(startDate.getFullYear() - 1)
    } else if (period === "week") {
      startDate.setDate(startDate.getDate() - 6)
    } else if (period === "month") {
      startDate.setDate(1)
      startDate.setHours(0, 0, 0, 0)
    } else if (period === "today") {
      startDate.setHours(0, 0, 0, 0)
    } else {
      // Default: últimos 7 días
      startDate.setDate(startDate.getDate() - 7)
    }

    startDate.setHours(0, 0, 0, 0)

    // Ventas en el período seleccionado (+ conteo y total en paralelo)
    const [periodSales, totalProducts, lowStockCandidates, recentSales] = await Promise.all([
      prisma.sale.findMany({
        where: { date: { gte: startDate }, status: "completada", isDeleted: false },
        select: { total: true },
      }),
      prisma.product.count({ where: { isDeleted: false } }),
      prisma.product.findMany({
        where: { isDeleted: false },
        select: {
          id: true,
          code: true,
          name: true,
          categoryId: true,
          purchasePrice: true,
          salePrice: true,
          stock: true,
          minimumStock: true,
          unit: true,
          supplierId: true,
          createdAt: true,
          category: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
        },
        orderBy: { stock: "asc" },
        take: 200,
      }),
      prisma.sale.findMany({
        where: { isDeleted: false },
        include: { client: true, seller: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ])

    const periodSalesTotal = periodSales.reduce(
      (sum: number, sale: { total: number }) => sum + sale.total,
      0,
    )

    const lowStockProducts = lowStockCandidates
      .filter(
        (product: { stock: number; minimumStock: number }) => product.stock <= product.minimumStock,
      )
      .slice(0, 10)

    // Transformar para compatibilidad con el frontend
    const transformedRecentSales = recentSales.map(
      (sale: {
        id: string
        date: Date
        clientId: string | null
        client: { name: string } | null
        sellerUserId: string
        seller: { firstName: string; lastName: string }
        subtotal: number
        tax: number
        discount: number
        total: number
        paymentMethod: string
        status: string
        createdAt: Date
      }) => ({
        id: sale.id,
        date: sale.date.toISOString(),
        clientId: sale.clientId,
        clientName: sale.client?.name ?? "Cliente no registrado",
        sellerUserId: sale.sellerUserId,
        sellerName: `${sale.seller.firstName} ${sale.seller.lastName}`,
        subtotal: sale.subtotal,
        tax: sale.tax,
        discount: sale.discount,
        total: sale.total,
        paymentMethod: sale.paymentMethod,
        status: sale.status,
        createdAt: sale.createdAt.toISOString(),
      }),
    )

    const transformedLowStock = lowStockProducts.map(
      (product: {
        id: string
        code: string
        name: string
        category?: { name: string } | null
        categoryId: string
        purchasePrice: number
        salePrice: number
        stock: number
        minimumStock: number
        unit: string
        supplierId: string | null
        supplier?: { name: string } | null
        createdAt: Date
      }) => ({
        id: product.id,
        code: product.code,
        name: product.name,
        category: product.category?.name ?? "Sin categoria",
        categoryId: product.categoryId,
        purchasePrice: product.purchasePrice,
        salePrice: product.salePrice,
        stock: product.stock,
        minimumStock: product.minimumStock,
        unit: product.unit,
        supplierId: product.supplierId,
        supplierName: product.supplier?.name ?? "Sin proveedor",
        createdAt: product.createdAt.toISOString(),
      }),
    )

    return createSuccessResponse({
      periodSalesTotal,
      periodSalesCount: periodSales.length,
      totalProducts,
      lowStockCount: lowStockProducts.length,
      recentSales: transformedRecentSales,
      lowStockProducts: transformedLowStock,
    })
  } catch (error) {
    logger.error("Error al obtener estadísticas del dashboard", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al obtener estadísticas del dashboard")
  }
}
