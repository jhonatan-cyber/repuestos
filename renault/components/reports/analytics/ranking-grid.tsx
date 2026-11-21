"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format-utils"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { TrendingUp, TrendingDown } from "lucide-react"

interface RankingItem {
  name: string
  value: number
  trend?: number
  subtotalItems?: Array<{ date: string; value: number }>
}

interface RankingGridProps {
  topSellers: RankingItem[]
  topClients: RankingItem[]
  topProducts: RankingItem[]
  topSuppliers: RankingItem[]
}

const CATEGORY_COLORS = ["#2563eb", "#059669", "#f59e0b", "#7c3aed"]

function RankingCard({
  title,
  description,
  items,
  formatValue,
}: {
  title: string
  description: string
  items: RankingItem[]
  formatValue: (value: number) => string
}) {
  return (
    <Card className="min-w-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-52 sm:h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={items.slice(0, 5)} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip formatter={(value) => formatValue(value as number)} />
              <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2">
          {items.slice(0, 10).map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 rounded-lg border p-2 text-sm"
            >
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold dark:bg-blue-900">
                  {idx + 1}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium sm:max-w-48">{item.name}</p>
                  {item.trend !== undefined && (
                    <div className="flex items-center gap-1 text-xs">
                      {item.trend >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                      <span className={item.trend >= 0 ? "text-emerald-600" : "text-red-600"}>
                        {item.trend >= 0 ? "+" : ""}
                        {item.trend}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <p className="shrink-0 text-right font-semibold">{formatValue(item.value)}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function RankingGrid({
  topSellers,
  topClients,
  topProducts,
  topSuppliers,
}: RankingGridProps) {
  const summaryCards = [
    {
      label: "Top vendedor",
      value: topSellers[0]
        ? `${topSellers[0].name} · ${formatCurrency(topSellers[0].value)}`
        : "Sin datos",
    },
    {
      label: "Top cliente",
      value: topClients[0]
        ? `${topClients[0].name} · ${formatCurrency(topClients[0].value)}`
        : "Sin datos",
    },
    {
      label: "Top producto",
      value: topProducts[0] ? `${topProducts[0].name} · ${topProducts[0].value} u.` : "Sin datos",
    },
    {
      label: "Top proveedor",
      value: topSuppliers[0]
        ? `${topSuppliers[0].name} · ${formatCurrency(topSuppliers[0].value)}`
        : "Sin datos",
    },
  ]

  const crossCategoryData = [
    { name: "Vendedores", value: topSellers[0]?.value || 0 },
    { name: "Clientes", value: topClients[0]?.value || 0 },
    { name: "Productos", value: topProducts[0]?.value || 0 },
    { name: "Proveedores", value: topSuppliers[0]?.value || 0 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-xl font-bold tracking-tight sm:text-2xl">Análisis y Rankings</h2>
        <p className="text-muted-foreground">Top 10 de rendimiento en cada categoría</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className="min-w-0">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">{card.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="truncate text-sm font-semibold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="min-w-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Comparativo entre categorías</CardTitle>
          <CardDescription className="text-xs">
            Mejor rendimiento de cada tipo de ranking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={crossCategoryData}
                margin={{ top: 10, right: 10, left: 8, bottom: 16 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip
                  formatter={(value, name) =>
                    name === "Productos" ? `${value} unidades` : formatCurrency(value as number)
                  }
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {crossCategoryData.map((_, index) => (
                    <Cell key={index} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <RankingCard
          title="Top Vendedores"
          description="Por volumen de ventas"
          items={topSellers}
          formatValue={(v) => formatCurrency(v)}
        />
        <RankingCard
          title="Top Clientes"
          description="Por gasto total"
          items={topClients}
          formatValue={(v) => formatCurrency(v)}
        />
        <RankingCard
          title="Top Productos"
          description="Por cantidad vendida"
          items={topProducts}
          formatValue={(v) => `${v} unidades`}
        />
        <RankingCard
          title="Top Proveedores"
          description="Por monto de compras"
          items={topSuppliers}
          formatValue={(v) => formatCurrency(v)}
        />
      </div>
    </div>
  )
}
