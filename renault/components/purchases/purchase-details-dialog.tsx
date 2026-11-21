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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { formatCurrency, formatDate } from "@/lib/format-utils"
import type { Purchase } from "@/lib/types"
import {
  Banknote,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  Package,
  ShoppingBag,
  User,
} from "lucide-react"

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  qr: "QR",
}

const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  efectivo: <Banknote className="h-5 w-5" />,
  transferencia: <CreditCard className="h-5 w-5" />,
  qr: <CreditCard className="h-5 w-5" />,
}

const STATUS_STYLES: Record<string, string> = {
  recibida: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  pendiente: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  cancelada: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
}

interface PurchaseDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchase: Purchase | null
  onExportPdf: (purchase: Purchase) => void
}

export function PurchaseDetailsDialog({
  open,
  onOpenChange,
  purchase,
  onExportPdf,
}: PurchaseDetailsDialogProps) {
  if (!purchase) return null

  const creditAwarePurchase = purchase as Purchase & {
    purchaseType?: "contado" | "credito"
    initialPayment?: number
    initialDebt?: number
    debtAmount?: number
  }
  const purchaseCode = purchase.id.toString().slice(0, 8).toUpperCase()
  const itemCount = purchase.items?.reduce((total, item) => total + item.quantity, 0) ?? 0
  const paymentLabel = PAYMENT_METHOD_LABELS[purchase.paymentMethod] || purchase.paymentMethod
  const isCreditPurchase =
    creditAwarePurchase.purchaseType === "credito" || (creditAwarePurchase.debtAmount || 0) > 0
  const initialPayment = Number(creditAwarePurchase.initialPayment || 0)
  const initialDebt = Number(creditAwarePurchase.initialDebt || 0)
  const currentDebt = Number(creditAwarePurchase.debtAmount || 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] !max-w-[calc(100vw-2rem)] lg:!max-w-5xl overflow-hidden p-0">
        <DialogHeader className="border-b bg-muted/30 pb-6 pr-14">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <Badge
                variant="outline"
                className="w-fit rounded-full px-3 py-1 text-xs tracking-[0.18em] uppercase"
              >
                Compra #{purchaseCode}
              </Badge>
              <div className="space-y-1">
                <DialogTitle className="text-2xl">Detalle de compra</DialogTitle>
                <DialogDescription>
                  Revisá los productos adquiridos y el resumen de la operación.
                </DialogDescription>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 sm:items-end">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[purchase.status] || STATUS_STYLES.recibida}`}
              >
                {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
              </span>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {formatDate(purchase.date)}
              </div>
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="min-h-0 space-y-6 px-6 py-5">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.9fr)_360px]">
            <div className="space-y-6">
              {/* Información general */}
              <section className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">Información general</h3>
                    <p className="text-sm text-muted-foreground">Datos principales de la compra.</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <InfoCard
                    icon={<Building2 className="h-4 w-4" />}
                    label="Proveedor"
                    value={purchase.supplierName || "Sin proveedor"}
                  />
                  <InfoCard
                    icon={<User className="h-4 w-4" />}
                    label="Comprador"
                    value={purchase.buyerName || "Sin comprador"}
                  />
                  <InfoCard
                    icon={
                      PAYMENT_ICONS[purchase.paymentMethod] || <CreditCard className="h-4 w-4" />
                    }
                    label="Método de pago"
                    value={paymentLabel}
                  />
                  <InfoCard
                    icon={<CreditCard className="h-4 w-4" />}
                    label="Tipo de compra"
                    value={isCreditPurchase ? "A crédito" : "Al contado"}
                  />
                  <InfoCard
                    icon={<Calendar className="h-4 w-4" />}
                    label="Fecha"
                    value={formatDate(purchase.date)}
                  />
                </div>
              </section>

              {/* Productos */}
              <section className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">Productos adquiridos</h3>
                    <p className="text-sm text-muted-foreground">
                      {purchase.items.length}{" "}
                      {purchase.items.length === 1 ? "producto" : "productos"} · {itemCount}{" "}
                      {itemCount === 1 ? "unidad" : "unidades"} en total
                    </p>
                  </div>
                </div>

                <div className="grid min-0 grid-cols-[1fr_80px_120px_130px] gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span>Producto</span>
                  <span className="text-right">Cant.</span>
                  <span className="text-right">P. Unitario</span>
                  <span className="text-right">Subtotal</span>
                </div>
                <div className="divide-y">
                  {purchase.items?.map((item, index) => (
                    <div
                      key={`${item.productId}-${index}`}
                      className="grid min-0 grid-cols-[1fr_80px_120px_130px] gap-3 px-4 py-4 text-sm"
                    >
                      <div className="min-w-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="truncate font-medium">
                              {item.productName || "Producto sin nombre"}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{item.productName || "Producto sin nombre"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <span className="text-right tabular-nums text-muted-foreground">
                        {item.quantity}
                      </span>
                      <span className="text-right tabular-nums text-muted-foreground">
                        {formatCurrency(item.price)}
                      </span>
                      <span className="text-right tabular-nums font-semibold">
                        {formatCurrency(item.quantity * item.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6 xl:sticky xl:top-0 xl:self-start">
              {/* Resumen */}
              <section className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <Banknote className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">Resumen de compra</h3>
                    <p className="text-sm text-muted-foreground">Totales de la operación.</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <SummaryRow label="Subtotal" value={formatCurrency(purchase.subtotal)} />
                  <SummaryRow label="Impuestos" value={formatCurrency(purchase.tax)} />
                  {isCreditPurchase && (
                    <>
                      <SummaryRow
                        label="Monto inicial abonado"
                        value={formatCurrency(initialPayment)}
                      />
                      <SummaryRow label="Deuda inicial" value={formatCurrency(initialDebt)} />
                      <SummaryRow
                        label="Deuda actual"
                        value={formatCurrency(currentDebt)}
                        valueClassName="font-semibold text-amber-700"
                      />
                    </>
                  )}
                  <Separator />
                  <SummaryRow
                    label="Total"
                    value={formatCurrency(purchase.total)}
                    valueClassName="text-lg font-bold text-primary"
                    labelClassName="font-semibold text-foreground"
                  />
                </div>
              </section>

              {/* Estado */}
              <section className="rounded-2xl border bg-muted/30 p-5 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Estado de registro
                </h3>
                <div className="mt-4 space-y-3 text-sm">
                  <p className="rounded-xl bg-background px-4 py-3 text-foreground shadow-sm">
                    Fecha: <span className="font-semibold">{formatDate(purchase.date)}</span>
                  </p>
                  <p className="rounded-xl bg-background px-4 py-3 text-foreground shadow-sm">
                    Proveedor: <span className="font-semibold">{purchase.supplierName || "—"}</span>
                  </p>
                  <p className="rounded-xl bg-background px-4 py-3 text-foreground shadow-sm">
                    Pago: <span className="font-semibold">{paymentLabel}</span>
                  </p>
                  <p className="rounded-xl bg-background px-4 py-3 text-foreground shadow-sm">
                    Estado:{" "}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[purchase.status] || STATUS_STYLES.recibida}`}
                    >
                      {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                    </span>
                  </p>
                </div>
              </section>
            </aside>
          </div>
        </DialogBody>

        <DialogFooter className="border-t bg-muted/20 px-6 py-4">
          <div className="flex w-full justify-center gap-3">
            <Button variant="outline" onClick={() => onExportPdf(purchase)}>
              <FileText className="mr-2 h-4 w-4" />
              Exportar a PDF
            </Button>
            <DialogClose asChild>
              <Button type="button" className="min-w-[140px]">
                Cerrar
              </Button>
            </DialogClose>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Helpers ──────────────────────────────────────────────

interface InfoCardProps {
  icon: React.ReactNode
  label: string
  value: string
  helper?: string
  highlight?: boolean
}

function InfoCard({ icon, label, value, helper, highlight = false }: InfoCardProps) {
  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <div className="text-primary">{icon}</div>
        <span className="font-medium">{label}</span>
      </div>
      <p className={highlight ? "font-semibold text-primary" : "font-semibold text-foreground"}>
        {value}
      </p>
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
