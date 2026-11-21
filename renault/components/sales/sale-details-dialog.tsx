"use client"

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
  FileText,
  Receipt,
  ShoppingBag,
  User,
  UserCheck,
  AlertCircle,
} from "lucide-react"

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  crédito: "Crédito",
  credito: "Crédito",
  qr: "QR",
  mixto: "Pago mixto",
}

const STATUS_COLORS: Record<string, string> = {
  completada: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  pendiente: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  cancelada: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
}

interface SaleDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sale: Sale | null
  onExportPdf: (sale: Sale) => void
}

export function SaleDetailsDialog({
  open,
  onOpenChange,
  sale,
  onExportPdf,
}: SaleDetailsDialogProps) {
  if (!sale) return null

  const saleCode = sale.id.toString().slice(0, 8).toUpperCase()
  const clientLabel = sale.clientName || "Cliente no registrado"
  const itemCount = sale.items?.reduce((total, item) => total + item.quantity, 0) ?? 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92vh] w-[calc(100vw-1rem)] !max-w-[calc(100vw-1rem)] flex-col overflow-hidden p-0 sm:h-[90vh] sm:w-[calc(100vw-2rem)] sm:!max-w-[calc(100vw-2rem)] lg:!max-w-6xl">
        <DialogHeader className="border-b bg-muted/30 px-4 py-3 pr-12 sm:px-6 sm:py-5 sm:pr-14">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="space-y-2">
              <Badge
                variant="outline"
                className="hidden w-fit rounded-full px-2.5 py-0.5 text-[10px] tracking-[0.14em] uppercase sm:inline-flex sm:px-3 sm:py-1 sm:text-xs sm:tracking-[0.18em]"
              >
                Venta #{saleCode}
              </Badge>
              <div className="space-y-0.5 sm:space-y-1">
                <DialogTitle className="text-lg sm:text-2xl">Detalle de venta</DialogTitle>
                <DialogDescription className="hidden text-xs sm:block sm:text-sm">
                  Revisá los productos vendidos y el resumen de la operación.
                </DialogDescription>
              </div>
            </div>

            <div className="hidden flex-col items-start gap-1.5 sm:flex sm:items-end sm:gap-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium sm:px-3 sm:py-1 sm:text-xs ${STATUS_COLORS[sale.status] || STATUS_COLORS.completada}`}
              >
                {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground sm:gap-2 sm:text-sm">
                <Calendar className="h-4 w-4" />
                Realizada el {formatDate(sale.date)}
              </div>
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:space-y-6 sm:px-6 sm:py-5">
          <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1.9fr)_360px]">
            <div className="space-y-6">
              <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-center gap-2">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">Información general</h3>
                    <p className="text-sm text-muted-foreground">Datos principales de la venta.</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <InfoCard
                    icon={<User className="h-4 w-4" />}
                    label="Cliente"
                    value={clientLabel}
                  />
                  <InfoCard
                    icon={<UserCheck className="h-4 w-4" />}
                    label="Vendedor"
                    value={sale.sellerName || "Sin vendedor asignado"}
                  />
                  <InfoCard
                    icon={<CreditCard className="h-4 w-4" />}
                    label="Forma de pago"
                    value={PAYMENT_METHOD_LABELS[sale.paymentMethod] || sale.paymentMethod}
                  />
                  <InfoCard
                    icon={<Calendar className="h-4 w-4" />}
                    label="Fecha"
                    value={formatDate(sale.date)}
                  />
                  <InfoCard
                    icon={<AlertCircle className="h-4 w-4" />}
                    label="Estado"
                    value={sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                    badgeClassName={STATUS_COLORS[sale.status] || STATUS_COLORS.completada}
                  />
                </div>
              </section>

              <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-center gap-2">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">Productos vendidos</h3>
                    <p className="text-sm text-muted-foreground">
                      {sale.items.length} {sale.items.length === 1 ? "producto" : "productos"} ·{" "}
                      {itemCount} {itemCount === 1 ? "unidad" : "unidades"}
                    </p>
                  </div>
                </div>

                <div className="divide-y md:hidden">
                  {sale.items?.map((item, index) => (
                    <div key={`${item.productId}-${index}`} className="space-y-2 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {item.productName || "Producto sin nombre"}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded-lg bg-muted/30 px-2 py-1.5 text-center">
                          <p className="text-[10px] uppercase text-muted-foreground">Cant.</p>
                          <p className="font-medium text-foreground">{item.quantity}</p>
                        </div>
                        <div className="rounded-lg bg-muted/30 px-2 py-1.5 text-center">
                          <p className="text-[10px] uppercase text-muted-foreground">Precio</p>
                          <p className="font-medium text-foreground">
                            {formatCurrency(item.price)}
                          </p>
                        </div>
                        <div className="rounded-lg bg-muted/30 px-2 py-1.5 text-center">
                          <p className="text-[10px] uppercase text-muted-foreground">Subtotal</p>
                          <p className="font-semibold text-foreground">
                            {formatCurrency(item.subtotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden md:block">
                  <div className="grid min-0 grid-cols-[1fr_96px_140px_160px] gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <span>Producto</span>
                    <span className="text-right">Cant.</span>
                    <span className="text-right">Precio</span>
                    <span className="text-right">Subtotal</span>
                  </div>
                  <div className="divide-y">
                    {sale.items?.map((item, index) => (
                      <div
                        key={`${item.productId}-${index}`}
                        className="grid min-0 grid-cols-[1fr_96px_140px_160px] gap-3 px-4 py-4 text-sm"
                      >
                        <div className="min-0 min-w-0">
                          <p className="truncate font-medium">
                            {item.productName || "Producto sin nombre"}
                          </p>
                        </div>
                        <span className="text-right text-muted-foreground">{item.quantity}</span>
                        <span className="text-right text-muted-foreground">
                          {formatCurrency(item.price)}
                        </span>
                        <span className="text-right font-semibold">
                          {formatCurrency(item.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            <aside className="space-y-6 xl:sticky xl:top-0 xl:self-start">
              <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-center gap-2">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">Resumen comercial</h3>
                    <p className="text-sm text-muted-foreground">Totales y ajustes aplicados.</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <SummaryRow label="Subtotal" value={formatCurrency(sale.subtotal)} />
                  <SummaryRow label="Impuestos" value={formatCurrency(sale.tax)} />
                  <SummaryRow
                    label="Descuentos"
                    value={`-${formatCurrency(sale.discount)}`}
                    valueClassName="text-rose-600"
                  />
                  <Separator />
                  <SummaryRow
                    label="Total"
                    value={formatCurrency(sale.total)}
                    valueClassName="text-lg font-bold text-primary"
                    labelClassName="font-semibold text-foreground"
                  />
                </div>
              </section>

              {/* Payment Splits Display */}
              {(sale.paymentMethod === "mixto" ||
                (sale.paymentSplits && sale.paymentSplits.length > 0)) && (
                <section className="rounded-2xl border bg-amber-50 p-5 shadow-sm dark:bg-amber-950/20">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                    Detalle de pago mixto
                  </h3>
                  <div className="mt-3 space-y-2 text-sm">
                    {sale.paymentSplits?.map((split, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg bg-background px-3 py-2 shadow-sm"
                      >
                        <span className="text-muted-foreground">
                          {PAYMENT_METHOD_LABELS[split.method] || split.method}
                        </span>
                        <span className="font-semibold text-foreground">
                          {formatCurrency(split.amount)}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between rounded-lg bg-amber-100 px-3 py-2 dark:bg-amber-900/30">
                      <span className="font-medium text-amber-800 dark:text-amber-300">Total</span>
                      <span className="font-bold text-amber-900 dark:text-amber-200">
                        {formatCurrency(sale.total)}
                      </span>
                    </div>
                  </div>
                </section>
              )}

              {/* Notes Display */}
              {sale.notes && sale.notes.trim() && (
                <section className="rounded-2xl border bg-blue-50 p-5 shadow-sm dark:bg-blue-950/20">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                    Observaciones
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                    {sale.notes}
                  </p>
                </section>
              )}
            </aside>
          </div>
        </DialogBody>
        <DialogFooter className="border-t bg-muted/20 px-6 py-4">
          <div className="flex w-full justify-center gap-3">
            <Button variant="outline" onClick={() => onExportPdf(sale)}>
              <FileText className="mr-2 h-4 w-4" />
              Exportar a PDF
            </Button>
            <DialogClose asChild>
              <Button type="button">Cerrar</Button>
            </DialogClose>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface InfoCardProps {
  icon: React.ReactNode
  label: string
  value: string
  helper?: string
  badgeClassName?: string
}

function InfoCard({ icon, label, value, helper, badgeClassName }: InfoCardProps) {
  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <div className="text-primary">{icon}</div>
        <span className="font-medium">{label}</span>
      </div>
      {badgeClassName ? (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${badgeClassName}`}
        >
          {value}
        </span>
      ) : (
        <p className="font-semibold text-foreground">{value}</p>
      )}
      {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  )
}

interface SummaryRowProps {
  label: string
  value: string
  labelClassName?: string
  valueClassName?: string
}

function SummaryRow({ label, value, labelClassName, valueClassName }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={labelClassName || "text-muted-foreground"}>{label}</span>
      <span className={valueClassName || "font-medium text-foreground"}>{value}</span>
    </div>
  )
}
