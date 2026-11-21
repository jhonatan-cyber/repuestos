"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { formatCurrency, formatDate } from "@/lib/format-utils"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import type { ReportPurchase } from "@/hooks/use-reports"

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"]

interface PurchaseDetailModalProps {
  purchase: ReportPurchase | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PurchaseDetailModal({ purchase, open, onOpenChange }: PurchaseDetailModalProps) {
  if (!purchase) return null

  const itemsForChart = purchase.items.map((item) => ({
    name: item.productName || "Sin nombre",
    quantity: item.quantity,
  }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles de Compra #{purchase.id}</DialogTitle>
          <DialogDescription>
            {formatDate(purchase.date)} • {purchase.supplierName || "Proveedor desconocido"} •{" "}
            {purchase.status}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Info General */}
          <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted p-4">
            <div>
              <p className="text-xs text-muted-foreground">Proveedor</p>
              <p className="font-semibold">{purchase.supplierName || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Comprador</p>
              <p className="font-semibold">{purchase.buyerName || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Estado</p>
              <p className="font-semibold capitalize">{purchase.status}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fecha</p>
              <p className="font-semibold">{formatDate(purchase.date)}</p>
            </div>
          </div>

          {/* Items Detallados */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Productos ({purchase.items.length})</h3>
            <div className="space-y-2 rounded-lg border bg-muted p-4">
              {purchase.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      Cant: {item.quantity} × {formatCurrency(item.price)}
                    </p>
                  </div>
                  <p className="font-semibold">{formatCurrency(item.quantity * item.price)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Gráfico */}
          <div className="rounded-lg border bg-muted p-4">
            <p className="text-xs font-semibold mb-3">Distribución de Items Comprados</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={itemsForChart}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value ?? 0}`}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="quantity"
                >
                  {itemsForChart.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => value} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Resumen Financiero */}
          <div className="rounded-lg border p-4 bg-blue-50 dark:bg-blue-950/30">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatCurrency(purchase.subtotal)}</span>
              </div>
              {purchase.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Impuesto:</span>
                  <span>{formatCurrency(purchase.tax)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span className="text-blue-600">{formatCurrency(purchase.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
