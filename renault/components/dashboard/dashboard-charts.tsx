"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts"
import { formatCurrency, formatDate } from "@/lib/format-utils"
import { useTheme } from "next-themes"

interface ChartData {
  salesByDay: { date: string; total: number; count: number }[]
  topProducts: { name: string; quantity: number; total: number }[]
  salesByCategory: { category: string; total: number }[]
  paymentMethods: { method: string; count: number }[]
  profitByDay: { date: string; total: number }[]
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6"]
const PAYMENT_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  crédito: "Crédito",
  credito: "Crédito",
  qr: "QR",
}

export function DashboardCharts({
  salesByDay,
  topProducts,
  salesByCategory,
  paymentMethods,
  profitByDay,
}: ChartData) {
  const { theme } = useTheme()
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)

  const axisConfig = {
    stroke: isDark ? "#52525b" : "#e4e4e7",
    fontSize: 11,
    tickLine: false,
    axisLine: false,
  }

  const gridConfig = {
    strokeDasharray: "4 4",
    stroke: isDark ? "#27272a" : "#f4f4f5",
    vertical: false,
  }

  const tooltipConfig = {
    contentStyle: {
      backgroundColor: isDark ? "#111827" : "#ffffff",
      borderRadius: "12px",
      border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
      color: isDark ? "#fff" : "#000",
      boxShadow: isDark
        ? "0 12px 28px -8px rgba(0, 0, 0, 0.55)"
        : "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
      padding: "10px 12px",
    },
    itemStyle: { color: isDark ? "#f9fafb" : "#111827", fontWeight: 600 },
    labelStyle: { color: isDark ? "#d1d5db" : "#4b5563", marginBottom: 6 },
    wrapperStyle: { zIndex: 40 },
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload

      return (
        <div className="rounded-xl border bg-card/95 p-3 shadow-xl backdrop-blur-md min-w-[150px]">
          <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Total
              </span>
              <span className="text-sm font-bold text-foreground">
                {formatCurrency(data.total)}
              </span>
            </div>
            {data.count !== undefined && (
              <div className="flex items-center justify-between gap-4 border-t pt-1.5 mt-1.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Ventas
                </span>
                <span className="text-sm font-bold text-primary">{data.count}</span>
              </div>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  const formattedSalesByDay = salesByDay.map((item) => ({
    ...item,
    date: formatDate(item.date),
  }))

  const formattedProfitByDay = profitByDay.map((item) => ({
    ...item,
    date: formatDate(item.date),
  }))

  const topProductsData = topProducts.slice(0, 5).map((p) => ({
    ...p,
    shortName: p.name.length > 18 ? `${p.name.slice(0, 18)}…` : p.name,
  }))

  const totalByCategory = salesByCategory.reduce((sum, item) => sum + item.total, 0)
  const categoryWithShare = salesByCategory.map((item) => ({
    ...item,
    share: totalByCategory > 0 ? (item.total / totalByCategory) * 100 : 0,
  }))

  const EmptyChart = ({ label }: { label: string }) => (
    <div className="flex h-[300px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
      {label}
    </div>
  )

  const chartDataHasContent =
    formattedSalesByDay.length > 0 ||
    formattedProfitByDay.length > 0 ||
    topProducts.length > 0 ||
    salesByCategory.length > 0

  const CategoryTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="rounded-xl border bg-card/95 p-3 shadow-xl backdrop-blur-md min-w-[150px]">
          <p className="text-xs font-medium text-muted-foreground mb-1">Categoría</p>
          <p className="text-sm font-bold text-foreground mb-2">{data.category}</p>
          <div className="space-y-1.5 border-t pt-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Total
              </span>
              <span className="text-sm font-bold text-foreground">
                {formatCurrency(data.total)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Participación
              </span>
              <span className="text-sm font-bold text-primary">{data.share.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* VENTAS POR DÍA - FULL WIDTH */}
      <Card className="md:col-span-2 border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Tendencia de Ventas</CardTitle>
          <CardDescription>Análisis de ingresos diarios en el período seleccionado</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 min-w-0">
          {formattedSalesByDay.length === 0 ? (
            <EmptyChart label="Sin ventas para el período seleccionado." />
          ) : (
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={formattedSalesByDay}
                  margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...gridConfig} />
                  <XAxis dataKey="date" {...axisConfig} />
                  <YAxis
                    {...axisConfig}
                    width={65}
                    tickFormatter={(value) => formatCurrency(value).replace("Bs.", "")}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    name="Total"
                    dataKey="total"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fill="url(#salesGradient)"
                    dot={{ strokeWidth: 2, r: 4, fill: isDark ? "#18181b" : "#fff" }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: "#3b82f6" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* GANANCIA REAL - 50% */}
      <Card className="border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Utilidad Bruta</CardTitle>
          <CardDescription>Margen de ganancia calculado</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 min-w-0">
          {formattedProfitByDay.length === 0 ? (
            <EmptyChart label="Sin utilidad calculada para este período." />
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={formattedProfitByDay}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...gridConfig} />
                  <XAxis dataKey="date" {...axisConfig} />
                  <YAxis
                    {...axisConfig}
                    width={50}
                    tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    name="Total"
                    dataKey="total"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    fill="url(#profitGradient)"
                    dot={{ strokeWidth: 2, r: 4, fill: isDark ? "#18181b" : "#fff" }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: "#f59e0b" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* VENTAS POR CATEGORÍA - 50% */}
      <Card className="border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Categorías</CardTitle>
          <CardDescription>Distribución de ingresos</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 min-w-0 flex justify-center h-[300px]">
          {salesByCategory.length === 0 ? (
            <EmptyChart label="Sin categorías." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryWithShare}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  innerRadius={60}
                  outerRadius={85}
                  dataKey="total"
                  nameKey="category"
                  paddingAngle={4}
                >
                  {categoryWithShare.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CategoryTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-[10px] text-muted-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* TOP PRODUCTOS - FULL WIDTH */}
      <Card className="md:col-span-2 border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Ranking de Productos</CardTitle>
          <CardDescription>Los 5 productos más rentables</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {topProducts.length === 0 ? (
            <EmptyChart label="Sin datos de productos." />
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topProductsData}
                    layout="vertical"
                    margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
                  >
                    <CartesianGrid {...gridConfig} horizontal={false} vertical />
                    <XAxis
                      type="number"
                      {...axisConfig}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <YAxis dataKey="shortName" type="category" width={100} {...axisConfig} />
                    <Tooltip
                      formatter={(value: unknown) =>
                        formatCurrency(typeof value === "number" ? value : 0)
                      }
                      cursor={{ fill: isDark ? "rgba(55,65,81,0.15)" : "rgba(229,231,235,0.3)" }}
                      {...tooltipConfig}
                    />
                    <Bar dataKey="total" fill="#10b981" radius={[0, 6, 6, 0]} barSize={25} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {topProductsData.map((item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-3 rounded-lg border bg-background/40 p-2"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-600">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.quantity} vendidos</p>
                    </div>
                    <p className="text-sm font-bold">{formatCurrency(item.total)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden hover:shadow-lg transition-all duration-300 md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Métodos de pago</CardTitle>
          <CardDescription className="truncate">Transacciones</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {paymentMethods.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos de métodos de pago.</p>
            ) : (
              paymentMethods.map((method, index) => (
                <div key={method.method} className="rounded-xl border bg-background/60 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {PAYMENT_LABELS[method.method] || method.method}
                  </p>
                  <p
                    className="mt-1 text-2xl font-bold"
                    style={{ color: COLORS[index % COLORS.length] }}
                  >
                    {method.count}
                  </p>
                  <p className="text-xs text-muted-foreground">transacciones</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      {!chartDataHasContent && (
        <div className="md:col-span-2 rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
          No hay datos suficientes para análisis visual en el período seleccionado.
        </div>
      )}
    </div>
  )
}
