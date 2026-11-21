"use client"

import { useEffect, useState } from "react"
import { logger } from "@/lib/logger"
import { apiClient } from "@/lib/api-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Package, AlertTriangle, TrendingUp } from "lucide-react"
import { formatCurrency, formatStatNumber } from "@/lib/format-utils"
import { cn } from "@/lib/utils"

interface DashboardStatsData {
  periodSalesTotal: number
  periodSalesCount: number
  totalProducts: number
  lowStockCount: number
}

interface DashboardStatsProps {
  period?: string
}

const DEFAULT_STATS: DashboardStatsData = {
  periodSalesTotal: 0,
  periodSalesCount: 0,
  totalProducts: 0,
  lowStockCount: 0,
}

export function DashboardStats({ period = "7days" }: DashboardStatsProps) {
  const [stats, setStats] = useState<DashboardStatsData>(DEFAULT_STATS)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadStats() {
      try {
        setHasError(false)
        setIsLoading(true)
        const json = await apiClient<typeof DEFAULT_STATS>(`/api/dashboard/stats?period=${period}`)
        if (!cancelled) {
          setStats({
            periodSalesTotal: json.periodSalesTotal ?? 0,
            periodSalesCount: json.periodSalesCount ?? 0,
            totalProducts: json.totalProducts ?? 0,
            lowStockCount: json.lowStockCount ?? 0,
          })
        }
      } catch (err) {
        if (!cancelled) {
          const errorMessage = err instanceof Error ? err.message : "Error desconocido"
          logger.error("Error fetching dashboard stats", { error: errorMessage })
          setHasError(true)
          setStats(DEFAULT_STATS)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadStats()
    return () => {
      cancelled = true
    }
  }, [period])

  const lowStockRate =
    stats.totalProducts > 0 ? (stats.lowStockCount / stats.totalProducts) * 100 : 0

  // Map period to a label for the stat card
  const periodLabel: Record<string, string> = {
    today: "de hoy",
    week: "semana",
    month: "mes",
    "7days": "7 días",
    "30days": "30 días",
    "90days": "90 días",
    year: "año",
    custom: "rango",
  }

  const salesLabel = periodLabel[period] || "período"

  if (hasError) {
    return (
      <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-6 text-center">
        <p className="font-medium text-destructive">Error al cargar las estadísticas</p>
        <p className="mt-1 text-sm text-muted-foreground">
          No se pudieron obtener los datos. Verificá la conexión a la base de datos y reintentá.
        </p>
      </div>
    )
  }

  const statsCards = [
    {
      title: `Ventas ${salesLabel}`,
      value: isLoading ? "-" : formatCurrency(stats.periodSalesTotal),
      subtitle: isLoading
        ? "Cargando..."
        : `${stats.periodSalesCount} ${stats.periodSalesCount === 1 ? "venta" : "ventas"}`,
      icon: DollarSign,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "group-hover:border-emerald-500/30",
      glow: "group-hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]",
      trend: stats.periodSalesCount > 0 ? "Activo" : "Sin mov.",
    },
    {
      title: "Productos en inventario",
      value: isLoading ? "-" : formatStatNumber(stats.totalProducts),
      subtitle: isLoading ? "Cargando..." : "Stock total",
      icon: Package,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "group-hover:border-blue-500/30",
      glow: "group-hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]",
      trend: isLoading ? "-" : stats.totalProducts > 0 ? "Disponible" : "Vacío",
    },
    {
      title: "Stock bajo",
      value: isLoading ? "-" : formatStatNumber(stats.lowStockCount),
      subtitle: isLoading
        ? "Cargando..."
        : stats.lowStockCount > 0
          ? "Requiere atención"
          : "Saludable",
      icon: AlertTriangle,
      color: stats.lowStockCount > 0 ? "text-amber-500" : "text-emerald-500",
      bgColor: stats.lowStockCount > 0 ? "bg-amber-500/10" : "bg-emerald-500/10",
      borderColor:
        stats.lowStockCount > 0
          ? "group-hover:border-amber-500/30"
          : "group-hover:border-emerald-500/30",
      glow:
        stats.lowStockCount > 0
          ? "group-hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]"
          : "group-hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]",
      trend: isLoading ? "-" : `${lowStockRate.toFixed(1)}% del inventario`,
    },
  ]

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 animate-slow-fade">
      {statsCards.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card
            key={index}
            className={cn(
              "relative overflow-hidden group transition-all duration-500 border-border/40 bg-card/50 backdrop-blur-sm",
              stat.borderColor,
              stat.glow,
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-xs sm:text-sm font-semibold text-muted-foreground tracking-wide">
                {stat.title}
              </CardTitle>
              <div
                className={cn(
                  "p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110",
                  stat.bgColor,
                )}
              >
                <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", stat.color)} />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground/90 mt-2">
                {stat.value}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span
                  className={cn(
                    "flex items-center text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full bg-background/50",
                    index === 2
                      ? stats.lowStockCount > 0
                        ? "text-amber-500"
                        : "text-emerald-500"
                      : "text-emerald-500",
                  )}
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span className="truncate max-w-[88px]">{stat.trend}</span>
                </span>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate">
                  {stat.subtitle}
                </p>
              </div>
            </CardContent>
            <div
              className={cn(
                "absolute -right-8 -bottom-8 w-32 h-32 rounded-full blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100",
                stat.bgColor,
              )}
            />
          </Card>
        )
      })}
    </div>
  )
}
