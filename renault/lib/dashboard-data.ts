import { prisma } from "@/lib/prisma"
import { Sale, SaleItem } from "@/lib/types"

interface LowStockProduct {
  id: string
  code: string
  name: string
  brand: string
  model: string
  category: string
  categoryId: string
  purchasePrice: number
  salePrice: number
  stock: number
  minimumStock: number
  unit: string
  supplierId: string | null
  supplierName: string
  createdAt: string
  image?: string | null
  lastSyncedAt?: string | null
}

interface ProductWithRelations {
  id: string
  code: string
  name: string
  brand: string
  model: string
  categoryId: string
  purchasePrice: number
  salePrice: number
  stock: number
  minimumStock: number
  unit: string
  supplierId: string | null
  createdAt: Date
  category?: { id: string; name: string } | null
  supplier?: { id: string; name: string } | null
}

interface SaleItemWithRelations {
  productId: string
  product: { name: string; purchasePrice: number; category?: { name: string } | null }
  quantity: number
  price: number
  subtotal: number
  sale?: { date: Date }
}

export async function getDashboardStats(period = "today") {
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
    // Default a "today" si no se reconoce el período
    startDate.setHours(0, 0, 0, 0)
  }

  startDate.setHours(0, 0, 0, 0)

  // Ventas en el período seleccionado
  const periodSales = await prisma.sale.findMany({
    where: {
      date: {
        gte: startDate,
      },
      status: "completada",
    },
  })

  const periodSalesTotal = periodSales.reduce(
    (sum: number, sale: { total: number }) => sum + sale.total,
    0,
  )

  const totalProducts = await prisma.product.count()

  const lowStockCandidates = await prisma.product.findMany({
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
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      supplier: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      stock: "asc",
    },
  })
  const lowStockProducts = lowStockCandidates
    .filter(
      (product: { stock: number; minimumStock: number }) => product.stock <= product.minimumStock,
    )
    .slice(0, 10)

  const recentSales = await prisma.sale.findMany({
    include: {
      client: true,
      seller: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  })

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
      paymentMethod: sale.paymentMethod as Sale["paymentMethod"],
      status: sale.status as Sale["status"],
      items: [],
      createdAt: sale.createdAt.toISOString(),
    }),
  )

  const transformedLowStock: LowStockProduct[] = lowStockProducts.map((product) => ({
    id: product.id,
    code: product.code,
    name: product.name,
    brand: "brand" in product ? ((product as { brand?: string }).brand ?? "") : "",
    model: "model" in product ? ((product as { model?: string }).model ?? "") : "",
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
    image: null,
    lastSyncedAt: null,
  }))

  return {
    periodSalesTotal,
    periodSalesCount: periodSales.length,
    totalProducts,
    lowStockCount: lowStockProducts.length,
    recentSales: transformedRecentSales,
    lowStockProducts: transformedLowStock,
  }
}

interface DashboardChartData {
  salesByDay: { date: string; total: number }[]
  topProducts: { name: string; quantity: number; total: number }[]
  salesByCategory: { category: string; total: number }[]
  paymentMethods: { method: string; count: number }[]
  profitByDay: { date: string; total: number }[]
}

export async function getDashboardCharts(period = "7days"): Promise<DashboardChartData> {
  // Calcular fecha de inicio según el período
  const startDate = new Date()
  if (period === "7days") {
    startDate.setDate(startDate.getDate() - 7)
  } else if (period === "30days") {
    startDate.setDate(startDate.getDate() - 30)
  } else if (period === "90days") {
    startDate.setDate(startDate.getDate() - 90)
  } else if (period === "year") {
    startDate.setFullYear(startDate.getFullYear() - 1)
  }

  // Ventas por día
  const sales = await prisma.sale.findMany({
    where: {
      date: {
        gte: startDate,
      },
      status: "completada",
    },
    orderBy: {
      date: "asc",
    },
  })

  const salesByDay = sales.reduce(
    (acc: Record<string, number>, sale: { date: Date; total: number }) => {
      const dateKey = sale.date.toISOString().split("T")[0]
      acc[dateKey] = (acc[dateKey] || 0) + sale.total
      return acc
    },
    {} as Record<string, number>,
  )

  const salesByDayArray: { date: string; total: number }[] = Object.entries(salesByDay).map(
    ([date, total]) => ({
      date,
      total: Number(total),
    }),
  )

  // Top productos más vendidos
  const saleItems = await prisma.saleItem.findMany({
    where: {
      sale: {
        date: {
          gte: startDate,
        },
        status: "completada",
      },
    },
    include: {
      product: {
        include: {
          category: true,
        },
      },
      sale: true,
    },
  })

  const productSales = saleItems.reduce(
    (
      acc: Record<string, { name: string; quantity: number; total: number }>,
      item: { productId: string; product: { name: string }; quantity: number; subtotal: number },
    ) => {
      const productId = item.productId
      if (!acc[productId]) {
        acc[productId] = {
          name: item.product.name,
          quantity: 0,
          total: 0,
        }
      }
      acc[productId].quantity += item.quantity
      acc[productId].total += item.subtotal
      return acc
    },
    {} as Record<string, { name: string; quantity: number; total: number }>,
  )

  const topProducts = Object.values(productSales)
    .sort((a: { total: number }, b: { total: number }) => b.total - a.total)
    .slice(0, 10)

  // Ventas por categoría
  const categorySales = saleItems.reduce(
    (acc: Record<string, number>, item: SaleItemWithRelations) => {
      const categoryName = item.product.category?.name || "Sin categoría"
      acc[categoryName] = (acc[categoryName] || 0) + item.subtotal
      return acc
    },
    {},
  )

  const salesByCategoryArray: { category: string; total: number }[] = Object.entries(
    categorySales,
  ).map(([category, total]) => ({
    category,
    total: Number(total),
  }))

  // Métodos de pago
  const paymentMethods = sales.reduce(
    (acc: Record<string, number>, sale: { paymentMethod: string }) => {
      acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const paymentMethodsArray: { method: string; count: number }[] = Object.entries(
    paymentMethods,
  ).map(([method, count]) => ({
    method,
    count: Number(count),
  }))

  const profitByDay = saleItems.reduce(
    (acc: Record<string, number>, item: SaleItemWithRelations) => {
      const dateKey =
        item.sale?.date.toISOString().split("T")[0] ?? new Date().toISOString().split("T")[0]
      const profit = (item.price - item.product.purchasePrice) * item.quantity
      acc[dateKey] = (acc[dateKey] || 0) + profit
      return acc
    },
    {},
  )

  const profitByDayArray: { date: string; total: number }[] = Object.entries(profitByDay).map(
    ([date, total]) => ({
      date,
      total: Number(total),
    }),
  )

  return {
    salesByDay: salesByDayArray,
    topProducts,
    salesByCategory: salesByCategoryArray,
    paymentMethods: paymentMethodsArray,
    profitByDay: profitByDayArray,
  }
}
