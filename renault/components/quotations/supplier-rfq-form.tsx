"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { ProductCombobox } from "@/components/shared/product-combobox"
import { Search } from "lucide-react"
import type { Product, Supplier } from "@/lib/types"
import {
  type QuotationItemForm,
  type ItemDetail,
  ProductItemCard,
  QuantityStepper,
  AddProductButton,
} from "./quotation-form-shared"

interface SupplierRfqFormProps {
  products: Product[]
  suppliers: Supplier[]
  items: QuotationItemForm[]
  selectedSupplierIds: Set<string>
  supplierSearch: string
  rfqNotes: string
  validUntil: string
  isLoadingData: boolean
  itemDetails: ItemDetail[]
  onToggleSupplier: (id: string) => void
  onSupplierSearchChange: (search: string) => void
  onRfqNotesChange: (notes: string) => void
  onValidUntilChange: (value: string) => void
  onItemUpdate: (index: number, patch: Partial<QuotationItemForm>) => void
  onItemRemove: (index: number) => void
  onItemAdd: () => void
}

export function SupplierRfqForm({
  products,
  suppliers,
  items,
  selectedSupplierIds,
  supplierSearch,
  rfqNotes,
  validUntil,
  isLoadingData,
  itemDetails,
  onToggleSupplier,
  onSupplierSearchChange,
  onRfqNotesChange,
  onValidUntilChange,
  onItemUpdate,
  onItemRemove,
  onItemAdd,
}: SupplierRfqFormProps) {
  const filteredSuppliers = suppliers.filter(
    (s) =>
      !supplierSearch ||
      s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      (s.company && s.company.toLowerCase().includes(supplierSearch.toLowerCase())),
  )

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(320px,0.9fr)]">
      <div className="space-y-5">
        <section className="rounded-2xl border bg-background p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-1">
            <h3 className="text-base font-semibold">Proveedores destino</h3>
            <p className="text-sm text-muted-foreground">
              Seleccioná los proveedores a los que querés solicitar cotización.
            </p>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar proveedor..."
                className="h-11 w-full rounded-xl pl-9"
                value={supplierSearch}
                onChange={(e) => onSupplierSearchChange(e.target.value)}
              />
            </div>

            <ScrollArea className="h-48 rounded-xl border">
              {filteredSuppliers.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  {supplierSearch ? "No se encontraron proveedores" : "Cargando proveedores..."}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredSuppliers.map((supplier) => (
                    <label
                      key={String(supplier.id)}
                      className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selectedSupplierIds.has(String(supplier.id))}
                        onCheckedChange={() => onToggleSupplier(String(supplier.id))}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{supplier.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {supplier.company || supplier.phone || "Sin datos"}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </ScrollArea>

            <p className="text-xs text-muted-foreground">
              {selectedSupplierIds.size} proveedor{selectedSupplierIds.size !== 1 ? "es" : ""}{" "}
              seleccionado{selectedSupplierIds.size !== 1 ? "s" : ""}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border bg-background p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-1">
            <h3 className="text-base font-semibold">Productos a cotizar</h3>
            <p className="text-sm text-muted-foreground">
              Agregá los productos que necesitás que los proveedores cotizen.
            </p>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => {
              const excludeIds = items
                .filter((_, i) => i !== index)
                .map((i) => i.productId)
                .filter(Boolean)

              return (
                <ProductItemCard
                  key={index}
                  index={index}
                  subtitle="Seleccioná un producto."
                  onRemove={() => onItemRemove(index)}
                >
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_120px]">
                    <div className="space-y-2">
                      <Label>Producto</Label>
                      <ProductCombobox
                        products={products}
                        value={item.productId}
                        onChange={(productId) => onItemUpdate(index, { productId })}
                        excludeIds={excludeIds}
                        placeholder="Selecciona producto"
                        loading={isLoadingData}
                        loadingText="Cargando productos..."
                        className="h-11 rounded-xl px-4"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Cantidad</Label>
                      <QuantityStepper
                        value={item.quantity}
                        onChange={(value) => onItemUpdate(index, { quantity: value })}
                      />
                    </div>
                  </div>
                </ProductItemCard>
              )
            })}
          </div>

          <AddProductButton onClick={onItemAdd} />
        </section>

        <section className="rounded-2xl border bg-background p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-1">
            <h3 className="text-base font-semibold">Notas para proveedores</h3>
            <p className="text-sm text-muted-foreground">
              Instrucciones o comentarios adicionales para los proveedores.
            </p>
          </div>
          <Textarea
            placeholder="Ej: Entregar antes del 15 de agosto, incluir flete..."
            value={rfqNotes}
            onChange={(e) => onRfqNotesChange(e.target.value)}
            className="min-h-[100px] resize-none rounded-xl"
          />
        </section>
      </div>

      <aside className="space-y-5 xl:sticky xl:top-0 xl:self-start">
        <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
          <h3 className="text-base font-semibold">Resumen de la solicitud</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Proveedores</span>
              <span className="font-medium">{selectedSupplierIds.size}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Productos</span>
              <span className="font-medium">{itemDetails.length}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Válida hasta</span>
              <span className="font-medium">{validUntil || "—"}</span>
            </div>
          </div>
        </section>
      </aside>
    </div>
  )
}
