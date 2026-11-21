"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { logger } from "@/lib/logger"
import { apiClient } from "@/lib/api-client"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// recharts (~400KB) solo en cliente y bajo demanda, no en bundle inicial
const DashboardCharts = dynamic(
  () => import("@/components/dashboard/dashboard-charts").then((m) => m.DashboardCharts),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
        Cargando gráficos...
      </div>
    ),
  },
)

interface ChartData {
  salesByDay: { date: string; total: number; count: number }[]
  topProducts: { name: string; quantity: number; total: number }[]
  salesByCategory: { category: string; total: number }[]
  paymentMethods: { method: string; count: number }[]
  profitByDay: { date: string; total: number }[]
}

const DEFAULT_DATA: ChartData = {
  salesByDay: [],
  topProducts: [],
  salesByCategory: [],
  paymentMethods: [],
  profitByDay: [],
}

export function DashboardChartsSection() {
  const [period, setPeriod] = useState("7days")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [data, setData] = useState<ChartData>(DEFAULT_DATA)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const isCustomRange = period === "custom"

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (isCustomRange) {
      if (startDate) params.set("startDate", startDate)
      if (endDate) params.set("endDate", endDate)
      return params.toString()
    }
    params.set("period", period)
    return params.toString()
  }, [period, isCustomRange, startDate, endDate])

  const activeRangeLabel = useMemo(() => {
    if (isCustomRange) {
      if (!startDate || !endDate) return "Elegí fecha inicio y fin"
      return `${startDate} → ${endDate}`
    }
    const labels: Record<string, string> = {
      week: "Semana actual",
      month: "Mes actual",
      "7days": "Últimos 7 días",
      "30days": "Últimos 30 días",
      "90days": "Últimos 90 días",
      year: "Último año",
    }
    return labels[period] || "Rango activo"
  }, [isCustomRange, startDate, endDate, period])

  useEffect(() => {
    const shouldSkipCustom = isCustomRange && (!startDate || !endDate)
    if (shouldSkipCustom) return

    let cancelled = false
    async function loadCharts() {
      try {
        setHasError(false)
        setIsLoading(true)
        const json = await apiClient<{
          salesByDay?: { date: string; total: number; count: number }[]
          topProducts?: { name: string; quantity: number; total: number }[]
          salesByCategory?: { category: string; total: number }[]
          paymentMethods?: { method: string; count: number }[]
          profitByDay?: { date: string; total: number }[]
        }>(`/api/dashboard/charts?${queryString}`)
        if (!cancelled) {
          setData({
            salesByDay: Array.isArray(json?.salesByDay) ? json.salesByDay : [],
            topProducts: Array.isArray(json?.topProducts) ? json.topProducts : [],
            salesByCategory: Array.isArray(json?.salesByCategory) ? json.salesByCategory : [],
            paymentMethods: Array.isArray(json?.paymentMethods) ? json.paymentMethods : [],
            profitByDay: Array.isArray(json?.profitByDay) ? json.profitByDay : [],
          })
        }
      } catch (err) {
        if (!cancelled) {
          const errorMessage = err instanceof Error ? err.message : "Error desconocido"
          logger.error("Error fetching dashboard charts", { error: errorMessage })
          setHasError(true)
          setData(DEFAULT_DATA)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    loadCharts()
    return () => {
      cancelled = true
    }
  }, [queryString])

  return (
    <div className="space-y-4">
      {/* Stats cards that react to period changes */}
      <DashboardStats period={period} />

      {/* Period selector */}
      <div className="rounded-xl border bg-card/50 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={period === "week" ? "default" : "outline"}
            onClick={() => setPeriod("week")}
          >
            Semana
          </Button>
          <Button
            size="sm"
            variant={period === "month" ? "default" : "outline"}
            onClick={() => setPeriod("month")}
          >
            Mes
          </Button>
          <Button
            size="sm"
            variant={period === "7days" ? "default" : "outline"}
            onClick={() => setPeriod("7days")}
          >
            7 días
          </Button>
          <Button
            size="sm"
            variant={period === "30days" ? "default" : "outline"}
            onClick={() => setPeriod("30days")}
          >
            30 días
          </Button>
          <Button
            size="sm"
            variant={period === "90days" ? "default" : "outline"}
            onClick={() => setPeriod("90days")}
          >
            90 días
          </Button>
          <Button
            size="sm"
            variant={period === "year" ? "default" : "outline"}
            onClick={() => setPeriod("year")}
          >
            Año
          </Button>
          <Button
            size="sm"
            variant={period === "custom" ? "default" : "outline"}
            onClick={() => setPeriod("custom")}
          >
            Rango
          </Button>
          {isCustomRange && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setStartDate("")
                setEndDate("")
              }}
            >
              Limpiar
            </Button>
          )}
        </div>
        {isCustomRange && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Rango activo: <span className="font-medium text-foreground">{activeRangeLabel}</span>
        </p>
      </div>

      {hasError ? (
        <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-6 text-center">
          <p className="font-medium text-destructive">Error al cargar los gráficos</p>
          <p className="mt-1 text-sm text-muted-foreground">
            No se pudieron obtener los datos. Verificá la conexión a la base de datos y reintentá.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              setHasError(false)
            }}
          >
            Reintentar
          </Button>
        </div>
      ) : isLoading ? (
        <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
          Cargando gráficos...
        </div>
      ) : (
        <DashboardCharts
          salesByDay={data.salesByDay}
          topProducts={data.topProducts}
          salesByCategory={data.salesByCategory}
          paymentMethods={data.paymentMethods}
          profitByDay={data.profitByDay}
        />
      )}
    </div>
  )
}
