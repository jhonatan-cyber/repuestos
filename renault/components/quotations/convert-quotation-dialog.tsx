"use client"
import { logger } from "@/lib/logger"
import { useState, useEffect } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ShoppingCart, AlertCircle } from "lucide-react"
import { formatCurrency } from "@/lib/format-utils"
import type { Quotation } from "@/lib/types"
import { sileo } from "sileo"
import { QUOTATION_MESSAGES } from "@/lib/constants/messages"
import { apiClient } from "@/lib/api-client"
import { loadList } from "@/lib/api-list"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ConvertQuotationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quotation: Quotation
  onSuccess: () => void
}

function formatMoneyInput(value: number): string {
  if (!value) return ""
  return new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

function parseMoneyInput(raw: string): number {
  const cleaned = raw.replace(/\s/g, "").replace(/\./g, "").replace(",", ".")
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

function paymentMethodLabel(method: string): string {
  const key = String(method || "").toLowerCase()
  if (key === "transferencia") return "Transferencia"
  if (key === "qr") return "QR"
  return "Efectivo"
}

export function ConvertQuotationDialog({
  open,
  onOpenChange,
  quotation,
  onSuccess,
}: ConvertQuotationDialogProps) {
  const [isConverting, setIsConverting] = useState(false)
  const [hasOpenCash, setHasOpenCash] = useState(false)
  const [checkingCash, setCheckingCash] = useState(false)

  const [saleType, setSaleType] = useState("contado")
  const [paymentMethod, setPaymentMethod] = useState("efectivo")
  const [initialPaymentMethod, setInitialPaymentMethod] = useState("efectivo")
  const [initialPayment, setInitialPayment] = useState(0)

  const isCreditSale = saleType === "credito"
  const creditInitialPayment = Math.min(Math.max(initialPayment || 0, 0), quotation.total)
  const creditDebtAmount = Math.max(quotation.total - creditInitialPayment, 0)

  const needsClient = !quotation.clientId && !quotation.externalClientName

  useEffect(() => {
    if (!open) return
    setSaleType("contado")
    setPaymentMethod("efectivo")
    setInitialPaymentMethod("efectivo")
    setInitialPayment(0)

    const fetchCashStatus = async () => {
      setCheckingCash(true)
      try {
        const records = await loadList<{ status?: string }>("/api/cash-records", apiClient)
        setHasOpenCash(records.some((record) => record?.status === "open"))
      } catch {
        setHasOpenCash(false)
      } finally {
        setCheckingCash(false)
      }
    }

    fetchCashStatus()
  }, [open])

  async function handleConvert() {
    if (!hasOpenCash) {
      sileo.error({
        title: "Caja cerrada",
        description: "Tenes que tener una caja abierta para convertir la cotizacion a venta.",
      })
      onOpenChange(false)
      return
    }

    if (isCreditSale && needsClient) {
      sileo.error({
        title: "Falta cliente",
        description:
          "La cotizacion no tiene cliente registrado y no se puede convertir a venta a credito.",
      })
      return
    }

    try {
      setIsConverting(true)

      await apiClient(`/api/quotations/${quotation.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saleType,
          paymentMethod: isCreditSale ? initialPaymentMethod : paymentMethod,
          initialPaymentMethod: isCreditSale ? initialPaymentMethod : undefined,
          initialPayment: isCreditSale ? creditInitialPayment : 0,
        }),
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      logger.error("Error converting quotation", {
        error: error instanceof Error ? error.message : error,
      })
      sileo.error({
        title: QUOTATION_MESSAGES.error.convert,
        description: error instanceof Error ? error.message : "No se pudo completar la operacion.",
      })
    } finally {
      setIsConverting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="flex max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-xl flex-col overflow-hidden p-0 sm:max-h-[88vh]">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-elevated p-3">
              <ShoppingCart className="h-7 w-7 text-primary" />
            </div>
            <AlertDialogTitle className="text-center text-xl sm:text-2xl">
              Convertir a Venta
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Formaliza la cotizacion #{quotation.id.toString().slice(0, 8).toUpperCase()} como una
              venta completada.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="mt-4 space-y-4 rounded-2xl border bg-elevated p-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-foreground">Cliente:</span>
              <span className="min-w-0 truncate text-right font-500">
                {quotation.clientName || quotation.externalClientName || "Sin cliente"}
              </span>
            </div>

            <div className="border-foreground border-t" />

            <div className="space-y-2">
              <p className="text-foreground text-xs font-500 uppercase tracking-wide">Productos</p>
              <div className="divide-foreground divide-y rounded-2xl bg-elevated px-4 py-3">
                {quotation.items?.slice(0, 4).map((item, index) => (
                  <div
                    key={`${item.productId}-${index}`}
                    className="flex items-center justify-between py-2 text-sm first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="truncate text-foreground">
                        {item.productName || "Producto sin nombre"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-foreground">x{item.quantity}</span>
                      <span className="w-24 text-right font-500 text-foreground">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  </div>
                ))}
                {quotation.items && quotation.items.length > 4 && (
                  <div className="py-2 text-center text-xs text-foreground">
                    y {quotation.items.length - 4} productos mas...
                  </div>
                )}
              </div>
            </div>

            <div className="border-foreground border-t" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de venta</Label>
                <Select value={saleType} onValueChange={setSaleType}>
                  <SelectTrigger className="h-11 w-full rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contado">Al contado</SelectItem>
                    <SelectItem value="credito">A credito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!isCreditSale && (
                <div className="space-y-2">
                  <Label>Metodo de pago</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="h-11 w-full rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="qr">QR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {isCreditSale && (
                <>
                  <div className="space-y-2">
                    <Label>Metodo de pago del monto inicial</Label>
                    <Select value={initialPaymentMethod} onValueChange={setInitialPaymentMethod}>
                      <SelectTrigger className="h-11 w-full rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                        <SelectItem value="qr">QR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Monto inicial abonado (opcional)</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      className="h-11 w-full rounded-xl"
                      value={formatMoneyInput(creditInitialPayment)}
                      onChange={(event) =>
                        setInitialPayment(Math.max(0, parseMoneyInput(event.target.value)))
                      }
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground">
                      Si no ingresas monto, la deuda queda por el total.
                    </p>
                  </div>
                </>
              )}
            </div>

            {isCreditSale && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-foreground">Monto inicial</span>
                  <span className="font-500">{formatCurrency(creditInitialPayment)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-foreground">Monto a deuda</span>
                  <span className="font-500">{formatCurrency(creditDebtAmount)}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground font-500">Monto total:</span>
              <span className="text-primary text-lg font-700">
                {formatCurrency(quotation.total)}
              </span>
            </div>
            {!isCreditSale && (
              <div className="text-xs text-foreground/80">
                Metodo:{" "}
                <span className="font-medium text-foreground">
                  {paymentMethodLabel(paymentMethod)}
                </span>
              </div>
            )}
          </div>

          {!checkingCash && !hasOpenCash && (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-foreground bg-elevated p-3 text-foreground">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-sm">Necesitas tener una caja abierta para convertir.</p>
            </div>
          )}
        </div>

        <AlertDialogFooter className="gap-2 border-t bg-background px-4 py-3 sm:justify-center sm:px-6">
          <AlertDialogCancel disabled={isConverting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConvert}
            disabled={isConverting || checkingCash || !hasOpenCash}
          >
            {isConverting ? "Procesando..." : "Confirmar Venta"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
