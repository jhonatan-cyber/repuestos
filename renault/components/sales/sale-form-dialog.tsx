"use client"

import { logger } from "@/lib/logger"
import { useEffect, useMemo, useState, type FormEvent } from "react"
import type { Client, Product } from "@/lib/types"
import { apiClient } from "@/lib/api-client"
import { loadList } from "@/lib/api-list"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Check, ChevronsUpDown, MinusCircle, PlusCircle, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/format-utils"

interface SaleItemForm {
  productId: string
  quantity: number
  price: number
}

function getTodayLocalDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
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

function formatCurrencyCompact(amount: number): string {
  return new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0)
}

function paymentMethodLabel(method: string): string {
  const key = String(method || "").toLowerCase()
  if (key === "transferencia") return "Transferencia"
  if (key === "credito" || key === "crédito") return "Crédito"
  if (key === "qr") return "QR"
  return "Efectivo"
}

interface SaleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isSubmitting: boolean
  sellerUserId: string
  onSubmit: (values: {
    date: string
    clientId: string
    sellerUserId: string
    items: Array<{ productId: string; quantity: number; price: number; subtotal: number }>
    subtotal: number
    tax: number
    discount: number
    total: number
    saleType?: string
    paymentMethod: string
    initialPaymentMethod?: string
    initialPayment?: number
    notes?: string
    status: string
  }) => Promise<void>
}

