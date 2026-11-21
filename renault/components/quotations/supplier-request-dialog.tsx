"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, FileDown, Loader2 } from "lucide-react"
import { toast } from "@/lib/toast"
import { loadList } from "@/lib/api-list"
import { exportSupplierRequestPDF } from "@/lib/export"
import type {
  Supplier,
  SupplierRequest,
  SupplierRequestWithProducts,
  SupplierRequestProduct,
  Quotation,
} from "@/lib/types"

const statusConfig: Record<string, { label: string; color: string }> = {
  pendiente: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
  enviado: { label: "Enviado", color: "bg-blue-100 text-blue-800" },
  recibido: { label: "Recibido", color: "bg-purple-100 text-purple-800" },
  respondido: { label: "Respondido", color: "bg-green-100 text-green-800" },
}

interface SupplierRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quotationId: string
  onSuccess?: () => void
}

export function SupplierRequestDialog({
  open,
  onOpenChange,
  quotationId,
  onSuccess,
}: SupplierRequestDialogProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [existingRequests, setExistingRequests] = useState<SupplierRequest[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set<string>())
  const [notes, setNotes] = useState("")
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return

    const load = async () => {
      setIsLoading(true)
      try {
        const [allSuppliers, reqs] = await Promise.all([
          loadList<Supplier>("/api/suppliers"),
          loadList<SupplierRequest>(`/api/quotations/${quotationId}/supplier-requests`),
        ])
        setSuppliers(allSuppliers.filter((s: Supplier) => s.status !== "inactive"))
        setExistingRequests(reqs)

        // Pre-select suppliers that have been requested before
        const alreadyRequested: Set<string> = new Set(reqs.map((r) => String(r.supplierId)))
        setSelectedIds(alreadyRequested)
      } catch {
        toast.error("Error al cargar datos")
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [open, quotationId])

  const toggleSupplier = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filteredSuppliers = suppliers.filter(
    (s) =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.company && s.company.toLowerCase().includes(search.toLowerCase())),
  )

  const handleSubmit = async () => {
    if (selectedIds.size === 0) {
      toast.error("Seleccioná al menos un proveedor")
      return
    }

    setIsSubmitting(true)
    try {
      const data = await apiClient<{ count?: number; error?: string }>(
        `/api/quotations/${quotationId}/supplier-requests`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supplierIds: Array.from(selectedIds),
            notes: notes.trim() || null,
          }),
        },
      )

      toast.success(`Solicitud guardada`)

      // Fetch quotation and supplier requests data for PDF
      const [quotations, requests] = await Promise.all([
        loadList<Quotation>("/api/quotations"),
        loadList<SupplierRequest>(`/api/quotations/${quotationId}/supplier-requests`),
      ])
      const quotation = quotations.find((q: any) => String(q.id) === String(quotationId))

      if (quotation && requests.length > 0) {
        const products: SupplierRequestProduct[] = (quotation.items || []).map((item: any) => ({
          id: String(item.product?.id ?? item.productId ?? ""),
          code: item.product?.code ?? "",
          name: item.product?.name ?? item.productName ?? "",
          description: item.product?.description ?? null,
          image: item.product?.image ?? null,
          quantity: item.quantity,
        }))

        for (const req of requests) {
          const reqWithProducts: SupplierRequestWithProducts = {
            ...req,
            products,
            quotation: {
              date: quotation.date,
              clientName: quotation.clientName ?? quotation.externalClientName ?? "Sin cliente",
              total: quotation.total,
              status: quotation.status,
            },
          }
          exportSupplierRequestPDF(reqWithProducts)
        }
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al enviar solicitud")
    } finally {
      setIsSubmitting(false)
    }
  }

  const requestStatusForSupplier = (supplierId: string) =>
    existingRequests.find((r) => String(r.supplierId) === supplierId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle>Solicitar cotización a proveedores</DialogTitle>
          <DialogDescription>
            Seleccioná los proveedores a los que querés solicitar cotización para esta cotización.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="supplier-search">Buscar proveedor</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="supplier-search"
                placeholder="Buscar por nombre o empresa..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Proveedores</Label>
              <span className="text-xs text-muted-foreground">
                {selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}
              </span>
            </div>

            <ScrollArea className="h-64 rounded-lg border">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredSuppliers.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {search ? "No se encontraron proveedores" : "No hay proveedores disponibles"}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredSuppliers.map((supplier) => {
                    const existing = requestStatusForSupplier(String(supplier.id))
                    return (
                      <label
                        key={String(supplier.id)}
                        className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={selectedIds.has(String(supplier.id))}
                          onCheckedChange={() => toggleSupplier(String(supplier.id))}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{supplier.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {supplier.company || supplier.phone || "Sin datos"}
                          </p>
                        </div>
                        {existing && (
                          <Badge
                            variant="secondary"
                            className={`shrink-0 text-[10px] ${
                              statusConfig[existing.status]?.color ?? ""
                            }`}
                          >
                            {statusConfig[existing.status]?.label ?? existing.status}
                          </Badge>
                        )}
                      </label>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Agregá notas o instrucciones para los proveedores..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={selectedIds.size === 0 || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                Guardar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
