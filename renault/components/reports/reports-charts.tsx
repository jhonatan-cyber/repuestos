"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  Area,
  ComposedChart,
  Line,
  LineChart,
} from "recharts"
import { formatCurrency, formatDate } from "@/lib/format-utils"
import { useTheme } from "next-themes"
import type { ReactNode } from "react"

interface ReportsChartsProps {
  activeTab?: "all" | "sales" | "purchases" | "expenses"
  salesData: Array<{
    date: string
    total: number
    status?: string
    items?: Array<{ productName: string; quantity: number; subtotal: number }>
  }>
  purchasesData: Array<{
    date: string
    total: number
    items?: Array<{ productName: string; quantity: number; price: number }>
  }>
  expensesData: Array<{ date: string; amount: number; category?: string }>
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"]

function ChartViewport({ height, children }: { height: number; children: ReactNode }) {
  return (
    <div
      className="w-full min-w-0"
      style={{ width: "100%", minWidth: 0, height, minHeight: height }}
    >
      {children}
    </div>
  )
}

function toLabel(date: string) {
  return formatDate(date)
}

function aggregateByDay<T extends { date: string }>(items: T[], valueKey: keyof T) {
  const map = new Map<string, number>()
  items.forEach((item) => {
    const key = item.date.slice(0, 10)
    map.set(key, (map.get(key) || 0) + Number(item[valueKey] || 0))
  })

  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, value]) => ({ date, dateLabel: toLabel(date), value }))
}

function accumulateSeries(data: Array<{ date: string; dateLabel: string; value: number }>) {
  let running = 0
  return data.map((item) => {
    running += item.value
    return {
      ...item,
      cumulative: running,
    }
  })
}

function aggregateTopProductsBySalesDay(
  salesData: Array<{
    date: string
    items?: Array<{ productName: string; quantity: number; subtotal: number }>
  }>,
) {
  const map = new Map<string, Array<{ productName: string; quantity: number; subtotal: number }>>()

  salesData.forEach((sale) => {
    const key = sale.date.slice(0, 10)
    const bucket = map.get(key) || []
    const byProduct = new Map(bucket.map((item) => [item.productName, { ...item }]))

    for (const item of sale.items || []) {
      const existing = byProduct.get(item.productName)
      if (existing) {
        existing.quantity += item.quantity
        existing.subtotal += item.subtotal
      } else {
        byProduct.set(item.productName, {
          productName: item.productName,
          quantity: item.quantity,
          subtotal: item.subtotal,
        })
      }
    }

    map.set(
      key,
      Array.from(byProduct.values()).sort(
        (a, b) => b.quantity - a.quantity || b.subtotal - a.subtotal,
      ),
    )
  })

  return map
}

