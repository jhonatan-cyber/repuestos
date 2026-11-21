"use client"

import { useCallback, useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
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
import { exportQuotationPDF } from "@/lib/export"
import { QuotationStatusBadge } from "./quotation-status-badge"
import { SupplierRequestDialog } from "./supplier-request-dialog"
import type { Quotation, SupplierRequest } from "@/lib/types"
import {
  Calendar,
  FileText,
  Receipt,
  Send,
  ShoppingBag,
  Ticket,
  User,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react"

interface QuotationDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quotation: Quotation | null
  onSupplierRequestSuccess?: () => void
}

export function QuotationDetailsDialog({
  open,
  onOpenChange,
  quotation,
  onSupplierRequestSuccess,
}: QuotationDetailsDialogProps) {
  const [supplierRequestOpen, setSupplierRequestOpen] = useState(false)
  const [supplierRequests, setSupplierRequests] = useState<SupplierRequest[]>([])
  const [isLoadingRequests, setIsLoadingRequests] = useState(false)

  const loadSupplierRequests = useCallback(async (quotationId: string) => {
    setIsLoadingRequests(true)
    try {
      const data = await apiClient<SupplierRequest[] | { data?: SupplierRequest[] }>(
        `/api/quotations/${quotationId}/supplier-requests`,
      )
      setSupplierRequests(
        Array.isArray(data) ? data : ((data as { data?: SupplierRequest[] })?.data ?? []),
      )
    } catch {
      // silencio
    } finally {
      setIsLoadingRequests(false)
    }
  }, [])

  useEffect(() => {
    if (open && quotation) {
      loadSupplierRequests(String(quotation.id))
    }
  }, [open, quotation, loadSupplierRequests])

  if (!quotation) return null

  const quotationCode = quotation.id.toString().slice(0, 8).toUpperCase()
  const clientLabel =
    quotation.clientName || quotation.externalClientName || "Sin cliente registrado"
  const itemCount = quotation.items?.reduce((total, item) => total + item.quantity, 0) ?? 0

  // Verificar si la cotización está vencida
  const isExpired = new Date(quotation.validUntil) < new Date(new Date().toDateString())
  const displayStatus = isExpired && quotation.status === "pendiente" ? "vencida" : quotation.status

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)]! lg:!max-w-6xl overflow-hidden p-0">
        <DialogHeader className="border-b bg-muted/30 pb-6 pr-14">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <Badge
                variant="outline"
                className="w-fit rounded-full px-3 py-1 text-xs tracking-[0.18em] uppercase"
              >
                Cotización #{quotationCode}
              </Badge>
              <div className="space-y-1">
                <DialogTitle className="text-2xl">Detalle de cotización</DialogTitle>
                <DialogDescription>
                  Revisá el cliente, los productos y el resumen comercial antes de continuar.
                </DialogDescription>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 sm:items-end">
              <QuotationStatusBadge status={displayStatus} />
              {isExpired && quotation.status === "pendiente" && (
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Esta cotización ha vencido</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Emitida el {formatDate(quotation.date || quotation.createdAt)}
              </div>
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="min-h-0 space-y-6 px-6 py-5">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.9fr)_360px]">
            <div className="space-y-6">
              <section className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">Información general</h3>
                    <p className="text-sm text-muted-foreground">
                      Datos principales de la cotización.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <InfoCard
                    icon={<User className="h-4 w-4" />}
                    label="Cliente"
                    value={clientLabel}
                    helper={quotation.clientId ? "Cliente registrado" : "Cliente no registrado"}
                  />
                  <InfoCard
                    icon={<UserCheck className="h-4 w-4" />}
                    label="Vendedor"
                    value={quotation.sellerName || "Sin vendedor asignado"}
                  />
                  <InfoCard
                    icon={<Calendar className="h-4 w-4" />}
                    label="Válida hasta"
                    value={formatDate(quotation.validUntil)}
                  />
                  <InfoCard
                    icon={<Ticket className="h-4 w-4" />}
                    label="Venta asociada"
                    value={
                      quotation.convertedToSaleId
                        ? `#${quotation.convertedToSaleId.toString().slice(0, 8)}`
                        : "Todavía no convertida"
                    }
                    helper={
                      quotation.convertedToSaleId
                        ? "Conversión realizada"
                        : "Disponible para convertir"
                    }
                    highlight={Boolean(quotation.convertedToSaleId)}
                  />
                </div>
              </section>

              <section className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">Productos cotizados</h3>
                    <p className="text-sm text-muted-foreground">
                      {quotation.items.length}{" "}
                      {quotation.items.length === 1 ? "producto" : "productos"} · {itemCount}{" "}
                      {itemCount === 1 ? "unidad" : "unidades"}
                    </p>
                  </div>
                </div>

                <div className="grid min-0 grid-cols-[1fr_96px_140px_160px] gap-3 border-0 border-0 border-0 border-b border-0 bg-0 bg-0 bg-muted/40 px-0 px-4 py-0 py-3 text-0 text-xs font-0 font-semibold uppercase tracking-0 tracking-wide text-0 text-0 text-0 text-0 text-muted-foreground">
                  <span>Producto</span>
                  <span className="text-0 text-0 text-0 text-right">Cant.</span>
                  <span className="text-0 text-0 text-0 text-right">Precio</span>
                  <span className="text-0 text-0 text-0 text-right">Subtotal</span>
                </div>
                <div className="divide-0 divide-y">
                  {quotation.items?.map((item, index) => (
                    <div
                      key={`${item.productId}-${index}`}
                      className="grid min-0 grid-cols-[1fr_96px_140px_160px] gap-3 px-0 px-4 py-0 py-4 text-0 text-sm"
                    >
                      <div className="min-0 min-w-0">
                        <p className="truncate font-0 font-0 font-medium text-0 text-foreground">
                          {item.productName || "Producto sin nombre"}
                        </p>
                        <p className="text-0 text-0 text-xs text-0 text-muted-foreground">
                          ID: {item.productId.toString().slice(0, 8)}
                        </p>
                      </div>
                      <span className="text-0 text-0 text-0 text-right text-0 text-0 text-0 text-muted-foreground">
                        {item.quantity}
                      </span>
                      <span className="text-0 text-0 text-0 text-right text-0 text-0 text-0 text-muted-foreground">
                        {formatCurrency(item.price)}
                      </span>
                      <span className="text-0 text-0 text-0 text-right font-0 font-0 font-semibold text-0 text-foreground">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="space-y-6 xl:sticky xl:top-0 xl:self-start">
              <section className="rounded-2xl border bg-card p-5 shadow-sm">
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
                  <SummaryRow label="Subtotal" value={formatCurrency(quotation.subtotal)} />
                  <SummaryRow label="Impuestos" value={formatCurrency(quotation.tax)} />
                  <SummaryRow
                    label="Descuentos"
                    value={`-${formatCurrency(quotation.discount)}`}
                    valueClassName="text-rose-600"
                  />
                  <Separator />
                  <SummaryRow
                    label="Total"
                    value={formatCurrency(quotation.total)}
                    valueClassName="text-lg font-bold text-primary"
                    labelClassName="font-semibold text-foreground"
                  />
                </div>
              </section>

              <section className="rounded-2xl border bg-muted/30 p-5 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Estado de registro
                </h3>
                <div className="mt-4 space-y-3 text-sm">
                  <p className="rounded-xl bg-background px-4 py-3 text-foreground shadow-sm">
                    Creada el{" "}
                    <span className="font-semibold">{formatDate(quotation.createdAt)}</span>
                  </p>
                  <p className="rounded-xl bg-background px-4 py-3 text-foreground shadow-sm">
                    Cliente:{" "}
                    <span className="font-semibold">
                      {quotation.clientId ? "registrado" : "no registrado"}
                    </span>
                  </p>
                  <p className="rounded-xl bg-background px-4 py-3 text-foreground shadow-sm">
                    Conversión:{" "}
                    <span className="font-semibold">
                      {quotation.convertedToSaleId ? "completada" : "pendiente"}
                    </span>
                  </p>
                </div>
              </section>

              {supplierRequests.length > 0 && (
                <section className="rounded-2xl border bg-muted/30 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Solicitudes a proveedores
                  </h3>
                  <div className="mt-4 space-y-2 text-sm">
                    {supplierRequests.map((req) => (
                      <div
                        key={String(req.id)}
                        className="rounded-xl bg-background px-4 py-3 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium truncate">
                            {req.supplierName || "Proveedor"}
                          </span>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              req.status === "enviado"
                                ? "bg-blue-100 text-blue-700"
                                : req.status === "respondido"
                                  ? "bg-green-100 text-green-700"
                                  : req.status === "recibido"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>
                        {req.notes && (
                          <p className="mt-1 text-xs text-muted-foreground truncate">{req.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </aside>
          </div>
        </DialogBody>
        <DialogFooter className="border-t bg-muted/20 px-6 py-4">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              type="button"
              variant="outline"
              className="min-w-[160px]"
              onClick={() => exportQuotationPDF(quotation)}
            >
              Exportar PDF
            </Button>
            <DialogClose asChild>
              <Button type="button" className="min-w-[160px]">
                Cerrar
              </Button>
            </DialogClose>
          </div>
        </DialogFooter>

        <SupplierRequestDialog
          open={supplierRequestOpen}
          onOpenChange={(v) => {
            setSupplierRequestOpen(v)
            if (!v && quotation) loadSupplierRequests(String(quotation.id))
          }}
          quotationId={String(quotation.id)}
          onSuccess={onSupplierRequestSuccess}
        />
      </DialogContent>
    </Dialog>
  )
}

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
