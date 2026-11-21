"use client"

import { Users, TrendingUp, DollarSign, ShoppingCart } from "lucide-react"

interface ClientStatsProps {
  stats: {
    totalClients: number
    activeClients: number
    totalSales: number
    averageTicket: number
  }
}

export function ClientStats({ stats }: ClientStatsProps) {
  const { totalClients, activeClients, totalSales, averageTicket } = stats
  const statsData = [
    {
      title: "Total Clientes",
      value: totalClients.toLocaleString(),
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      borderColor: "border-blue-200 dark:border-blue-900",
    },
    {
      title: "Activos",
      value: activeClients.toLocaleString(),
      icon: TrendingUp,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      borderColor: "border-green-200 dark:border-green-900",
    },
    {
      title: "Ventas Totales",
      value: `$${totalSales.toLocaleString()}`,
      icon: DollarSign,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      borderColor: "border-purple-200 dark:border-purple-900",
    },
    {
      title: "Ticket Promedio",
      value: `$${Math.round(averageTicket).toLocaleString()}`,
      icon: ShoppingCart,
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
