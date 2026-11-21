"use client"

import { Clock, Package, ShoppingCart, TrendingUp } from "lucide-react"
import { formatCurrency } from "@/lib/format-utils"

interface PurchaseStatsProps {
  stats: {
    totalPurchasesAmount: number
    totalPurchasesCount: number
    receivedPurchasesCount: number
    pendingPurchasesCount: number
  }
}

export function PurchaseStats({ stats }: PurchaseStatsProps) {
  const cards = [
    {
      title: "Total compras",
      value: formatCurrency(stats.totalPurchasesAmount),
      icon: ShoppingCart,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      borderColor: "border-blue-200 dark:border-blue-900",
    },
    {
      title: "Cantidad",
      value: stats.totalPurchasesCount.toLocaleString(),
      icon: Package,
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-50 dark:bg-violet-950/20",
      borderColor: "border-violet-200 dark:border-violet-900",
    },
    {
      title: "Recibidas",
      value: stats.receivedPurchasesCount.toLocaleString(),
      icon: TrendingUp,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      borderColor: "border-green-200 dark:border-green-900",
    },
    {
      title: "Pendientes",
      value: stats.pendingPurchasesCount.toLocaleString(),
      icon: Clock,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      borderColor: "border-orange-200 dark:border-orange-900",
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.title}
            className={`min-w-0 rounded-lg border ${card.borderColor} ${card.bgColor} p-4`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-medium leading-tight text-muted-foreground">
                  {card.title}
                </p>
                <p
                  className={`break-words text-xl font-bold leading-tight sm:text-2xl ${card.color}`}
                >
                  {card.value}
                </p>
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