function groupAllByDay(
  salesData: Array<{ date: string; total: number }>,
  purchasesData: Array<{ date: string; total: number }>,
  expensesData: Array<{ date: string; amount: number }>,
) {
  const map = new Map<
    string,
    { date: string; sales: number; purchases: number; expenses: number }
  >()
  const ensure = (date: string) => {
    const key = date.slice(0, 10)
    if (!map.has(key)) map.set(key, { date: key, sales: 0, purchases: 0, expenses: 0 })
    return map.get(key)!
  }

  salesData.forEach((s) => (ensure(s.date).sales += s.total))
  purchasesData.forEach((p) => (ensure(p.date).purchases += p.total))
  expensesData.forEach((e) => (ensure(e.date).expenses += e.amount))

  return Array.from(map.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((row) => ({
      ...row,
      dateLabel: toLabel(row.date),
      net: row.sales - row.purchases - row.expenses,
    }))
}

function aggregateExpensesByCategory(expensesData: Array<{ amount: number; category?: string }>) {
  const map = new Map<string, number>()
  expensesData.forEach((expense) => {
    const key = expense.category?.trim() || "Sin categor�a"
    map.set(key, (map.get(key) || 0) + expense.amount)
  })

  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export function ReportsCharts({
  activeTab = "all",
  salesData,
  purchasesData,
  expensesData,
}: ReportsChartsProps) {
  const { theme } = useTheme()
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)

  const axisStyle = {
    tickLine: false,
    axisLine: false,
    fontSize: 12,
    stroke: isDark ? "#6b7280" : "#9ca3af",
  }

  const tooltipStyle = {
    backgroundColor: isDark ? "#111827" : "#ffffff",
    border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
    borderRadius: 10,
    color: isDark ? "#f9fafb" : "#111827",
    boxShadow: isDark ? "0 12px 28px -8px rgba(0,0,0,0.55)" : "0 10px 25px -5px rgba(0,0,0,0.12)",
  }

  const CustomTooltip = ({
    active,
    payload,
    label,
    formatter,
  }: {
    active?: boolean
    payload?: Array<{ value: number; name: string; color?: string }>
    label?: ReactNode
    formatter?: (value: number) => string
  }) => {
    if (!active || !payload?.length) return null

    return (
      <div style={{ ...tooltipStyle, minWidth: 180, padding: "10px 12px" }}>
        <p
          style={{
            marginBottom: 6,
            fontSize: 12,
            fontWeight: 700,
            color: isDark ? "#d1d5db" : "#4b5563",
          }}
        >
          {label}
        </p>
        {payload.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13 }}
          >
            <span
              style={{ fontWeight: 600, color: item.color || (isDark ? "#f9fafb" : "#111827") }}
            >
              {item.name}
            </span>
            <span style={{ fontWeight: 800, color: isDark ? "#f9fafb" : "#111827" }}>
              {formatter ? formatter(item.value) : item.value}
            </span>
          </div>
        ))}
      </div>
    )
  }

  const validSalesData = salesData.filter((sale) => sale.status !== "cancelada")
  const trendData = groupAllByDay(validSalesData, purchasesData, expensesData)
  const salesTrend = aggregateByDay(validSalesData, "total")
  const purchasesTrend = aggregateByDay(purchasesData, "total")
  const expensesTrend = aggregateByDay(expensesData, "amount")
  const salesCumulativeTrend = accumulateSeries(salesTrend)
  const purchasesCumulativeTrend = accumulateSeries(purchasesTrend)
  const expenseCategories = aggregateExpensesByCategory(expensesData).slice(0, 6)
  const topProductsBySalesDay = aggregateTopProductsBySalesDay(validSalesData)

  const maxAll = Math.max(...trendData.map((d) => Math.max(d.sales, d.purchases, d.expenses)), 0)
  const netValues = trendData.map((d) => d.net)
  const maxNet = Math.max(...netValues, 0)
  const minNet = Math.min(...netValues, 0)

  const hasSales = validSalesData.length > 0
  const hasPurchases = purchasesData.length > 0
  const hasExpenses = expensesData.length > 0
  const hasAll = trendData.length > 0

  const TopSalesDaysTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean
    payload?: Array<{ value: number }>
    label?: ReactNode
  }) => {
    if (!active || !payload?.length || typeof label !== "string") return null

    const day = salesTrend.find((item) => item.dateLabel === label)
    const products = day ? (topProductsBySalesDay.get(day.date) || []).slice(0, 3) : []

    return (
      <div style={{ ...tooltipStyle, minWidth: 220, padding: "10px 12px" }}>
        <p
          style={{
            marginBottom: 6,
            fontSize: 12,
            fontWeight: 700,
            color: isDark ? "#d1d5db" : "#4b5563",
          }}
        >
          {label}
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            fontSize: 13,
            marginBottom: products.length ? 8 : 0,
          }}
        >
          <span style={{ fontWeight: 600, color: isDark ? "#f9fafb" : "#111827" }}>
            Total vendido
          </span>
          <span style={{ fontWeight: 800, color: isDark ? "#f9fafb" : "#111827" }}>
            {formatCurrency(Number(payload[0].value || 0))}
          </span>
        </div>
        {products.length ? (
          <div style={{ borderTop: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`, paddingTop: 8 }}>
            <p
              style={{
                margin: "0 0 6px",
                fontSize: 12,
                fontWeight: 700,
                color: isDark ? "#d1d5db" : "#4b5563",
              }}
            >
              Productos vendidos
            </p>
            {products.map((product, index) => (
              <div
                key={`${product.productName}-${index}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  fontSize: 12,
                  marginTop: 4,
                }}
              >
                <span style={{ color: isDark ? "#f9fafb" : "#111827" }}>{product.productName}</span>
                <span style={{ color: isDark ? "#d1d5db" : "#4b5563", whiteSpace: "nowrap" }}>
                  {product.quantity} u.
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  const TrendBreakdownTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean
    payload?: Array<{ value: number; name: string; color?: string }>
    label?: ReactNode
  }) => {
    if (!active || !payload?.length) return null

    return (
      <div style={{ ...tooltipStyle, minWidth: 220, padding: "10px 12px" }}>
        <p
          style={{
            marginBottom: 8,
            fontSize: 12,
            fontWeight: 700,
            color: isDark ? "#d1d5db" : "#4b5563",
          }}
        >
          {label}
        </p>
        {payload.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              fontSize: 13,
              marginBottom: 4,
            }}
          >
            <span
              style={{ fontWeight: 600, color: item.color || (isDark ? "#f9fafb" : "#111827") }}
            >
              {item.name}
            </span>
            <span style={{ fontWeight: 800 }}>{formatCurrency(item.value)}</span>
          </div>
        ))}
        <div
          style={{
            borderTop: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
            paddingTop: 8,
            marginTop: 6,
            fontSize: 11,
            color: isDark ? "#9ca3af" : "#6b7280",
          }}
        >
          Comparaci�n diaria del movimiento operativo.
        </div>
      </div>
    )
  }

  const AccumulatedTooltip = ({
    active,
    payload,
    label,
    title,
  }: {
    active?: boolean
    payload?: Array<{ value: number }>
    label?: ReactNode
    title: string
  }) => {
    if (!active || !payload?.length) return null

    return (
      <div style={{ ...tooltipStyle, minWidth: 220, padding: "10px 12px" }}>
        <p
          style={{
            marginBottom: 4,
            fontSize: 12,
            fontWeight: 700,
            color: isDark ? "#d1d5db" : "#4b5563",
          }}
        >
          {label}
        </p>
        <p
          style={{
            marginBottom: 8,
            fontSize: 11,
            fontWeight: 700,
            color: isDark ? "#9ca3af" : "#6b7280",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {title}
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13 }}>
          <span style={{ fontWeight: 600, color: isDark ? "#f9fafb" : "#111827" }}>Acumulado</span>
          <span style={{ fontWeight: 800 }}>{formatCurrency(Number(payload[0].value || 0))}</span>
        </div>
      </div>
    )
  }

  const RankingTooltip = ({
    active,
    payload,
    label,
    title,
    valueLabel,
  }: {
    active?: boolean
    payload?: Array<{ value: number }>
    label?: ReactNode
    title: string
    valueLabel: string
  }) => {
    if (!active || !payload?.length) return null

    return (
      <div style={{ ...tooltipStyle, minWidth: 220, padding: "10px 12px" }}>
        <p
          style={{
            marginBottom: 4,
            fontSize: 12,
            fontWeight: 700,
            color: isDark ? "#d1d5db" : "#4b5563",
          }}
        >
          {label}
        </p>
        <p
          style={{
            marginBottom: 8,
            fontSize: 11,
            fontWeight: 700,
            color: isDark ? "#9ca3af" : "#6b7280",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {title}
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13 }}>
          <span style={{ fontWeight: 600, color: isDark ? "#f9fafb" : "#111827" }}>
            {valueLabel}
          </span>
          <span style={{ fontWeight: 800 }}>{formatCurrency(Number(payload[0].value || 0))}</span>
        </div>
      </div>
    )
  }

  const PieBreakdownTooltip = ({
    active,
    payload,
    total,
    title,
  }: {
    active?: boolean
    payload?: Array<{ value: number; name: string; color?: string }>
    total: number
    title: string
  }) => {
    if (!active || !payload?.length) return null

    const item = payload[0]
    const percentage = total > 0 ? (item.value / total) * 100 : 0

    return (
      <div style={{ ...tooltipStyle, minWidth: 220, padding: "10px 12px" }}>
        <p
          style={{
            marginBottom: 4,
            fontSize: 12,
            fontWeight: 700,
            color: isDark ? "#d1d5db" : "#4b5563",
          }}
        >
          {title}
        </p>
        <p
          style={{
            marginBottom: 8,
            fontSize: 13,
            fontWeight: 700,
            color: item.color || (isDark ? "#f9fafb" : "#111827"),
          }}
        >
          {item.name}
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            fontSize: 13,
            marginBottom: 4,
          }}
        >
          <span style={{ color: isDark ? "#d1d5db" : "#4b5563" }}>Monto</span>
          <span style={{ fontWeight: 800 }}>{formatCurrency(item.value)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13 }}>
          <span style={{ color: isDark ? "#d1d5db" : "#4b5563" }}>Participaci�n</span>
          <span style={{ fontWeight: 800 }}>{percentage.toFixed(1)}%</span>
        </div>
      </div>
    )
  }

  const NetProfitTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean
    payload?: Array<{
      value: number
      payload?: { sales: number; purchases: number; expenses: number; net: number }
    }>
    label?: ReactNode
  }) => {
    if (!active || !payload?.length) return null

    const row = payload[0]?.payload
    if (!row) return null

    const positive = row.net >= 0

    return (
      <div style={{ ...tooltipStyle, minWidth: 220, padding: "10px 12px" }}>
        <p
          style={{
            marginBottom: 4,
            fontSize: 12,
            fontWeight: 700,
            color: isDark ? "#d1d5db" : "#4b5563",
          }}
        >
          {label}
        </p>
        <p
          style={{
            marginBottom: 8,
            fontSize: 11,
            fontWeight: 700,
            color: positive ? "#6366f1" : "#ef4444",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {positive ? "Utilidad positiva" : "P�rdida neta"}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            fontSize: 13,
            marginBottom: 4,
          }}
        >
          <span style={{ color: isDark ? "#d1d5db" : "#4b5563" }}>Ventas</span>
          <span style={{ fontWeight: 700 }}>{formatCurrency(row.sales)}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            fontSize: 13,
            marginBottom: 4,
          }}
        >
          <span style={{ color: isDark ? "#d1d5db" : "#4b5563" }}>Compras</span>
          <span style={{ fontWeight: 700 }}>{formatCurrency(row.purchases)}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            fontSize: 13,
            marginBottom: 8,
          }}
        >
          <span style={{ color: isDark ? "#d1d5db" : "#4b5563" }}>Gastos</span>
          <span style={{ fontWeight: 700 }}>{formatCurrency(row.expenses)}</span>
        </div>

        <div
          style={{
            borderTop: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
            paddingTop: 8,
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            fontSize: 13,
          }}
        >
          <span style={{ fontWeight: 700, color: isDark ? "#f9fafb" : "#111827" }}>
            Utilidad neta
          </span>
          <span style={{ fontWeight: 800, color: positive ? "#6366f1" : "#ef4444" }}>
            {formatCurrency(row.net)}
          </span>
        </div>
      </div>
    )
  }

  if (activeTab === "sales") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="min-w-0 border-border bg-card md:col-span-2" data-report-chart="trend">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Acumulado de ventas</CardTitle>
            <CardDescription>
              C�mo crecen las ventas acumuladas a lo largo del per�odo
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {!hasSales ? (
              <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                Sin datos para graficar
              </div>
            ) : (
              <ChartViewport height={300}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <ComposedChart
                    data={salesCumulativeTrend}
                    margin={{ top: 10, right: 10, left: 6, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="salesOnlyFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="4 4"
                      stroke={isDark ? "#374151" : "#e5e7eb"}
                      vertical={false}
                    />
                    <XAxis dataKey="dateLabel" {...axisStyle} />
                    <YAxis {...axisStyle} width={92} tickFormatter={(v) => formatCurrency(v)} />
                    <Tooltip content={<AccumulatedTooltip title="Ventas acumuladas al d?a" />} />
                    <Area
                      type="monotone"
                      dataKey="cumulative"
                      stroke="none"
                      fill="url(#salesOnlyFill)"
                      name="Acumulado"
                      legendType="none"
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulative"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={false}
                      name="Acumulado"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartViewport>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 border-border bg-card" data-report-chart="distribution">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top d�as de venta</CardTitle>
            <CardDescription>
              Ranking de los d�as con mayor facturaci�n y productos clave
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {!hasSales ? (
              <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                Sin datos para graficar
              </div>
            ) : (
              <ChartViewport height={300}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart
                    layout="vertical"
                    data={[...salesTrend].sort((a, b) => b.value - a.value).slice(0, 7)}
                    margin={{ top: 10, right: 10, left: 18, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="4 4"
                      stroke={isDark ? "#374151" : "#e5e7eb"}
                      horizontal={false}
                    />
                    <XAxis type="number" {...axisStyle} tickFormatter={(v) => formatCurrency(v)} />
                    <YAxis type="category" dataKey="dateLabel" {...axisStyle} width={70} />
                    <Tooltip content={<TopSalesDaysTooltip />} cursor={false} />
                    <Bar dataKey="value" fill="#10b981" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartViewport>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (activeTab === "purchases") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="min-w-0 border-border bg-card md:col-span-2" data-report-chart="trend">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Acumulado de compras</CardTitle>
            <CardDescription>
              C�mo crecen las compras acumuladas a lo largo del per�odo
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {!hasPurchases ? (
              <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                Sin datos para graficar
              </div>
            ) : (
              <ChartViewport height={300}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <LineChart
                    data={purchasesCumulativeTrend}
                    margin={{ top: 10, right: 10, left: 6, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="4 4"
                      stroke={isDark ? "#374151" : "#e5e7eb"}
                      vertical={false}
                    />
                    <XAxis dataKey="dateLabel" {...axisStyle} />
                    <YAxis {...axisStyle} width={92} tickFormatter={(v) => formatCurrency(v)} />
                    <Tooltip content={<AccumulatedTooltip title="Compras acumuladas al d?a" />} />
                    <Line
                      type="monotone"
                      dataKey="cumulative"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={false}
                      name="Acumulado"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartViewport>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 border-border bg-card" data-report-chart="distribution">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top d�as de compra</CardTitle>
            <CardDescription>Ranking de los d�as con mayor compra</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {!hasPurchases ? (
              <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                Sin datos para graficar
              </div>
            ) : (
              <ChartViewport height={300}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart
                    layout="vertical"
                    data={[...purchasesTrend].sort((a, b) => b.value - a.value).slice(0, 7)}
                    margin={{ top: 10, right: 10, left: 18, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="4 4"
                      stroke={isDark ? "#374151" : "#e5e7eb"}
                      horizontal={false}
                    />
                    <XAxis type="number" {...axisStyle} tickFormatter={(v) => formatCurrency(v)} />
                    <YAxis type="category" dataKey="dateLabel" {...axisStyle} width={70} />
                    <Tooltip
                      content={
                        <RankingTooltip title="D?a con mayor compra" valueLabel="Total comprado" />
                      }
                      cursor={false}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartViewport>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (activeTab === "expenses") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="min-w-0 border-border bg-card md:col-span-2" data-report-chart="trend">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Gastos por categor�a</CardTitle>
            <CardDescription>Las categor�as m�s pesadas del per�odo</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {!hasExpenses ? (
              <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                Sin datos para graficar
              </div>
            ) : (
              <ChartViewport height={300}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart
                    layout="vertical"
                    data={expenseCategories}
                    margin={{ top: 10, right: 10, left: 26, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="4 4"
                      stroke={isDark ? "#374151" : "#e5e7eb"}
                      horizontal={false}
                    />
                    <XAxis type="number" {...axisStyle} tickFormatter={(v) => formatCurrency(v)} />
                    <YAxis type="category" dataKey="name" {...axisStyle} width={110} />
                    <Tooltip
                      content={
                        <RankingTooltip
                          title="Categor?a con mayor gasto"
                          valueLabel="Total gastado"
                        />
                      }
                      cursor={false}
                    />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                      {expenseCategories.map((item, index) => (
                        <Cell key={item.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartViewport>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 border-border bg-card" data-report-chart="distribution">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribuci�n de gastos</CardTitle>
            <CardDescription>Reparto por categor�a</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {!hasExpenses ? (
              <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                Sin datos para graficar
              </div>
            ) : (
              <ChartViewport height={300}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={expenseCategories}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={64}
                      outerRadius={96}
                      paddingAngle={3}
                    >
                      {expenseCategories.map((item, index) => (
                        <Cell key={item.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={
                        <PieBreakdownTooltip
                          total={expenseCategories.reduce((sum, item) => sum + item.value, 0)}
                          title="Distribuci?n de gastos"
                        />
                      }
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartViewport>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 border-border bg-card" data-report-chart="net">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Evoluci�n diaria de gastos</CardTitle>
            <CardDescription>Variaci�n diaria del gasto registrado</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {!hasExpenses ? (
              <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                Sin datos para graficar
              </div>
            ) : (
              <ChartViewport height={300}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart
                    data={expensesTrend}
                    margin={{ top: 10, right: 10, left: 6, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="4 4"
                      stroke={isDark ? "#374151" : "#e5e7eb"}
                      vertical={false}
                    />
                    <XAxis dataKey="dateLabel" {...axisStyle} />
                    <YAxis {...axisStyle} width={92} tickFormatter={(v) => formatCurrency(v)} />
                    <Tooltip
                      content={
                        <RankingTooltip
                          title="Gasto registrado en el d?a"
                          valueLabel="Monto del d?a"
                        />
                      }
                      cursor={false}
                    />
                    <Bar dataKey="value" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartViewport>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="min-w-0 border-border bg-card" data-report-chart="trend">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Evoluci�n diaria</CardTitle>
          <CardDescription>Tendencia de ventas, compras y gastos</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {!hasAll ? (
            <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              Sin datos para graficar
            </div>
          ) : (
            <ChartViewport height={300}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: 6, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke={isDark ? "#374151" : "#e5e7eb"}
                    vertical={false}
                  />
                  <XAxis dataKey="dateLabel" {...axisStyle} />
                  <YAxis
                    {...axisStyle}
                    width={92}
                    tickFormatter={(v) => formatCurrency(v)}
                    domain={[0, maxAll > 0 ? maxAll * 1.15 : 100]}
                  />
                  <Tooltip content={<TrendBreakdownTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="none"
                    fill="url(#salesFill)"
                    name="Ventas"
                    legendType="none"
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={false}
                    name="Ventas"
                  />
                  <Line
                    type="monotone"
                    dataKey="purchases"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={false}
                    name="Compras"
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={false}
                    name="Gastos"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartViewport>
          )}
        </CardContent>
      </Card>

      <Card className="min-w-0 border-border bg-card" data-report-chart="distribution">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Distribuci�n</CardTitle>
          <CardDescription>Proporci�n total por tipo</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {!hasAll ? (
            <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              Sin datos para graficar
            </div>
          ) : (
            <ChartViewport height={300}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: "Ventas",
                        value: validSalesData.reduce((sum, x) => sum + x.total, 0),
                      },
                      {
                        name: "Compras",
                        value: purchasesData.reduce((sum, x) => sum + x.total, 0),
                      },
                      { name: "Gastos", value: expensesData.reduce((sum, x) => sum + x.amount, 0) },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={64}
                    outerRadius={96}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {[0, 1, 2].map((index) => (
                      <Cell key={index} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={
                      <PieBreakdownTooltip
                        total={
                          validSalesData.reduce((sum, x) => sum + x.total, 0) +
                          purchasesData.reduce((sum, x) => sum + x.total, 0) +
                          expensesData.reduce((sum, x) => sum + x.amount, 0)
                        }
                        title="Distribucion total del periodo"
                      />
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartViewport>
          )}
        </CardContent>
      </Card>

      <Card className="min-w-0 border-border bg-card md:col-span-2" data-report-chart="net">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Utilidad neta por d�a</CardTitle>
          <CardDescription>Ventas - Compras - Gastos</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {!hasAll ? (
            <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              Sin datos para graficar
            </div>
          ) : (
            <ChartViewport height={260}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={trendData} margin={{ top: 10, right: 10, left: 6, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke={isDark ? "#374151" : "#e5e7eb"}
                    vertical={false}
                  />
                  <XAxis dataKey="dateLabel" {...axisStyle} />
                  <YAxis
                    {...axisStyle}
                    width={92}
                    domain={[minNet < 0 ? minNet * 1.15 : 0, maxNet > 0 ? maxNet * 1.15 : 100]}
                    tickFormatter={(v) => formatCurrency(v)}
                  />
                  <Tooltip content={<NetProfitTooltip />} cursor={false} />
                  <Bar dataKey="net" activeBar={false} radius={[6, 6, 6, 6]}>
                    {trendData.map((entry, index) => (
                      <Cell key={`metric-${index}`} fill={entry.net >= 0 ? "#6366f1" : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartViewport>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
