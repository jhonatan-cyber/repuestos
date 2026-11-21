"use client"

import { DollarSign, Package, TrendingDown, TrendingUp, Calendar, BarChart3 } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/format-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useMemo } from "react"

interface SalesData {
  date: string
  total: number
}

interface ReportsStatsProps {
  stats: { totalSales: number; totalPurchases: number; totalExpenses: number; netProfit: number }
  salesCount: number
  purchasesCount: number
  expensesCount: number
  salesData?: SalesData[]
  previousStats?: {
    totalSales: number
    totalPurchases: number
    totalExpenses: number
    netProfit: number
  }
}

interface DayStat {
  date: string
  total: number
}

function aggregateByDay(items: SalesData[]): DayStat[] {
  const map = new Map<string, number>()
  items.forEach((item) => {
    const key = item.date.slice(0, 10)
    map.set(key, (map.get(key) || 0) + item.total)
  })
  return Array.from(map.entries())
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function calculateSalesStats(salesData: SalesData[] | undefined) {
  if (!salesData || salesData.length === 0) {
    return { bestDay: null, worstDay: null, averageTransaction: 0 }
  }

  const dailyTotals = aggregateByDay(salesData)

  // Mejor día (mayor total)
  const bestDay = dailyTotals.reduce(
    (best, day) => (day.total > best.total ? day : best),
    dailyTotals[0],
  )

  // Peor día (menor total, pero con ventas > 0)
  const daysWithSales = dailyTotals.filter((d) => d.total > 0)
  const worstDay =
    daysWithSales.length > 0
      ? daysWithSales.reduce(
          (worst, day) => (day.total < worst.total ? day : worst),
          daysWithSales[0],
        )
      : null

  // Promedio por transacción
  const totalSales = salesData.reduce((sum, s) => sum + s.total, 0)
  const averageTransaction = totalSales / salesData.length

  return { bestDay, worstDay, averageTransaction }
}

function getChange(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : 100
  }
  return ((current - previous) / Math.abs(previous)) * 100
}

function formatChange(value: number) {
  const rounded = Math.abs(value) < 10 ? value.toFixed(1) : Math.round(value).toString()
  return `${value >= 0 ? "+" : "-"}${rounded.replace("-", "")}%`
}

export function ReportsStats({
  stats,
  salesCount,
  purchasesCount,
  expensesCount,
  salesData,
  previousStats,
}: ReportsStatsProps) {
  const { bestDay, worstDay, averageTransaction } = useMemo(
    () => calculateSalesStats(salesData),
    [salesData],
  )

  const mainCards = [
    {
      title: "Ventas",
      value: formatCurrency(stats.totalSales),
      subtitle: `${salesCount} transacciones`,
      icon: TrendingUp,
      valueClass: "text-emerald-600",
      iconClass: "text-emerald-500",
    },
    {
      title: "Compras",
      value: formatCurrency(stats.totalPurchases),
      subtitle: `${purchasesCount} compras`,
      icon: Package,
      valueClass: "text-blue-600",
      iconClass: "text-blue-500",
    },
    {
      title: "Gastos",
      value: formatCurrency(stats.totalExpenses),
      subtitle: `${expensesCount} gastos`,
      icon: TrendingDown,
      valueClass: "text-rose-600",
      iconClass: "text-rose-500",
    },
    {
      title: "Utilidad neta",
      value: formatCurrency(stats.netProfit),
      subtitle: stats.netProfit >= 0 ? "Resultado positivo" : "Resultado negativo",
      icon: DollarSign,
      valueClass: stats.netProfit >= 0 ? "text-emerald-600" : "text-rose-600",
      iconClass: stats.netProfit >= 0 ? "text-emerald-500" : "text-rose-500",
    },
  ]

  const detailCards = [
    {
      title: "Mejor día",
      value: bestDay ? formatCurrency(bestDay.total) : "-",
      subtitle: bestDay ? formatDate(bestDay.date) : "Sin datos",
      icon: Calendar,
      valueClass: "text-emerald-600",
      iconClass: "text-emerald-500",
      show: !!bestDay,
    },
    {
      title: "Peor día",
      value: worstDay ? formatCurrency(worstDay.total) : "-",
      subtitle: worstDay ? formatDate(worstDay.date) : "Sin datos",
      icon: Calendar,
      valueClass: "text-rose-600",
      iconClass: "text-rose-500",
      show: !!worstDay,
    },
    {
      title: "Promedio/transacción",
      value: salesCount > 0 ? formatCurrency(averageTransaction) : "-",
      subtitle: salesCount > 0 ? `Por ${salesCount} transacciones` : "Sin datos",
      icon: BarChart3,
      valueClass: "text-blue-600",
      iconClass: "text-blue-500",
      show: salesCount > 0,
    },
  ]

  const comparisonCards = previousStats
    ? [
        {
          label: "Ventas vs período anterior",
          current: stats.totalSales,
          previous: previousStats.totalSales,
          accent: "text-emerald-600",
        },
        {
          label: "Compras vs período anterior",
          current: stats.totalPurchases,
          previous: previousStats.totalPurchases,
          accent: "text-blue-600",
        },
        {
          label: "Gastos vs período anterior",
          current: stats.totalExpenses,
          previous: previousStats.totalExpenses,
          accent: "text-rose-600",
        },
        {
          label: "Utilidad neta vs período anterior",
          current: stats.netProfit,
          previous: previousStats.netProfit,
          accent: stats.netProfit >= 0 ? "text-emerald-600" : "text-rose-600",
        },
      ]
    : []

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {mainCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title} className="min-w-0 border-border bg-card backdrop-blur-sm">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-3 pb-2">
                <CardTitle className="min-w-0 text-sm font-medium leading-tight">
                  {card.title}
                </CardTitle>
                <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", card.iconClass)} />
              </CardHeader>
              <CardContent className="space-y-1">
                <div
                  className={cn(
                    "break-words text-xl font-bold leading-tight sm:text-2xl",
                    card.valueClass,
                  )}
                >
                  {card.value}
                </div>
                <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {card.subtitle}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {detailCards
          .filter((c) => c.show)
          .map((card) => {
            const Icon = card.icon
            return (
              <Card key={card.title} className="min-w-0 border-border bg-card">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-3 pb-2">
                  <CardTitle className="min-w-0 text-sm font-medium leading-tight text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", card.iconClass)} />
                </CardHeader>
                <CardContent className="space-y-1">
                  <div
                    className={cn(
                      "break-words text-lg font-bold leading-tight sm:text-xl",
                      card.valueClass,
                    )}
                  >
                    {card.value}
                  </div>
                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {card.subtitle}
                  </p>
                </CardContent>
              </Card>
            )
          })}
      </div>

      {comparisonCards.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {comparisonCards.map((card) => {
            const change = getChange(card.current, card.previous)
            const isUp = change >= 0
            return (
              <Card key={card.label} className="min-w-0 border-border bg-background">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className={cn("text-lg font-bold", card.accent)}>
                    {formatCurrency(card.current)}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 font-medium",
                        isUp
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
                      )}
                    >
                      {formatChange(change)}
                    </span>
                    <span className="text-muted-foreground">
                      vs {formatCurrency(card.previous)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
