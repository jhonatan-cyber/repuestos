"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { formatCurrency, formatDate } from "@/lib/format-utils"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"

interface ReportSaleItem {
  productId: string
  productName: string
  quantity: number
  price: number
  subtotal: number
}
interface ReportSale {
  id: string
  date: string
  clientName: string
  sellerName: string
  subtotal: number
  discount: number
  tax?: number
  total: number
  paymentMethod?: string
  status?: string
  items?: ReportSaleItem[]
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"]

interface SaleDetailModalProps {
  sale: ReportSale | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SaleDetailModal({ sale, open, onOpenChange }: SaleDetailModalProps) {
  if (!sale) return null

  const saleItems = sale.items ?? []

  const itemsForChart = saleItems.map((item, idx) => ({
    name: item.productName || "Sin nombre",
    quantity: item.quantity,
    value: item.subtotal,
  }))

  // Calcular tax (16% del subtotal)
  const tax = sale.tax ?? (sale.subtotal - sale.discount) * 0.16

  const summaryData = [
    { name: "Subtotal", value: sale.subtotal },
    { name: "Descuento", value: -sale.discount },
    { name: "Tax", value: tax },
    { name: "Total", value: sale.total },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles de Venta #{sale.id}</DialogTitle>
          <DialogDescription>
            {formatDate(sale.date)} • {sale.clientName || "Cliente desconocido"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Info General */}
          <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted p-4">
            <div>
              <p className="text-xs text-muted-foreground">Cliente</p>
              <p className="font-semibold">{sale.clientName || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Vendedor</p>
              <p className="font-semibold">{sale.sellerName || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Método de pago</p>
              <p className="font-semibold capitalize">{sale.paymentMethod || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Estado</p>
              <p className="font-semibold capitalize">{sale.status || "-"}</p>
            </div>
          </div>

          {/* Items Detallados */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Productos ({saleItems.length})</h3>
            <div className="space-y-2 rounded-lg border bg-muted p-4">
              {saleItems.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      Cant: {item.quantity} × {formatCurrency(item.price)}
                    </p>
                  </div>
                  <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-2 gap-4">
            {/* Pie Chart de Items */}
            <div className="rounded-lg border bg-muted p-4">
              <p className="text-xs font-semibold mb-3">Distribución de Items</p>
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

            {/* Bar Chart de Desglose */}
            <div className="rounded-lg border bg-muted p-4">
              <p className="text-xs font-semibold mb-3">Desglose Financiero</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={summaryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Resumen Financiero */}
          <div className="rounded-lg border p-4 bg-emerald-50 dark:bg-emerald-950/30">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatCurrency(sale.subtotal)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Descuento:</span>
                  <span>-{formatCurrency(sale.discount)}</span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Impuesto:</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span className="text-emerald-600">{formatCurrency(sale.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
