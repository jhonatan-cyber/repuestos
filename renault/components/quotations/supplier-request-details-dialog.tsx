"use client"

import { useCallback, useState } from "react"
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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDate } from "@/lib/format-utils"
import { exportSupplierRequestPDF } from "@/lib/export"
import { PrintPreviewDialog } from "@/components/sales/print-preview-dialog"
import { PrintSupplierRequest } from "./print-supplier-request"
import type { SupplierRequestWithProducts } from "@/lib/types"
import { Building2, FileText, Package, Printer, FileDown, Loader2, Calendar } from "lucide-react"

const statusConfig: Record<string, { label: string; color: string }> = {
  pendiente: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700" },
  enviado: { label: "Enviado", color: "bg-blue-100 text-blue-700" },
  recibido: { label: "Recibido", color: "bg-purple-100 text-purple-700" },
  respondido: { label: "Respondido", color: "bg-green-100 text-green-700" },
}

interface SupplierRequestDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: SupplierRequestWithProducts | null
}

export function SupplierRequestDetailsDialog({
  open,
  onOpenChange,
  request,
}: SupplierRequestDetailsDialogProps) {
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false)

  const handlePrint = useCallback(() => {
    if (!request) return
    setPrintPreviewOpen(true)
  }, [request])

  const handleExportPDF = useCallback(() => {
    if (!request) return
    try {
      exportSupplierRequestPDF(request)
    } catch {
      /* Export handlea sus propios errores */
    }
  }, [request])

  if (!request) return null

  const statusStyle = statusConfig[request.status] ?? {
    label: request.status,
    color: "bg-gray-100 text-gray-700",
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[calc(100vw-2rem)] !max-w-[calc(100vw-2rem)] lg:!max-w-5xl overflow-hidden p-0">
          <DialogHeader className="border-b bg-muted/30 pb-6 pr-14">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <Badge
                  variant="outline"
                  className="w-fit rounded-full px-3 py-1 text-xs tracking-[0.18em] uppercase"
                >
                  Solicitud #{request.id.toString().slice(0, 8).toUpperCase()}
                </Badge>
                <div className="space-y-1">
                  <DialogTitle className="text-2xl">Solicitud a proveedor</DialogTitle>
                  <DialogDescription>
                    Productos solicitados y detalles de la cotización requerida.
                  </DialogDescription>
                </div>
              </div>

              <div className="flex flex-col items-start gap-3 sm:items-end">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusStyle.color}`}
                >
                  {statusStyle.label}
                </span>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Enviada el {formatDate(request.sentAt)}
                </div>
              </div>
            </div>
          </DialogHeader>

          <DialogBody className="min-h-0 space-y-6 px-6 py-5">
            {/* Supplier info */}
            <section className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">Proveedor</h3>
                  <p className="text-sm text-muted-foreground">Destinatario de la solicitud.</p>
                </div>
              </div>
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-lg font-semibold">{request.supplierName}</p>
                {request.response && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    <span className="font-medium">Respuesta:</span> {request.response}
                  </p>
                )}
              </div>
            </section>

            {/* Products */}
            <section className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">Productos solicitados</h3>
                  <p className="text-sm text-muted-foreground">
                    {request.products.length}{" "}
                    {request.products.length === 1 ? "producto" : "productos"} para cotizar.
                  </p>
                </div>
              </div>

              <ScrollArea className="max-h-[400px]">
                <div className="divide-y rounded-xl border">
                  {request.products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-start gap-4 p-4 transition-colors hover:bg-muted/20"
                    >
                      {/* Image */}
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <Package className="h-6 w-6" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">
                                {product.code}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                x{product.quantity}
                              </span>
                            </div>
                            <p className="mt-1 text-sm font-semibold">{product.name}</p>
                          </div>
                          <Badge variant="secondary" className="shrink-0">
                            {product.quantity} und.
                          </Badge>
                        </div>
                        {product.description && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </section>

            {/* Notes */}
            {request.notes && (
              <section className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">Notas</h3>
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground rounded-xl bg-muted/20 p-4">
                  {request.notes}
                </p>
              </section>
            )}
          </DialogBody>

          <DialogFooter className="border-t bg-muted/20 px-6 py-4">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
              <Button
                type="button"
                variant="outline"
                className="min-w-[160px]"
                onClick={handleExportPDF}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Exportar PDF
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="min-w-[160px]"
                onClick={handlePrint}
              >
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
              <DialogClose asChild>
                <Button type="button" className="min-w-[160px]">
                  Cerrar
                </Button>
              </DialogClose>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PrintPreviewDialog
        open={printPreviewOpen}
        onClose={() => setPrintPreviewOpen(false)}
        elementId="supplier-request-to-print"
        onExportPdf={handleExportPDF}
      >
        <PrintSupplierRequest request={request} />
      </PrintPreviewDialog>
    </>
  )
}
