"use client"

import { DollarSign, ShoppingCart, TrendingUp, TrendingDown, Clock, Minus } from "lucide-react"
import { formatCurrency } from "@/lib/format-utils"

interface SalesStatsProps {
  stats: {
    totalSalesAmount: number
    totalSalesCount: number
    completedSalesCount: number
    pendingSalesCount: number
  }
  trend?: {
    amountChange: number // percentage: 12.5 means +12.5%
    countChange: number
    amountVsLastPeriod: number // absolute value of last period
    countVsLastPeriod: number // absolute count of last period
  }
}

export function SalesStats({ stats, trend }: SalesStatsProps) {
  const cards = [
    {
      title: "Total Ventas",
      value: formatCurrency(stats.totalSalesAmount),
      icon: DollarSign,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      borderColor: "border-blue-200 dark:border-blue-900",
      trend: trend?.amountChange,
      trendLabel: "vs período anterior",
    },
    {
      title: "Cantidad",
      value: stats.totalSalesCount.toLocaleString(),
      icon: ShoppingCart,
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-50 dark:bg-violet-950/20",
      borderColor: "border-violet-200 dark:border-violet-900",
      trend: trend?.countChange,
      trendLabel: "vs período anterior",
    },
    {
      title: "Completadas",
      value: stats.completedSalesCount.toLocaleString(),
      icon: TrendingUp,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      borderColor: "border-green-200 dark:border-green-900",
    },
    {
      title: "Pendientes",
      value: stats.pendingSalesCount.toLocaleString(),
      icon: Clock,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      borderColor: "border-orange-200 dark:border-orange-900",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.title}
            className={`min-w-0 rounded-lg border ${card.borderColor} ${card.bgColor} p-4`}
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 space-y-1">
                <p className="truncate text-xs font-medium text-muted-foreground">{card.title}</p>
                <p
                  className={`break-words text-lg font-bold leading-tight sm:text-2xl ${card.color}`}
                >
                  {card.value}
                </p>
                {card.trend !== undefined && card.trend !== null && (
                  <TrendBadge value={card.trend} label={card.trendLabel} />
                )}
              </div>
              <div className="shrink-0 rounded-full bg-background/70 p-2.5">
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TrendBadge({ value, label }: { value: number; label: string }) {
  if (value === 0) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        <span>0% {label}</span>
      </div>
    )
  }

  const isPositive = value > 0
  const colorClass = isPositive
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-red-600 dark:text-red-400"
  const Icon = isPositive ? TrendingUp : TrendingDown

  return (
    <div className={`flex flex-wrap items-center gap-1 text-xs ${colorClass}`}>
      <Icon className="h-3 w-3" />
      <span>
        {isPositive ? "+" : ""}
        {value.toFixed(1)}% {label}
      </span>
    </div>
  )
}
