"use client"

import { DollarSign, Receipt, TrendingDown, Calculator } from "lucide-react"

interface ExpenseStatsProps {
  stats: {
    totalExpenses: number
    totalAmount: number
    avgAmount: number
    expensesByCategory: Record<string, number>
  }
}

export function ExpenseStats({ stats }: ExpenseStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const { totalExpenses, totalAmount, avgAmount, expensesByCategory } = stats
  const topCategory = Object.keys(expensesByCategory).reduce(
    (a, b) => (expensesByCategory[a] > expensesByCategory[b] ? a : b),
    Object.keys(expensesByCategory)[0] || "N/A",
  )

  const statsData = [
    {
      title: "Total Gastos",
      value: totalExpenses.toLocaleString(),
      icon: Receipt,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      borderColor: "border-blue-200 dark:border-blue-900",
    },
    {
      title: "Monto Total",
      value: formatCurrency(totalAmount),
      icon: DollarSign,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      borderColor: "border-green-200 dark:border-green-900",
    },
    {
      title: "Promedio por Gasto",
      value: formatCurrency(avgAmount),
      icon: Calculator,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      borderColor: "border-orange-200 dark:border-orange-900",
    },
    {
      title: "Categoría Principal",
      value: topCategory,
      icon: TrendingDown,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      borderColor: "border-purple-200 dark:border-purple-900",
    },
  ]

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.title}
            className={`relative overflow-hidden rounded-lg border ${stat.borderColor} ${stat.bgColor} p-4 transition-all hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <div className={`rounded-full p-2.5 ${stat.bgColor}`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
