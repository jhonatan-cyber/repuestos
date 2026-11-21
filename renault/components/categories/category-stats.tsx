"use client"

import { Tags, CheckCircle2, XCircle } from "lucide-react"

interface CategoryStatsProps {
  stats: {
    totalCategories: number
    activeCategories: number
    inactiveCategories: number
  }
}

export function CategoryStats({ stats }: CategoryStatsProps) {
  const { totalCategories, activeCategories, inactiveCategories } = stats

  const statsData = [
    {
      title: "Total Categorías",
      value: totalCategories.toLocaleString(),
      icon: Tags,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      borderColor: "border-blue-200 dark:border-blue-900",
    },
    {
      title: "Categorías Activas",
      value: activeCategories.toLocaleString(),
      icon: CheckCircle2,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      borderColor: "border-green-200 dark:border-green-900",
    },
    {
      title: "Categorías Inactivas",
      value: inactiveCategories.toLocaleString(),
      icon: XCircle,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      borderColor: "border-orange-200 dark:border-orange-900",
    },
  ]

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
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
