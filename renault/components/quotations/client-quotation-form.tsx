"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { ProductCombobox } from "@/components/shared/product-combobox"
import { formatCurrency, capitalizeWordsPreservingCase } from "@/lib/format-utils"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Client, Product } from "@/lib/types"
import {
  type QuotationItemForm,
  type ItemDetail,
  ProductItemCard,
  QuantityStepper,
  AddProductButton,
} from "./quotation-form-shared"

interface ClientQuotationFormProps {
  products: Product[]
  clients: Client[]
  items: QuotationItemForm[]
  clientId: string
  customClientName: string
  customClientPhone: string
  clientSearch: string
  clientComboboxOpen: boolean
  validUntil: string
  discount: number
  tax: number
  isDiscountFocused: boolean
  isTaxFocused: boolean
  isLoadingData: boolean
  itemDetails: ItemDetail[]
  subtotal: number
  total: number
  onClientIdChange: (id: string) => void
  onCustomClientNameChange: (name: string) => void
  onCustomClientPhoneChange: (phone: string) => void
  onClientSearchChange: (search: string) => void
  onClientComboboxOpenChange: (open: boolean) => void
  onValidUntilChange: (value: string) => void
  onDiscountChange: (value: number) => void
  onTaxChange: (value: number) => void
  onDiscountFocusChange: (focused: boolean) => void
  onTaxFocusChange: (focused: boolean) => void
  onItemUpdate: (index: number, patch: Partial<QuotationItemForm>) => void
  onItemRemove: (index: number) => void
  onItemAdd: () => void
}

