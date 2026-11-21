"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react"
import Link from "next/link"

interface LowStockProduct {
  id: string
  code: string
  name: string
  brand: string
  model: string
  category: string
  categoryId: string
  purchasePrice: number
  salePrice: number
  stock: number
  minimumStock: number
  unit: string
  supplierId: string | null
  supplierName: string
  createdAt: string
  image?: string | null
  lastSyncedAt?: string | null
}

interface LowStockAlertsProps {
  products: LowStockProduct[]
}

export function LowStockAlerts({ products }: LowStockAlertsProps) {
  if (products.length === 0) {
    return (
      <Card className="border-border/40 bg-card/50 backdrop-blur-sm shadow-sm flex flex-col items-center justify-center p-12 h-[450px]">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
          <ShieldCheck className="w-8 h-8 text-emerald-500" />
        </div>
        <CardTitle className="text-xl font-semibold mb-2">Inventario saludable</CardTitle>
        <p className="text-sm text-muted-foreground text-center max-w-[250px]">
          Todos los productos están sobre su mínimo.
        </p>
      </Card>
    )
  }

  const getStockStatus = (stock: number, minimumStock: number) => {
    const percentage = (stock / minimumStock) * 100
    if (percentage <= 0)
      return {
        label: "Sin stock",
        badge: "bg-rose-500/10 text-rose-500 border-rose-500/20",
        text: "text-rose-500",
      }
    if (percentage <= 50)
      return {
        label: "Crítico",
        badge: "bg-rose-500/10 text-rose-500 border-rose-500/20",
        text: "text-rose-500",
      }
    if (percentage <= 100)
      return {
        label: "Bajo",
        badge: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        text: "text-amber-500",
      }
    return {
      label: "Normal",
      badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      text: "text-emerald-500",
    }
  }

  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group h-[450px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/40 bg-muted/10 shrink-0">
        <div className="space-y-1.5 flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">Alertas de Stock</CardTitle>
            <CardDescription className="text-xs truncate">Productos a reponer</CardDescription>
          </div>
        </div>
        <Link
          href="/inventory"
          className="text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors"
        >
          Inventario
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="p-4 overflow-y-auto scrollbar-custom flex-1">
        <div className="space-y-3">
          {products.map((product) => {
            const status = getStockStatus(product.stock, product.minimumStock)
            return (
              <div
                key={product.id}
                className="group/item flex items-center justify-between p-3.5 border border-border/40 rounded-xl bg-background/50 hover:bg-muted/50 hover:border-primary/30 transition-all duration-300 hover:shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm text-foreground/90 group-hover/item:text-primary transition-colors truncate max-w-[150px]">
                      {product.name}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-medium px-2 py-0 border ${status.badge}`}
                    >
                      {status.label}
                    </Badge>
                  </div>
                  <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 truncate">
                    <span className="opacity-70">Cód:</span>{" "}
                    <span className="text-foreground/70">{product.code}</span>
                  </p>
                </div>
                <div className="text-right pl-4 shrink-0">
                  <div className={`text-sm font-bold tabular-nums ${status.text}`}>
                    {product.stock}{" "}
                    <span className="text-[10px] font-medium opacity-70">{product.unit}</span>
                  </div>
                  <p className="text-[10px] font-medium text-muted-foreground mt-0.5">
                    Min:{" "}
                    <span className="text-foreground/70 font-semibold">{product.minimumStock}</span>
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
