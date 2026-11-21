import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import {
  createErrorResponse,
  createSuccessResponse,
  handleApiError,
  getPaginationParams,
} from "@/lib/api-utils"
import { RATE_LIMITS, checkRateLimit, getClientKey } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"
import { parseDateStartLocal, formatDateLocal } from "@/lib/sales-utils"

// Tipo de reporte válido
type ReportType = "sales" | "purchases" | "inventory" | "clients"

const VALID_REPORTS: ReportType[] = ["sales", "purchases", "inventory", "clients"]

// Tipos para estadísticas
interface DayTotal {
  date: string
  total: number
}

interface DailyStats {
  average: number
  bestDay: { date: string; value: number }
  worstDay: { date: string; value: number }
  variationPercent: number | null
}

function dedupeById<T extends { id: string | number }>(rows: T[]): T[] {
  const map = new Map<string, T>()
  for (const row of rows) {
    map.set(String(row.id), row)
  }
  return Array.from(map.values())
}

// Función auxiliar para calcular estadísticas diarias
function calculateDailyStats(
  data: { date: string; total: number }[],
  previousData?: { date: string; total: number }[],
): DailyStats {
  if (data.length === 0) {
    return {
      average: 0,
      bestDay: { date: "", value: 0 },
      worstDay: { date: "", value: 0 },
      variationPercent: null,
    }
  }

  // Agrupar por fecha y sumar totales
  const dailyTotals = data.reduce(
    (acc, item) => {
      if (!acc[item.date]) {
        acc[item.date] = 0
      }
      acc[item.date] += item.total
      return acc
    },
    {} as Record<string, number>,
  )

  const dayTotals: DayTotal[] = Object.entries(dailyTotals).map(([date, total]) => ({
    date,
    total,
  }))

  // Calcular promedio
  const totalSum = dayTotals.reduce((sum, day) => sum + day.total, 0)
  const average = totalSum / dayTotals.length

  // Mejor día (mayor total)
  const bestDay = dayTotals.reduce((best, day) => (day.total > best.total ? day : best), {
    date: "",
    total: 0,
  })

  // Peor día (menor total)
  const worstDay = dayTotals.reduce((worst, day) => (day.total < worst.total ? day : worst), {
    date: "",
    total: Infinity,
  })

  // Calcular variación vs período anterior
  let variationPercent: number | null = null
  if (previousData && previousData.length > 0) {
    const previousDailyTotals = previousData.reduce(
      (acc, item) => {
        if (!acc[item.date]) {
          acc[item.date] = 0
        }
        acc[item.date] += item.total
        return acc
      },
      {} as Record<string, number>,
    )

    const previousDayTotals: DayTotal[] = Object.entries(previousDailyTotals).map(
      ([date, total]) => ({
        date,
        total,
      }),
    )

    const previousSum = previousDayTotals.reduce((sum, day) => sum + day.total, 0)
    const previousAverage = previousSum / previousDayTotals.length

    if (previousAverage > 0) {
      variationPercent = ((average - previousAverage) / previousAverage) * 100
    }
  }

  return {
    average: Math.round(average * 100) / 100,
    bestDay: { date: bestDay.date, value: bestDay.total },
    worstDay: { date: worstDay.date, value: worstDay.total },
    variationPercent: variationPercent !== null ? Math.round(variationPercent * 100) / 100 : null,
  }
}

// Función para obtener el período anterior
function getPreviousPeriod(
  startDate?: string | null,
  endDate?: string | null,
): { startDate: string; endDate: string } | null {
  if (!startDate || !endDate) {
    return null
  }

  const start = parseDateStartLocal(startDate)
  const end = parseDateStartLocal(endDate)
  const diffTime = end.getTime() - start.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  const prevEnd = new Date(start)
  prevEnd.setDate(prevEnd.getDate() - 1)
  const prevStart = new Date(prevEnd)
  prevStart.setDate(prevStart.getDate() - diffDays)

  return {
    startDate: formatDateLocal(prevStart),
    endDate: formatDateLocal(prevEnd),
  }
}

