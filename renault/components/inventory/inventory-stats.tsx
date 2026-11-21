"use client"

import { AlertTriangle, Boxes, CircleDollarSign, PackageCheck } from "lucide-react"
import { formatCurrency } from "@/lib/format-utils"

interface InventoryStatsProps {
  stats: {
    totalProducts: number
    lowStockProducts: number
    inventoryCost: number
    inventoryValue: number
  }
}

export function InventoryStats({ stats }: InventoryStatsProps) {
  const cards = [
    {
      title: "Productos",
      value: stats.totalProducts.toLocaleString(),
      icon: Boxes,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      borderColor: "border-blue-200 dark:border-blue-900",
    },
    {
      title: "Stock bajo",
      value: stats.lowStockProducts.toLocaleString(),
      icon: AlertTriangle,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      borderColor: "border-orange-200 dark:border-orange-900",
    },
    {
      title: "Costo inventario",
      value: formatCurrency(stats.inventoryCost),
      icon: CircleDollarSign,
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-50 dark:bg-violet-950/20",
      borderColor: "border-violet-200 dark:border-violet-900",
    },
    {
      title: "Valor inventario",
      value: formatCurrency(stats.inventoryValue),
      icon: PackageCheck,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      borderColor: "border-green-200 dark:border-green-900",
    },
  ]

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
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
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              </div>
              <div className="rounded-full bg-background/70 p-2.5">
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
