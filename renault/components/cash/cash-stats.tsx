"use client"

import {
  BadgeDollarSign,
  CircleCheckBig,
  CircleDotDashed,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import { formatCurrency } from "@/lib/format-utils"

interface CashStatsProps {
  stats: {
    totalRecords: number
    openRecords: number
    closedRecords: number
    totalIncome: number
    totalExpenses: number
    currentBalance: number
  }
}

export function CashStats({ stats }: CashStatsProps) {
  const cards = [
    {
      title: "Saldo Actual",
      value: formatCurrency(stats.currentBalance),
      icon: BadgeDollarSign,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      borderColor: "border-blue-200 dark:border-blue-900",
    },
    {
      title: "Cajas Abiertas",
      value: stats.openRecords.toLocaleString(),
      icon: CircleDotDashed,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
      borderColor: "border-emerald-200 dark:border-emerald-900",
    },
    {
      title: "Cajas Cerradas",
      value: stats.closedRecords.toLocaleString(),
      icon: CircleCheckBig,
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-50 dark:bg-violet-950/20",
      borderColor: "border-violet-200 dark:border-violet-900",
    },
    {
      title: "Ingresos",
      value: formatCurrency(stats.totalIncome),
      icon: TrendingUp,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      borderColor: "border-green-200 dark:border-green-900",
    },
    {
      title: "Egresos",
      value: formatCurrency(stats.totalExpenses),
      icon: TrendingDown,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-950/20",
      borderColor: "border-red-200 dark:border-red-900",
    },
  ]

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.title}
            className={`rounded-lg border ${card.borderColor} ${card.bgColor} p-4`}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{card.title}</p>
                <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
              </div>
              <div className="rounded-full p-2.5 bg-background/70">
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
