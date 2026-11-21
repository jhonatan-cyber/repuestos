"use client"

import { loadList } from "@/lib/api-list"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, formatDate } from "@/lib/format-utils"
import type { Sale } from "@/lib/types"
import {
  Calendar,
  CreditCard,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Wallet,
  DollarSign,
} from "lucide-react"
import { toast } from "@/lib/toast"

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  crédito: "Crédito",
  credito: "Crédito",
  qr: "QR",
}

const STATUS_COLORS: Record<string, string> = {
  completada: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  pendiente: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  cancelada: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
}

interface ClientHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  clientName: string
  onViewSaleDetails: (sale: Sale) => void
}

export function ClientHistoryDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  onViewSaleDetails,
}: ClientHistoryDialogProps) {
  const [sales, setSales] = useState<Sale[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && clientId) {
      fetchClientSales()
    }
  }, [open, clientId])

  const fetchClientSales = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setSales(await loadList<Sale>(`/api/sales?clientId=${encodeURIComponent(clientId)}`))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
      toast.error("Error al cargar el historial de compras")
    } finally {
      setIsLoading(false)
    }
  }

  const totalPurchases = sales.length
  const totalSpent = sales.reduce((sum, sale) => sum + sale.total, 0)
  const averagePerSale = totalPurchases > 0 ? totalSpent / totalPurchases : 0

  // Stats cards
  const statsCards = [
    {
      title: "Total compras",
      value: totalPurchases.toLocaleString(),
      icon: ShoppingBag,
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-50 dark:bg-violet-950/20",
      borderColor: "border-violet-200 dark:border-violet-900",
    },
    {
      title: "Total gastado",
      value: formatCurrency(totalSpent),
      icon: Wallet,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      borderColor: "border-green-200 dark:border-green-900",
    },
    {
      title: "Promedio por venta",
      value: formatCurrency(averagePerSale),
      icon: TrendingUp,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      borderColor: "border-blue-200 dark:border-blue-900",
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] !max-w-[calc(100vw-2rem)] lg:!max-w-6xl overflow-hidden p-0">
        <DialogHeader className="border-b bg-muted/30 pb-6 pr-14">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <Badge
                variant="outline"
                className="w-fit rounded-full px-3 py-1 text-xs tracking-[0.18em] uppercase"
              >
                Historial de cliente
              </Badge>
              <div className="space-y-1">
                <DialogTitle className="text-2xl">Historial de compras - {clientName}</DialogTitle>
                <DialogDescription>
                  {totalPurchases > 0
                    ? `${totalPurchases} ${totalPurchases === 1 ? "compra" : "compras"} registrada${totalPurchases === 1 ? "" : "s"}`
                    : "Sin compras registradas"}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="min-h-0 space-y-6 px-6 py-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w- animate-spin rounded-full border-4 border-muted border-t-primary" />
                <p className="text-sm text-muted-foreground">Cargando historial...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          ) : sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium text-muted-foreground">
                Sin compras registradas
              </p>
              <p className="text-sm text-muted-foreground">
                Este cliente aún no tiene compras en el sistema
              </p>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid gap-3 md:grid-cols-3">
                {statsCards.map((card) => {
                  const Icon = card.icon
                  return (
                    <div
                      key={card.title}
                      className={`rounded-lg border ${card.borderColor} ${card.bgColor} p-4`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">{card.title}</p>
                          <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                        </div>
                        <div className="rounded-full p-2.5 bg-background/70">
                          <Icon className={`h-5 w-5 ${card.color}`} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <Separator />

              {/* Sales Table */}
              <div className="rounded-lg border">
                <div className="overflow-x-auto">
                  <table className="min-w-[800px] w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Fecha
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Total
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Estado
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Método de pago
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Items
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {sales.map((sale) => {
                        const itemCount =
                          sale.items?.reduce((total, item) => total + item.quantity, 0) ?? 0
                        return (
                          <tr
                            key={sale.id}
                            className="hover:bg-muted/30 transition-colors cursor-pointer"
                            onClick={() => onViewSaleDetails(sale)}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="font-mono text-sm">{formatDate(sale.date)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-semibold">{formatCurrency(sale.total)}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[sale.status] || STATUS_COLORS.completada}`}
                              >
                                {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="text-xs">
                                {PAYMENT_METHOD_LABELS[sale.paymentMethod] || sale.paymentMethod}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {sale.items.length}{" "}
                                  {sale.items.length === 1 ? "producto" : "productos"} · {itemCount}{" "}
                                  {itemCount === 1 ? "unidad" : "unidades"}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onViewSaleDetails(sale)
                                }}
                              >
                                Ver detalle
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </DialogBody>
        <DialogFooter className="border-t bg-muted/20 px-6 py-4">
          <DialogClose asChild>
            <Button type="button">Cerrar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
