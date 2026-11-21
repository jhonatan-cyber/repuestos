"use client"

import { Users, Building, DollarSign, TrendingUp } from "lucide-react"

interface SupplierStatsProps {
  stats: {
    totalSuppliers: number
    activeSuppliers: number
    inactiveSuppliers: number
    suppliersWithCompany: number
    totalPurchases: number
    avgPurchases: number
  }
}

export function SupplierStats({ stats }: SupplierStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const { totalSuppliers, activeSuppliers, inactiveSuppliers, totalPurchases } = stats

  const statsData = [
    {
      title: "Total Proveedores",
      value: totalSuppliers.toLocaleString(),
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      borderColor: "border-blue-200 dark:border-blue-900",
    },
    {
      title: "Proveedores Activos",
      value: activeSuppliers.toLocaleString(),
      icon: Building,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      borderColor: "border-green-200 dark:border-green-900",
    },
    {
      title: "Proveedores Inactivos",
      value: inactiveSuppliers.toLocaleString(),
      icon: Users,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-950/20",
      borderColor: "border-red-200 dark:border-red-900",
    },
    {
      title: "Compras Totales",
      value: formatCurrency(totalPurchases),
      icon: DollarSign,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      borderColor: "border-orange-200 dark:border-orange-900",
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