export function ClientQuotationForm({
  products,
  clients,
  items,
  clientId,
  customClientName,
  customClientPhone,
  clientSearch,
  clientComboboxOpen,
  validUntil,
  discount,
  tax,
  isDiscountFocused,
  isTaxFocused,
  isLoadingData,
  itemDetails,
  subtotal,
  total,
  onClientIdChange,
  onCustomClientNameChange,
  onCustomClientPhoneChange,
  onClientSearchChange,
  onClientComboboxOpenChange,
  onValidUntilChange,
  onDiscountChange,
  onTaxChange,
  onDiscountFocusChange,
  onTaxFocusChange,
  onItemUpdate,
  onItemRemove,
  onItemAdd,
}: ClientQuotationFormProps) {
  const selectedClient = clients.find((client) => String(client.id) === clientId)
  const unregisteredClientName = customClientName.trim() || clientSearch.trim()

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(320px,0.9fr)]">
      <div className="space-y-5">
        <section className="rounded-2xl border bg-background p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-1">
            <h3 className="text-base font-semibold">Datos generales</h3>
            <p className="text-sm text-muted-foreground">
              Elegí el cliente y definí la vigencia de la cotizacion.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Popover open={clientComboboxOpen} onOpenChange={onClientComboboxOpenChange}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={clientComboboxOpen}
                    className="h-11 w-full justify-between rounded-xl px-4 font-normal"
                  >
                    <span className="truncate text-left">
                      {selectedClient?.name ||
                        customClientName.trim() ||
                        (isLoadingData ? "Cargando clientes..." : "Selecciona cliente")}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Buscar o crear cliente..."
                      value={clientSearch}
                      onValueChange={(value) =>
                        onClientSearchChange(capitalizeWordsPreservingCase(value))
                      }
                    />
                    <CommandList>
                      <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                      <CommandGroup>
                        {clients.map((client) => (
                          <CommandItem
                            key={String(client.id)}
                            value={`${client.name} ${client.phone ?? ""}`}
                            onSelect={() => {
                              onClientIdChange(String(client.id))
                              onCustomClientNameChange("")
                              onClientComboboxOpenChange(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                clientId === String(client.id) ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {client.name}
                          </CommandItem>
                        ))}
                        {clientSearch.trim().length > 0 && (
                          <CommandItem
                            value={`crear ${clientSearch}`}
                            onSelect={() => {
                              onClientIdChange("")
                              onCustomClientNameChange(
                                capitalizeWordsPreservingCase(clientSearch).trim(),
                              )
                              onClientComboboxOpenChange(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                !clientId &&
                                  customClientName.trim().toLowerCase() ===
                                    clientSearch.trim().toLowerCase()
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            Crear cliente: {clientSearch.trim()}
                          </CommandItem>
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {!clientId && unregisteredClientName.length > 0 && (
                <div className="space-y-2 rounded-xl border border-dashed bg-muted/40 px-3 py-2">
                  <p className="text-xs text-muted-foreground">
                    Se usará como cliente no registrado:{" "}
                    <span className="font-medium text-foreground">{unregisteredClientName}</span>
                  </p>
                  <div className="space-y-1.5">
                    <Label htmlFor="custom-client-phone" className="text-xs">
                      Teléfono
                    </Label>
                    <Input
                      id="custom-client-phone"
                      type="tel"
                      inputMode="tel"
                      placeholder="Ej: 70000000"
                      className="h-10 w-full rounded-xl"
                      value={customClientPhone}
                      onChange={(event) => onCustomClientPhoneChange(event.target.value)}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Se registrará el cliente con este teléfono al convertir la cotización en venta.
                  </p>
                </div>
              )}
              {!clientId && unregisteredClientName.length === 0 && (
                <p className="rounded-xl border border-dashed bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  Si no seleccionás ni escribís un cliente, se guardará como{" "}
                  <span className="font-medium text-foreground">Sin cliente registrado</span>.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="valid-until">Valida hasta</Label>
              <Input
                id="valid-until"
                type="date"
                className="h-11 w-full rounded-xl"
                value={validUntil}
                onChange={(event) => onValidUntilChange(event.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-background p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-base font-semibold">Productos</h3>
              <p className="text-sm text-muted-foreground">
                Agregá los productos que formarán parte de la cotizacion.
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              {itemDetails.length}{" "}
              {itemDetails.length === 1 ? "producto seleccionado" : "productos seleccionados"}
            </div>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => {
              const lineTotal =
                (products.find((p) => String(p.id) === item.productId)?.salePrice || 0) *
                item.quantity
              const excludeIds = items
                .filter((_, i) => i !== index)
                .map((i) => i.productId)
                .filter(Boolean)

              return (
                <ProductItemCard
                  key={index}
                  index={index}
                  subtitle="Seleccioná un item y ajustá la cantidad."
                  onRemove={() => onItemRemove(index)}
                >
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_160px_180px]">
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

                    <div className="space-y-2">
                      <Label>Subtotal</Label>
                      <div className="flex h-11 items-center rounded-xl border bg-background px-4">
                        <p className="text-sm font-semibold">{formatCurrency(lineTotal)}</p>
                      </div>
                    </div>
                  </div>
                </ProductItemCard>
              )
            })}
          </div>

          <AddProductButton onClick={onItemAdd} />
        </section>
      </div>

      <aside className="space-y-5 xl:sticky xl:top-0 xl:self-start">
        <section className="rounded-2xl border bg-background p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-1">
            <h3 className="text-base font-semibold">Ajustes comerciales</h3>
            <p className="text-sm text-muted-foreground">
              Ajustá descuento e impuesto para ver el total final de la cotizacion.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Descuento</Label>
              <Input
                type="number"
                min={0}
                className="h-11 w-full rounded-xl"
                value={isDiscountFocused && discount === 0 ? "" : discount}
                onFocus={() => onDiscountFocusChange(true)}
                onBlur={() => onDiscountFocusChange(false)}
                onChange={(event) => onDiscountChange(Math.max(0, Number(event.target.value || 0)))}
              />
            </div>

            <div className="space-y-2">
              <Label>Impuesto</Label>
              <Input
                type="number"
                min={0}
                className="h-11 w-full rounded-xl"
                value={isTaxFocused && tax === 0 ? "" : tax}
                onFocus={() => onTaxFocusChange(true)}
                onBlur={() => onTaxFocusChange(false)}
                onChange={(event) => onTaxChange(Math.max(0, Number(event.target.value || 0)))}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-primary text-primary-foreground shadow-sm">
          <div className="border-b border-primary-foreground/10 px-4 py-4 sm:px-5">
            <p className="text-sm font-medium text-primary-foreground/80">Resumen</p>
            <h3 className="text-lg font-semibold">Total de la cotizacion</h3>
          </div>

          <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-primary-foreground/70">Subtotal productos</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-primary-foreground/70">Descuento</span>
              <span className="font-medium">- {formatCurrency(discount)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-primary-foreground/70">Impuesto</span>
              <span className="font-medium">{formatCurrency(tax)}</span>
            </div>

            <div className="rounded-xl bg-primary-foreground/10 px-4 py-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm text-primary-foreground/70">Total final</p>
                  <p className="text-2xl font-bold tracking-tight">{formatCurrency(total)}</p>
                </div>
                <div className="text-right text-xs text-primary-foreground/70">
                  <p>{items.length} líneas</p>
                  <p>{itemDetails.length} seleccionadas</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </aside>
    </div>
  )
}