export function SaleFormDialog({
  open,
  onOpenChange,
  isSubmitting,
  sellerUserId,
  onSubmit,
}: SaleFormDialogProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [clientSearch, setClientSearch] = useState("")
  const [clientComboboxOpen, setClientComboboxOpen] = useState(false)

  const [date, setDate] = useState(getTodayLocalDateString())
  const [clientId, setClientId] = useState("")
  const [saleType, setSaleType] = useState("contado")
  const [paymentMethod, setPaymentMethod] = useState("efectivo")
  const [initialPaymentMethod, setInitialPaymentMethod] = useState("efectivo")
  const [initialPayment, setInitialPayment] = useState(0)
  const [status, setStatus] = useState("completada")
  const [tax, setTax] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [items, setItems] = useState<SaleItemForm[]>([{ productId: "", quantity: 1, price: 0 }])

  // Notes state
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (!open) return

    setDate(getTodayLocalDateString())
    setClientId("")
    setSaleType("contado")
    setPaymentMethod("efectivo")
    setInitialPaymentMethod("efectivo")
    setInitialPayment(0)
    setStatus("completada")
    setTax(0)
    setDiscount(0)
    setItems([{ productId: "", quantity: 1, price: 0 }])
    setClientSearch("")
    setNotes("")
  }, [open])

  useEffect(() => {
    if (!open) return

    async function loadData() {
      setIsLoadingData(true)
      try {
        const [clientsRes, productsRes] = await Promise.all([
          loadList<Client>("/api/clients", apiClient),
          loadList<Product>("/api/products?limit=100", apiClient),
        ])

        setClients(clientsRes)
        setProducts(productsRes)
      } catch (error) {
        logger.error("Error loading sale form data", {
          error: error instanceof Error ? error.message : error,
        })
      } finally {
        setIsLoadingData(false)
      }
    }

    loadData()
  }, [open])

  const itemDetails = useMemo(
    () =>
      items
        .map((item) => ({
          item,
          product: products.find((productRow) => String(productRow.id) === item.productId),
          subtotal: item.quantity * item.price,
        }))
        .filter((row) => !!row.product && row.item.quantity > 0 && row.item.price > 0),
    [items, products],
  )

  const subtotal = useMemo(
    () => itemDetails.reduce((sum, row) => sum + row.subtotal, 0),
    [itemDetails],
  )
  const total = useMemo(() => +(subtotal + tax - discount).toFixed(2), [subtotal, tax, discount])

  const selectedClient = clients.find((client) => String(client.id) === clientId)
  const isCreditSale = saleType === "credito"
  const creditInitialPayment = useMemo(() => {
    if (!isCreditSale) return 0
    return Math.min(Math.max(initialPayment || 0, 0), total)
  }, [isCreditSale, initialPayment, total])
  const creditDebtAmount = useMemo(() => {
    if (!isCreditSale) return 0
    return Math.max(total - creditInitialPayment, 0)
  }, [isCreditSale, total, creditInitialPayment])

  const canSubmit =
    !!sellerUserId &&
    itemDetails.length > 0 &&
    itemDetails.every((row) => !!row.product) &&
    (!isCreditSale || !!clientId) &&
    !isSubmitting &&
    !isLoadingData &&
    initialPayment >= 0 &&
    initialPayment <= total

  const addItem = () => setItems((prev) => [...prev, { productId: "", quantity: 1, price: 0 }])

  const removeItem = (index: number) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  const updateItem = (index: number, patch: Partial<SaleItemForm>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!canSubmit) return

    await onSubmit({
      date,
      clientId,
      sellerUserId,
      items: itemDetails.map((row) => ({
        productId: String(row.product?.id),
        quantity: row.item.quantity,
        price: row.item.price,
        subtotal: row.subtotal,
      })),
      subtotal,
      tax,
      discount,
      total,
      saleType,
      paymentMethod: isCreditSale ? initialPaymentMethod : paymentMethod,
      initialPaymentMethod: isCreditSale ? initialPaymentMethod : undefined,
      initialPayment: isCreditSale ? initialPayment : 0,
      notes: notes.trim() || undefined,
      status,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-[calc(100%-1rem)] flex-col overflow-hidden p-0 sm:max-w-6xl">
        <DialogHeader className="border-b bg-muted/30 px-5 py-5 sm:px-7 sm:py-6">
          <DialogTitle className="text-xl font-semibold tracking-tight">Nueva Venta</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Registra una venta con cliente, productos y totales de venta.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="contents">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(320px,0.9fr)]">
              <div className="space-y-5">
                <section className="rounded-2xl border bg-background p-4 shadow-sm sm:p-5">
                  <div className="mb-4 flex flex-col gap-1">
                    <h3 className="text-base font-semibold">Datos generales</h3>
                    <p className="text-sm text-muted-foreground">
                      Elegí el cliente y define los parámetros de la venta.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="sale-date">Fecha</Label>
                      <Input
                        id="sale-date"
                        type="date"
                        value={date}
                        onChange={(event) => setDate(event.target.value)}
                        className="h-11 rounded-xl"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Cliente</Label>
                      <Popover open={clientComboboxOpen} onOpenChange={setClientComboboxOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={clientComboboxOpen}
                            className="h-11 w-full justify-between rounded-xl px-4 font-normal"
                          >
                            <span className="truncate text-left">
                              {selectedClient?.name ||
                                (isLoadingData ? "Cargando clientes..." : "Selecciona un cliente")}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Buscar cliente..."
                              value={clientSearch}
                              onValueChange={(value) => setClientSearch(value)}
                            />
                            <CommandList>
                              <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                              <CommandGroup>
                                {clients
                                  .filter(
                                    (client) =>
                                      client.name
                                        .toLowerCase()
                                        .includes(clientSearch.toLowerCase()) ||
                                      client.phone
                                        .toLowerCase()
                                        .includes(clientSearch.toLowerCase()),
                                  )
                                  .map((client) => (
                                    <CommandItem
                                      key={String(client.id)}
                                      value={String(client.id)}
                                      onSelect={() => {
                                        setClientId(String(client.id))
                                        setClientComboboxOpen(false)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          clientId === String(client.id)
                                            ? "opacity-100"
                                            : "opacity-0",
                                        )}
                                      />
                                      {client.name}
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {!clientId && isCreditSale && (
                        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                          Es obligatorio seleccionar un cliente para ventas a crédito.
                        </p>
                      )}
                      {!clientId && !isCreditSale && (
                        <p className="rounded-xl border border-dashed bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                          Si no seleccionás cliente, se usará{" "}
                          <span className="font-medium text-foreground">Cliente no registrado</span>
                          .
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border bg-background p-4 shadow-sm sm:p-5">
                  <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold">Productos</h3>
                      <p className="text-sm text-muted-foreground">
                        Agregá los productos que formarán parte de la venta.
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {itemDetails.length}{" "}
                      {itemDetails.length === 1
                        ? "producto seleccionado"
                        : "productos seleccionados"}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {items.map((item, index) => {
                      const lineTotal = item.quantity * item.price
                      const excludeIds = items
                        .filter((_, i) => i !== index)
                        .map((i) => i.productId)
                        .filter(Boolean)

                      return (
                        <div
                          key={index}
                          className="rounded-2xl border bg-muted/20 p-4 transition-colors hover:bg-muted/30"
                        >
                          <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium">Producto {index + 1}</p>
                              <p className="text-xs text-muted-foreground">
                                Seleccioná un producto y ajustá la cantidad.
                              </p>
                            </div>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => removeItem(index)}
                              className="shrink-0 rounded-full"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_180px]">
                              <div className="space-y-2">
                                <Label>Producto</Label>
                                <ProductCombobox
                                  products={products}
                                  value={item.productId}
                                  onChange={(productId, product) => {
                                    updateItem(index, { productId, price: product.salePrice })
                                  }}
                                  excludeIds={excludeIds}
                                  placeholder="Selecciona producto"
                                  loading={isLoadingData}
                                  loadingText="Cargando productos..."
                                  disableOutOfStock
                                  className="h-11 rounded-xl px-4"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Cantidad</Label>
                                <div className="flex h-11 items-center gap-2 rounded-xl border bg-background px-3">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateItem(index, {
                                        quantity: Math.max(1, item.quantity - 1),
                                      })
                                    }
                                    className="text-muted-foreground transition-colors hover:text-foreground"
                                  >
                                    <MinusCircle className="h-4 w-4" />
                                  </button>
                                  <Input
                                    type="number"
                                    min={1}
                                    className="w-full border-0 px-0 text-center shadow-none focus-visible:ring-0"
                                    value={item.quantity}
                                    onChange={(event) =>
                                      updateItem(index, {
                                        quantity: Math.max(1, Number(event.target.value || 1)),
                                      })
                                    }
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateItem(index, { quantity: item.quantity + 1 })
                                    }
                                    className="text-muted-foreground transition-colors hover:text-foreground"
                                  >
                                    <PlusCircle className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Precio</Label>
                                <div className="flex h-11 items-center rounded-xl border bg-background px-4">
                                  <p className="text-sm font-semibold">
                                    {formatCurrencyCompact(item.price)}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Subtotal</Label>
                                <div className="flex h-11 items-center rounded-xl border bg-background px-4">
                                  <p className="text-sm font-semibold">
                                    {formatCurrencyCompact(lineTotal)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex justify-center pt-5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addItem}
                      className="rounded-full px-5"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Agregar producto
                    </Button>
                  </div>

                  <div className="pt-5">
                    <div className="space-y-2">
                      <Label htmlFor="sale-notes">Notas / Observaciones</Label>
                      <textarea
                        id="sale-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Notas opcionales sobre la venta..."
                        className="min-h-[80px] w-full rounded-xl border bg-background px-4 py-3 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                    </div>
                  </div>
                </section>
              </div>

              <aside className="space-y-5 xl:sticky xl:top-0 xl:self-start">
                <section className="rounded-2xl border bg-background p-4 shadow-sm sm:p-5">
                  <div className="mb-4 flex flex-col gap-1">
                    <h3 className="text-base font-semibold">Ajustes comerciales</h3>
                    <p className="text-sm text-muted-foreground">
                      Ajustá IVA para ver el total de la venta.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tipo de venta</Label>
                      <Select value={saleType} onValueChange={setSaleType}>
                        <SelectTrigger className="h-11 w-full rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contado">Al contado</SelectItem>
                          <SelectItem value="credito">A crédito</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {!isCreditSale && (
                      <div className="space-y-2">
                        <Label>Método de pago</Label>
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
                      <div className="space-y-2">
                        <Label>Método de pago del monto inicial</Label>
                        <Select
                          value={initialPaymentMethod}
                          onValueChange={setInitialPaymentMethod}
                        >
                          <SelectTrigger className="h-11 w-full rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="efectivo">Efectivo</SelectItem>
                            <SelectItem value="transferencia">Transferencia</SelectItem>
                            <SelectItem value="qr">QR</SelectItem>
                          </SelectContent>
                        </Select>
                        <Label className="pt-2">Monto inicial abonado (opcional)</Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          className="h-11 w-full rounded-xl"
                          value={formatMoneyInput(initialPayment)}
                          onChange={(event) =>
                            setInitialPayment(Math.max(0, parseMoneyInput(event.target.value)))
                          }
                          placeholder="0"
                        />
                        <p className="text-xs text-muted-foreground">
                          Si no ingresás monto, se toma 0 y la deuda queda por el total.
                        </p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Descuento</Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        className="h-11 w-full rounded-xl"
                        value={formatMoneyInput(discount)}
                        onChange={(event) =>
                          setDiscount(Math.max(0, parseMoneyInput(event.target.value)))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>IVA</Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        className="h-11 w-full rounded-xl"
                        value={formatMoneyInput(tax)}
                        onChange={(event) =>
                          setTax(Math.max(0, parseMoneyInput(event.target.value)))
                        }
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border bg-foreground text-background shadow-sm">
                  <div className="border-b border-background/10 px-4 py-4 sm:px-5 sm:py-5">
                    <p className="text-sm font-medium text-background/80">Resumen</p>
                    <h3 className="text-lg font-semibold">Total de la venta</h3>
                  </div>

                  <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
                    <div className="rounded-xl bg-background/10 px-3 py-2 text-xs text-background/80">
                      Tipo:{" "}
                      <span className="font-semibold text-background">
                        {isCreditSale ? "A crédito" : "Al contado"}
                      </span>
                      {" · "}
                      Método:{" "}
                      <span className="font-semibold text-background">
                        {isCreditSale
                          ? paymentMethodLabel(initialPaymentMethod)
                          : paymentMethodLabel(paymentMethod)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-background/70">Subtotal productos</span>
                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-background/70">Descuento</span>
                      <span className="font-medium">- {formatCurrency(discount)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-background/70">Impuesto</span>
                      <span className="font-medium">{formatCurrency(tax)}</span>
                    </div>
                    {isCreditSale && (
                      <>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-background/70">Monto inicial</span>
                          <span className="font-medium">
                            {formatCurrency(creditInitialPayment)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-background/70">Monto a deuda</span>
                          <span className="font-medium">{formatCurrency(creditDebtAmount)}</span>
                        </div>
                      </>
                    )}
                    <div className="rounded-xl bg-background/10 px-4 py-4">
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className="text-sm text-background/70">Total final</p>
                          <p className="text-2xl font-bold tracking-tight">
                            {formatCurrency(total)}
                          </p>
                        </div>
                        <div className="text-right text-xs text-background/70">
                          <p>{items.length} líneas</p>
                          <p>{itemDetails.length} seleccionadas</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </aside>
            </div>
          </div>

          <DialogFooter className="border-t bg-background px-5 py-4 sm:justify-center sm:px-7 sm:py-5">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? "Guardando..." : "Registrar venta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
