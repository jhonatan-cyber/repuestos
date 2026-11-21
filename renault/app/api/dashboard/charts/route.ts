import { logger } from "@/lib/logger"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"
import { formatDateLocal } from "@/lib/dates"

function toDateKey(date: Date | string | null | undefined): string | null {
  if (!date) return null
  const d = typeof date === "string" ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return null
  return formatDateLocal(d)
}

type ProductSalesSummary = {
  name: string
  quantity: number
  total: number
}

export async function GET(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)
    if (!hasAnyPermission(actor, ["dashboard.read", "dashboard", "reports.read", "reports"])) {
      return createErrorResponse("Sin permisos", 403)
    }
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get("period") || "7days"
    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")

    const now = new Date()
    const startDate = new Date(now)
    const endDate = new Date(now)

    if (startDateParam || endDateParam) {
      if (startDateParam) {
        const parsed = new Date(startDateParam)
        if (!Number.isNaN(parsed.getTime())) startDate.setTime(parsed.getTime())
      }
      if (endDateParam) {
        const parsed = new Date(endDateParam)
        if (!Number.isNaN(parsed.getTime())) endDate.setTime(parsed.getTime())
      }
    } else if (period === "7days") {
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
    } else {
      startDate.setDate(startDate.getDate() - 7)
    }

    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(23, 59, 59, 999)

    const salesPromise = prisma.sale.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: "completada",
      },
      orderBy: {
        date: "asc",
      },
    })

    // Avoid brittle required-relation includes on legacy/inconsistent DB rows.
    const saleItemsPromise = prisma.saleItem.findMany({
      where: {
        sale: {
          date: {
            gte: startDate,
            lte: endDate,
          },
          status: "completada",
        },
      },
      select: {
        productId: true,
        quantity: true,
        subtotal: true,
        price: true,
        sale: {
          select: {
            date: true,
          },
        },
      },
    })

    const [sales, saleItems] = await Promise.all([salesPromise, saleItemsPromise])

    const productIds = Array.from(new Set(saleItems.map((item) => item.productId)))
    const products = productIds.length
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: {
            id: true,
            name: true,
            purchasePrice: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        })
      : []

    const productsById = new Map(products.map((product) => [product.id, product]))

    const salesByDay = sales.reduce(
      (
        acc: Record<string, { total: number; count: number }>,
        sale: { date: Date; total: number },
      ) => {
        const dateKey = toDateKey(sale.date)
        if (!dateKey) return acc
        if (!acc[dateKey]) {
          acc[dateKey] = { total: 0, count: 0 }
        }
        acc[dateKey].total += sale.total
        acc[dateKey].count += 1
        return acc
      },
      {} as Record<string, { total: number; count: number }>,
    )

    const salesByDayArray = Object.entries(salesByDay).map(([date, data]) => ({
      date,
      total: data.total,
      count: data.count,
    }))

    const productSales = saleItems.reduce(
      (
        acc: Record<string, ProductSalesSummary>,
        item: { productId: string; quantity: number; subtotal: number },
      ) => {
        const productId = item.productId
        const product = productsById.get(productId)

        if (!acc[productId]) {
          acc[productId] = {
            name: product?.name || "Producto eliminado",
            quantity: 0,
            total: 0,
          }
        }

        acc[productId].quantity += item.quantity
        acc[productId].total += item.subtotal
        return acc
      },
      {} as Record<string, ProductSalesSummary>,
    )

    const topProducts = (Object.values(productSales) as ProductSalesSummary[])
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    const categorySales = saleItems.reduce(
      (acc: Record<string, number>, item: { productId: string; subtotal: number }) => {
        const product = productsById.get(item.productId)
        const categoryName = product?.category?.name || "Sin categoría"
        acc[categoryName] = (acc[categoryName] || 0) + item.subtotal
        return acc
      },
      {} as Record<string, number>,
    )

    const salesByCategoryArray = Object.entries(categorySales).map(([category, total]) => ({
      category,
      total,
    }))

    const paymentMethods = sales.reduce(
      (acc: Record<string, number>, sale: { paymentMethod?: string | null }) => {
        const method = sale.paymentMethod?.trim() || "sin_definir"
        acc[method] = (acc[method] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const paymentMethodsArray = Object.entries(paymentMethods).map(([method, count]) => ({
      method,
      count,
    }))

    const profitByDay = saleItems.reduce(
      (
        acc: Record<string, number>,
        item: {
          sale?: { date?: Date | string | null } | null
          price: number
          quantity: number
          productId: string
        },
      ) => {
        const dateKey = toDateKey(item.sale?.date) ?? toDateKey(new Date())
        if (!dateKey) return acc

        const product = productsById.get(item.productId)
        const purchasePrice = typeof product?.purchasePrice === "number" ? product.purchasePrice : 0
        const profit = (item.price - purchasePrice) * item.quantity

        acc[dateKey] = (acc[dateKey] || 0) + profit
        return acc
      },
      {} as Record<string, number>,
    )

    const profitByDayArray = Object.entries(profitByDay).map(([date, total]) => ({
      date,
      total,
    }))

    return createSuccessResponse({
      salesByDay: salesByDayArray,
      topProducts,
      salesByCategory: salesByCategoryArray,
      paymentMethods: paymentMethodsArray,
      profitByDay: profitByDayArray,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    logger.error("Error al obtener datos de gráficos", { error: msg })
    return handleApiError(error, "Error al obtener datos de gráficos")
  }
}
