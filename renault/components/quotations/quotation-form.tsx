"use client"

import { formatDateLocal } from "@/lib/dates"

import { logger } from "@/lib/logger"
import { apiClient } from "@/lib/api-client"
import { loadList } from "@/lib/api-list"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/lib/toast"
import type { Client, Product, Quotation, Supplier } from "@/lib/types"
import { type FormMode, type QuotationItemForm } from "./quotation-form-shared"
import { ClientQuotationForm } from "./client-quotation-form"
import { SupplierRfqForm } from "./supplier-rfq-form"

interface QuotationFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quotation: Quotation | null
  sellerUserId: string
  onSuccess: () => void
  defaultMode?: FormMode
}

export function QuotationFormDialog({
  open,
  onOpenChange,
  quotation,
  sellerUserId,
  onSuccess,
  defaultMode,
}: QuotationFormDialogProps) {
  const [formMode, setFormMode] = useState<FormMode>("cliente")
  const [clients, setClients] = useState<Client[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clientComboboxOpen, setClientComboboxOpen] = useState(false)
  const [clientSearch, setClientSearch] = useState("")

  const [clientId, setClientId] = useState("")
  const [customClientName, setCustomClientName] = useState("")
  const [customClientPhone, setCustomClientPhone] = useState("")
  const [validUntil, setValidUntil] = useState("")
  const [tax, setTax] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [isDiscountFocused, setIsDiscountFocused] = useState(false)
  const [isTaxFocused, setIsTaxFocused] = useState(false)
  const [items, setItems] = useState<QuotationItemForm[]>([{ productId: "", quantity: 1 }])

  // Supplier RFQ state
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<Set<string>>(new Set())
  const [supplierSearch, setSupplierSearch] = useState("")
  const [rfqNotes, setRfqNotes] = useState("")

  const resetForm = () => {
    const date = new Date()
    date.setDate(date.getDate() + 30)

    setClientId("")
    setCustomClientName("")
    setCustomClientPhone("")
    setClientSearch("")
    setValidUntil(formatDateLocal(date))
    setTax(0)
    setDiscount(0)
    setIsDiscountFocused(false)
    setIsTaxFocused(false)
    setItems([{ productId: "", quantity: 1 }])
    setFormMode("cliente")
    setSelectedSupplierIds(new Set())
    setSupplierSearch("")
    setRfqNotes("")
  }

  const toggleSupplier = (id: string) => {
    setSelectedSupplierIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  useEffect(() => {
    if (!open) return

    const loadData = async () => {
      try {
        setIsLoadingData(true)
        const [clientsData, productsData, suppliersData] = await Promise.all([
          loadList<Client>("/api/clients", apiClient),
          loadList<Product>("/api/products", apiClient),
          loadList<Supplier>("/api/suppliers", apiClient),
        ])

        setClients(clientsData)
        setProducts(productsData)
        const allSuppliers = suppliersData
        setSuppliers(allSuppliers.filter((s: Supplier) => s.status !== "inactive"))

        if (quotation) {
          const quotationClientId = quotation.clientId ? String(quotation.clientId) : ""
          setClientId(quotationClientId)
          setCustomClientName(quotationClientId ? "" : quotation.clientName || "")
          setCustomClientPhone(quotation.externalClientPhone || "")
          setClientSearch("")
          setValidUntil(quotation.validUntil.split("T")[0])
          setTax(quotation.tax)
          setDiscount(quotation.discount)
          setItems(
            quotation.items.map((item) => ({
              productId: String(item.productId),
              quantity: item.quantity,
            })),
          )
          setFormMode("cliente")
        } else {
          resetForm()
          if (defaultMode) setFormMode(defaultMode)
        }
      } catch (error) {
        logger.warn("Error loading quotation form data", {
          error: error instanceof Error ? error.message : error,
        })
        toast.error("Error al cargar datos")
      } finally {
        setIsLoadingData(false)
      }
    }

    loadData()
  }, [open, quotation])

  const itemDetails = useMemo(() => {
    return items
      .filter((item) => item.productId)
      .map((item) => {
        const product = products.find((productRow) => String(productRow.id) === item.productId)
        const price = product?.salePrice || 0
        const subtotal = price * item.quantity
        return { item, product, price, subtotal }
      })
  }, [items, products])

  const subtotal = useMemo(
    () => itemDetails.reduce((sum, row) => sum + row.subtotal, 0),
    [itemDetails],
  )
  const total = Math.max(0, subtotal - discount + tax)

  const canSubmitClient =
    !!sellerUserId &&
    !!validUntil &&
    itemDetails.length > 0 &&
    itemDetails.every((row) => !!row.product && row.item.quantity > 0) &&
    (!customClientName.trim() || !!customClientPhone.trim()) &&
    !isSubmitting &&
    !isLoadingData

  const canSubmitSupplier =
    !!sellerUserId &&
    !!validUntil &&
    itemDetails.length > 0 &&
    itemDetails.every((row) => !!row.product && row.item.quantity > 0) &&
    selectedSupplierIds.size > 0 &&
    !isSubmitting &&
    !isLoadingData

  const canSubmit = formMode === "proveedor" ? canSubmitSupplier : canSubmitClient

  const addItem = () => setItems((prev) => [...prev, { productId: "", quantity: 1 }])

  const removeItem = (index: number) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  const updateItem = (index: number, patch: Partial<QuotationItemForm>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  const handleSubmit = async () => {
    if (formMode === "proveedor") {
      await handleSubmitSupplierRfq()
    } else {
      await handleSubmitClientQuotation()
    }
  }

  const handleSubmitClientQuotation = async () => {
    const unregisteredClientName = customClientName.trim() || clientSearch.trim()
    const payload = {
      date: quotation?.date || new Date().toISOString(),
      clientId,
      customClientName: clientId ? undefined : unregisteredClientName || undefined,
      customClientPhone: clientId ? undefined : customClientPhone.trim() || undefined,
      sellerUserId,
      items: itemDetails.map((row) => ({
        productId: String(row.product?.id),
        quantity: row.item.quantity,
        price: row.price,
        subtotal: row.subtotal,
      })),
      subtotal,
      tax,
      discount,
      total,
      validUntil: new Date(validUntil).toISOString(),
      status: quotation?.status || "pendiente",
    }

    try {
      setIsSubmitting(true)

      const data = await apiClient<{ error?: string }>(
        quotation ? `/api/quotations/${quotation.id}` : "/api/quotations",
        {
          method: quotation ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      )
      if (data && typeof data === "object" && "error" in data) {
        throw new Error((data as { error: string }).error || "Error al guardar cotizacion")
      }

      onSuccess()
      resetForm()
      onOpenChange(false)
      toast.success(
        quotation ? "Cotizacion actualizada correctamente" : "Cotizacion creada correctamente",
      )
    } catch (error) {
      logger.warn("Error saving quotation", {
        error: error instanceof Error ? error.message : error,
      })
      toast.error(error instanceof Error ? error.message : "Error al guardar cotizacion")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitSupplierRfq = async () => {
    try {
      setIsSubmitting(true)

      // 1. Create quotation with status "solicitado", no client, zero prices
      const quotationPayload = {
        date: new Date().toISOString(),
        clientId: null,
        sellerUserId,
        items: itemDetails.map((row) => ({
          productId: String(row.product?.id),
          quantity: row.item.quantity,
          price: 0,
          subtotal: 0,
        })),
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
        validUntil: new Date(validUntil).toISOString(),
        status: "solicitado",
      }

      const qRes = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(quotationPayload),
      })

      const qData = await qRes.json().catch(() => null)
      if (!qRes.ok) {
        throw new Error(qData?.error || "Error al crear solicitud")
      }

      const newQuotationId = qData?.data?.id || qData?.id
      if (!newQuotationId) {
        throw new Error("No se pudo obtener el ID de la cotización creada")
      }

      // 2. Create supplier requests
      const srRes = await fetch(`/api/quotations/${newQuotationId}/supplier-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          supplierIds: Array.from(selectedSupplierIds),
          notes: rfqNotes.trim() || null,
        }),
      })

      let srData: { count?: number; error?: string } | null = null
      let srError = "Error al enviar solicitud a proveedores"
      try {
        srData = await srRes.json()
        srError = srData?.error || srError
      } catch {
        srError = `Error ${srRes.status}: ${srRes.statusText}`
      }
      if (!srRes.ok) {
        throw new Error(srError)
      }

      onSuccess()
      resetForm()
      onOpenChange(false)
      toast.success(`Solicitud enviada a ${srData?.count ?? selectedSupplierIds.size} proveedores`)
    } catch (error) {
      logger.warn("Error creating supplier RFQ", {
        error: error instanceof Error ? error.message : error,
      })
      toast.error(error instanceof Error ? error.message : "Error al crear solicitud a proveedores")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-[calc(100%-1rem)] flex-col overflow-hidden p-0 sm:max-w-6xl">
        <DialogHeader className="border-b bg-muted/30 px-5 py-4 sm:px-7 sm:py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold tracking-tight">
                {quotation
                  ? "Editar Cotizacion"
                  : formMode === "proveedor"
                    ? "Solicitar a proveedores"
                    : "Nueva Cotizacion"}
              </DialogTitle>
              <DialogDescription>
                {quotation
                  ? "Modifica la informacion y los productos incluidos en la cotizacion."
                  : formMode === "proveedor"
                    ? "Seleccioná los proveedores y productos para solicitar cotización."
                    : "Genera una nueva cotizacion con cliente, productos, vigencia y resumen comercial."}
              </DialogDescription>
            </div>
            {!quotation && formMode === "proveedor" && (
              <p className="text-xs text-muted-foreground">Solicitando cotización a proveedores</p>
            )}
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          {formMode === "proveedor" ? (
            <SupplierRfqForm
              products={products}
              suppliers={suppliers}
              items={items}
              selectedSupplierIds={selectedSupplierIds}
              supplierSearch={supplierSearch}
              rfqNotes={rfqNotes}
              validUntil={validUntil}
              isLoadingData={isLoadingData}
              itemDetails={itemDetails}
              onToggleSupplier={toggleSupplier}
              onSupplierSearchChange={setSupplierSearch}
              onRfqNotesChange={setRfqNotes}
              onValidUntilChange={setValidUntil}
              onItemUpdate={updateItem}
              onItemRemove={removeItem}
              onItemAdd={addItem}
            />
          ) : (
            <ClientQuotationForm
              products={products}
              clients={clients}
              items={items}
              clientId={clientId}
              customClientName={customClientName}
              customClientPhone={customClientPhone}
              clientSearch={clientSearch}
              clientComboboxOpen={clientComboboxOpen}
              validUntil={validUntil}
              discount={discount}
              tax={tax}
              isDiscountFocused={isDiscountFocused}
              isTaxFocused={isTaxFocused}
              isLoadingData={isLoadingData}
              itemDetails={itemDetails}
              subtotal={subtotal}
              total={total}
              onClientIdChange={setClientId}
              onCustomClientNameChange={setCustomClientName}
              onCustomClientPhoneChange={setCustomClientPhone}
              onClientSearchChange={setClientSearch}
              onClientComboboxOpenChange={setClientComboboxOpen}
              onValidUntilChange={setValidUntil}
              onDiscountChange={setDiscount}
              onTaxChange={setTax}
              onDiscountFocusChange={setIsDiscountFocused}
              onTaxFocusChange={setIsTaxFocused}
              onItemUpdate={updateItem}
              onItemRemove={removeItem}
              onItemAdd={addItem}
            />
          )}
        </div>

        <DialogFooter className="border-t bg-background px-5 py-4 sm:justify-center sm:px-7 sm:py-5">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting
              ? "Guardando..."
              : formMode === "proveedor"
                ? "Guardar"
                : quotation
                  ? "Actualizar cotizacion"
                  : "Guardar cotizacion"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