function buildDateFilter(startDate?: string | null, endDate?: string | null) {
  if (!startDate && !endDate) {
    return undefined
  }

  const dateRange: { gte?: Date; lte?: Date } = {}
  if (startDate) {
    dateRange.gte = parseDateStartLocal(startDate)
  }
  if (endDate) {
    const end = parseDateStartLocal(endDate)
    end.setHours(23, 59, 59, 999)
    dateRange.lte = end
  }

  return dateRange
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  try {
    const actor = await getApiActor(request)
    if (!actor) {
      return createErrorResponse("No autenticado", 401)
    }
    if (
      !hasAnyPermission(actor, [
        "reports.read",
        "reports.list",
        "reports.export",
        "reports.all",
        "reports",
      ])
    ) {
      return createErrorResponse("Sin permisos para generar reportes", 403)
    }
    const rl = checkRateLimit(
      `reports:${getClientKey(request)}`,
      RATE_LIMITS.reports.limit,
      RATE_LIMITS.reports.windowMs,
    )
    if (!rl.allowed) return createErrorResponse("Demasiadas solicitudes de reportes", 429)

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    // Paginado por defecto (cap 500); `?all=true` devuelve todo para exportaciones
    const fetchAll = searchParams.get("all") === "true"
    const { page, limit, skip } = getPaginationParams(searchParams)
    const take = fetchAll ? undefined : Math.min(limit, 500)
    const skipRows = fetchAll ? undefined : skip

    const { type } = await params

    // Validar tipo de reporte
    if (!VALID_REPORTS.includes(type as ReportType)) {
      return createErrorResponse(
        `Tipo de reporte inválido. Valores válidos: ${VALID_REPORTS.join(", ")}`,
        400,
      )
    }

    const dateFilter = buildDateFilter(startDate, endDate)
    const previousPeriod = getPreviousPeriod(startDate, endDate)
    const previousDateFilter = previousPeriod
      ? buildDateFilter(previousPeriod.startDate, previousPeriod.endDate)
      : undefined

    switch (type) {
      case "sales": {
        const [sales, previousSales, salesTotal] = await Promise.all([
          prisma.sale.findMany({
            where: { ...(dateFilter ? { date: dateFilter } : {}), isDeleted: false },
            include: {
              client: true,
              seller: true,
              items: {
                include: {
                  product: true,
                },
              },
            },
            orderBy: { date: "desc" },
            skip: skipRows,
            take,
          }),
          previousDateFilter
            ? prisma.sale.findMany({
                where: { date: previousDateFilter, isDeleted: false },
                select: { date: true, total: true },
              })
            : Promise.resolve([]),
          prisma.sale.count({
            where: { ...(dateFilter ? { date: dateFilter } : {}), isDeleted: false },
          }),
        ])

        const uniqueSales = dedupeById(sales)

        const transformed = uniqueSales.map((sale) => ({
          id: sale.id,
          date: formatDateLocal(sale.date),
          clientId: sale.clientId,
          clientName: sale.client?.name ?? "Cliente no registrado",
          clientNit: sale.client?.nit ?? null,
          sellerUserId: sale.sellerUserId,
          sellerName: `${sale.seller.firstName} ${sale.seller.lastName}`,
          items: sale.items.map((item) => ({
            productId: item.productId,
            productCode: item.product.code,
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice: item.price,
            subtotal: item.subtotal,
          })),
          subtotal: sale.subtotal,
          tax: sale.tax,
          discount: sale.discount,
          total: sale.total,
          paymentMethod: sale.paymentMethod,
          status: sale.status,
          createdAt: sale.createdAt.toISOString(),
        }))

        // Calcular estadísticas
        const salesData = uniqueSales.map((s) => ({
          date: formatDateLocal(s.date),
          total: s.total,
        }))
        const previousSalesData = previousSales.map((s) => ({
          date: formatDateLocal(s.date),
          total: s.total,
        }))
        const stats = calculateDailyStats(salesData, previousSalesData)

        return createSuccessResponse({
          report: "sales",
          period: { startDate, endDate },
          total: fetchAll ? transformed.length : salesTotal,
          stats,
          data: transformed,
          pagination: fetchAll
            ? undefined
            : {
                page,
                limit: Math.min(limit, 500),
                total: salesTotal,
                totalPages: Math.ceil(salesTotal / Math.min(limit, 500)),
              },
        })
      }

      case "purchases": {
        const [purchases, purchasesTotal] = await Promise.all([
          prisma.purchase.findMany({
            where: { ...(dateFilter ? { date: dateFilter } : {}), isDeleted: false },
            include: {
              supplier: true,
              buyer: true,
              items: {
                include: {
                  product: true,
                },
              },
            },
            orderBy: { date: "desc" },
            skip: skipRows,
            take,
          }),
          prisma.purchase.count({
            where: { ...(dateFilter ? { date: dateFilter } : {}), isDeleted: false },
          }),
        ])

        const uniquePurchases = dedupeById(purchases)

        const transformed = uniquePurchases.map((purchase) => ({
          id: purchase.id,
          date: formatDateLocal(purchase.date),
          supplierId: purchase.supplierId,
          supplierName: purchase.supplier.name,
          supplierCompany: purchase.supplier.company,
          buyerUserId: purchase.buyerUserId,
          buyerName: `${purchase.buyer.firstName} ${purchase.buyer.lastName}`,
          items: purchase.items.map((item) => ({
            productId: item.productId,
            productCode: item.product.code,
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice: item.price,
          })),
          subtotal: purchase.subtotal,
          tax: purchase.tax,
          total: purchase.total,
          status: purchase.status,
          createdAt: purchase.createdAt.toISOString(),
        }))

        return createSuccessResponse({
          report: "purchases",
          period: { startDate, endDate },
          total: fetchAll ? transformed.length : purchasesTotal,
          data: transformed,
          pagination: fetchAll
            ? undefined
            : {
                page,
                limit: Math.min(limit, 500),
                total: purchasesTotal,
                totalPages: Math.ceil(purchasesTotal / Math.min(limit, 500)),
              },
        })
      }

      case "inventory": {
        const [products, productsTotal, leanTotals] = await Promise.all([
          prisma.product.findMany({
            where: { isDeleted: false },
            include: {
              category: true,
              supplier: true,
            },
            orderBy: { name: "asc" },
            skip: skipRows,
            take,
          }),
          prisma.product.count({ where: { isDeleted: false } }),
          // Resumen global con query liviana (3 columnas, sin includes)
          prisma.product.findMany({
            where: { isDeleted: false },
            select: { stock: true, purchasePrice: true, minimumStock: true },
          }),
        ])

        const uniqueProducts = dedupeById(products)

        const transformed = uniqueProducts.map((product) => ({
          id: product.id,
          code: product.code,
          name: product.name,
          category: product.category.name,
          categoryColor: product.category.color,
          supplierName: product.supplier?.name ?? "Sin proveedor",
          purchasePrice: product.purchasePrice,
          salePrice: product.salePrice,
          stock: product.stock,
          minimumStock: product.minimumStock,
          unit: product.unit,
          needsRestock: product.stock <= product.minimumStock,
          stockValue: product.stock * product.purchasePrice,
          createdAt: product.createdAt.toISOString(),
        }))

        // Resumen global (no solo la página)
        const totalProducts = productsTotal
        const totalStock = leanTotals.reduce((sum, p) => sum + p.stock, 0)
        const totalValue = leanTotals.reduce((sum, p) => sum + p.stock * p.purchasePrice, 0)
        const lowStock = leanTotals.filter((p) => p.stock <= p.minimumStock).length

        return createSuccessResponse({
          report: "inventory",
          summary: {
            totalProducts,
            totalStock,
            totalValue,
            lowStock,
          },
          data: transformed,
          pagination: fetchAll
            ? undefined
            : {
                page,
                limit: Math.min(limit, 500),
                total: productsTotal,
                totalPages: Math.ceil(productsTotal / Math.min(limit, 500)),
              },
        })
      }

      case "clients": {
        const [clients, clientsTotal] = await Promise.all([
          prisma.client.findMany({
            where: { isDeleted: false },
            include: {
              sales: {
                where: {
                  ...(dateFilter ? { date: dateFilter } : {}),
                  isDeleted: false,
                },
                include: {
                  items: true,
                },
              },
            },
            orderBy: { totalPurchases: "desc" },
            skip: skipRows,
            take,
          }),
          prisma.client.count({ where: { isDeleted: false } }),
        ])

        const uniqueClients = dedupeById(clients)

        const transformed = uniqueClients.map((client) => {
          const clientSales = client.sales || []
          const totalSales = clientSales.length
          const totalSpent = clientSales.reduce((sum, s) => sum + s.total, 0)

          return {
            id: client.id,
            name: client.name,
            phone: client.phone,
            nit: client.nit,
            address: client.address,
            status: client.status,
            totalPurchases: client.totalPurchases,
            periodSales: totalSales,
            periodSpent: totalSpent,
          }
        })

        return createSuccessResponse({
          report: "clients",
          period: { startDate, endDate },
          total: fetchAll ? transformed.length : clientsTotal,
          data: transformed,
          pagination: fetchAll
            ? undefined
            : {
                page,
                limit: Math.min(limit, 500),
                total: clientsTotal,
                totalPages: Math.ceil(clientsTotal / Math.min(limit, 500)),
              },
        })
      }

      default:
        return createErrorResponse("Reporte no implementado", 501)
    }
  } catch (error) {
    logger.error("Error al generar reporte", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al generar reporte")
  }
}
