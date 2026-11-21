"use client"

import { formatDateLocal } from "@/lib/dates"
import dynamic from "next/dynamic"
import type { SupplierInput } from "@/lib/validations"
import { toast } from "@/lib/toast"

import { useEffect, useState } from "react"
import type { Product, Supplier } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
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
import { SupplierCombobox } from "@/components/shared/supplier-combobox"
import { ProductCombobox } from "@/components/shared/product-combobox"
import { Plus, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/format-utils"

const ProductFormDialog = dynamic(() =>
  import("@/components/inventory/product-form").then((module) => module.ProductFormDialog),
)
const SupplierFormDialog = dynamic(() =>
  import("@/components/suppliers/supplier-form").then((module) => module.SupplierFormDialog),
)

interface PurchaseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  suppliers: Supplier[]
  products: Product[]
  isSubmitting: boolean
  onProductCreated: (product: Product) => void
  onCreateSupplier: (values: SupplierInput) => Promise<Supplier>
  onSubmit: (values: {
    date: string
    supplierId: string
    purchaseType: "contado" | "credito"
    paymentMethod: "efectivo" | "transferencia" | "qr"
    initialPaymentMethod?: "efectivo" | "transferencia" | "qr"
    initialPayment?: number
    items: Array<{ productId: string; quantity: number; unitCost: number }>
  }) => Promise<void>
}

export function PurchaseFormDialog({
  open,
  onOpenChange,
  suppliers,
  products,
  isSubmitting,
  onSubmit,
  onProductCreated,
  onCreateSupplier,
}: PurchaseFormDialogProps) {
  const [date, setDate] = useState(formatDateLocal(new Date()))
  const [supplierId, setSupplierId] = useState("")
  const [supplierFormOpen, setSupplierFormOpen] = useState(false)
  const [productCreationIndex, setProductCreationIndex] = useState<number | null>(null)
  const [purchaseType, setPurchaseType] = useState<"contado" | "credito">("contado")
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "transferencia" | "qr">(
    "efectivo",
  )
  const [initialPaymentMethod, setInitialPaymentMethod] = useState<
    "efectivo" | "transferencia" | "qr"
  >("efectivo")
  const [initialPayment, setInitialPayment] = useState(0)
  const [items, setItems] = useState<
    Array<{ productId: string; quantity: string; unitCost: string }>
  >([{ productId: "", quantity: "1", unitCost: "" }])

  useEffect(() => {
    if (!open) return
    setDate(formatDateLocal(new Date()))
    setSupplierId("")
    setSupplierFormOpen(false)
    setProductCreationIndex(null)
    setPurchaseType("contado")
    setPaymentMethod("efectivo")
    setInitialPaymentMethod("efectivo")
    setInitialPayment(0)
    setItems([{ productId: "", quantity: "1", unitCost: "" }])
  }, [open])

  function updateItem(
    index: number,
    patch: Partial<{ productId: string; quantity: string; unitCost: string }>,
  ) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function addItem() {
    setItems((prev) => [...prev, { productId: "", quantity: "1", unitCost: "" }])
  }

  function removeItem(index: number) {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)))
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

  const total = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * parseMoneyInput(item.unitCost),
    0,
  )
  const safeInitialPayment =
    purchaseType === "credito" ? Math.min(Math.max(initialPayment || 0, 0), total) : 0
  const debtAmount = purchaseType === "credito" ? Math.max(total - safeInitialPayment, 0) : 0

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    event.stopPropagation()
    await onSubmit({
      date,
      supplierId,
      purchaseType,
      paymentMethod,
      initialPaymentMethod: purchaseType === "credito" ? initialPaymentMethod : undefined,
      initialPayment: purchaseType === "credito" ? initialPayment : 0,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        unitCost: parseMoneyInput(item.unitCost),
      })),
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[98vw] sm:max-w-4xl">
          <DialogHeader className="border-b">
            <DialogTitle className="pr-8 text-xl">Nueva Compra</DialogTitle>
            <DialogDescription>
              Registra una compra rápida con uno o varios productos y actualiza el inventario.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <DialogBody>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="purchase-date">Fecha</Label>
                  <Input
                    id="purchase-date"
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="rounded-full"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label>Proveedor</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isSubmitting}
                      onClick={() => setSupplierFormOpen(true)}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" /> Nuevo proveedor
                    </Button>
                  </div>
                  <SupplierCombobox
                    suppliers={suppliers}
                    value={supplierId}
                    onChange={setSupplierId}
                    placeholder="Seleccionar proveedor"
                  />
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {items.map((item, index) => {
                  const subtotal = (Number(item.quantity) || 0) * parseMoneyInput(item.unitCost)
                  const excludeIds = items
                    .filter((_, i) => i !== index)
                    .map((i) => i.productId)
                    .filter(Boolean)

                  return (
                    <div
                      key={index}
                      className="grid grid-cols-1 gap-3 rounded-lg border bg-muted/20 p-3 md:grid-cols-12"
                    >
                      <div className="space-y-2 md:col-span-5">
                        <div className="flex items-center justify-between gap-2">
                          <Label>Producto</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isSubmitting}
                            onClick={() => setProductCreationIndex(index)}
                          >
                            <Plus className="mr-1 h-3.5 w-3.5" /> Nuevo producto
                          </Button>
                        </div>
                        <ProductCombobox
                          products={products}
                          value={item.productId}
                          onChange={(productId, product) => {
                            updateItem(index, {
                              productId,
                              unitCost: formatMoneyInput(product.purchasePrice),
                            })
                          }}
                          excludeIds={excludeIds}
                          placeholder="Seleccionar producto"
                          className="rounded-full"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Cantidad</Label>
                        <Input
                          type="number"
                          min="1"
                          className="rounded-full"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, { quantity: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Precio unitario</Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          className="rounded-full"
                          value={
                            item.unitCost ? formatMoneyInput(parseMoneyInput(item.unitCost)) : ""
                          }
                          onChange={(e) => updateItem(index, { unitCost: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Subtotal</Label>
                        <Input readOnly className="rounded-full" value={formatCurrency(subtotal)} />
                      </div>
                      <div className="flex items-end justify-end md:col-span-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                          className="cursor-pointer hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-800 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full cursor-pointer sm:w-auto"
                    onClick={addItem}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar producto
                  </Button>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Resumen</p>
                  <div className="mt-2 space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span>Productos</span>
                      <span className="text-right font-medium">{items.length}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Total</span>
                      <span className="text-right text-lg font-semibold">
                        {formatCurrency(total)}
                      </span>
                    </div>
                    {purchaseType === "credito" && (
                      <>
                        <div className="flex items-center justify-between gap-4">
                          <span>Monto inicial</span>
                          <span className="text-right font-medium">
                            {formatCurrency(safeInitialPayment)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span>Monto a deuda</span>
                          <span className="text-right font-semibold">
                            {formatCurrency(debtAmount)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de compra</Label>
                  <Select
                    value={purchaseType}
                    onValueChange={(value: "contado" | "credito") => setPurchaseType(value)}
                  >
                    <SelectTrigger className="w-full rounded-full transition-all duration-200 hover:scale-[1.01] hover:shadow-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contado">Al contado</SelectItem>
                      <SelectItem value="credito">A crédito</SelectItem>
                    </SelectContent>
                  </Select>

                  <Label>Método de pago</Label>
                  <Select
                    value={purchaseType === "credito" ? initialPaymentMethod : paymentMethod}
                    onValueChange={(value: "efectivo" | "transferencia" | "qr") => {
                      if (purchaseType === "credito") setInitialPaymentMethod(value)
                      else setPaymentMethod(value)
                    }}
                  >
                    <SelectTrigger className="w-full rounded-full transition-all duration-200 hover:scale-[1.01] hover:shadow-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="qr">QR</SelectItem>
                    </SelectContent>
                  </Select>
                  {purchaseType === "credito" && (
                    <div className="mt-3 space-y-2">
                      <Label>Monto inicial pagado (opcional)</Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        className="rounded-full"
                        value={formatMoneyInput(initialPayment)}
                        onChange={(e) =>
                          setInitialPayment(Math.max(0, parseMoneyInput(e.target.value)))
                        }
                        placeholder="0"
                      />
                      <p className="text-xs text-muted-foreground">
                        Si no ingresás monto, se toma 0 y queda deuda por el total.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </DialogBody>
            <DialogFooter className="border-t">
              <Button
                className="w-full sm:w-auto"
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                className="w-full sm:w-auto"
                type="submit"
                disabled={
                  isSubmitting ||
                  items.some(
                    (item) =>
                      !item.productId ||
                      Number(item.quantity) <= 0 ||
                      parseMoneyInput(item.unitCost) <= 0,
                  )
                }
              >
                {isSubmitting ? "Guardando..." : "Registrar compra"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {open && supplierFormOpen && (
        <SupplierFormDialog
          open={supplierFormOpen}
          onOpenChange={setSupplierFormOpen}
          onSuccess={async (values: SupplierInput) => {
            const supplier = await onCreateSupplier(values)
            setSupplierId(String(supplier.id))
            setSupplierFormOpen(false)
          }}
        />
      )}
      {open && productCreationIndex !== null && (
        <ProductFormDialog
          open
          purchaseMode
          defaultSupplierId={supplierId}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setProductCreationIndex(null)
          }}
          onSuccess={(product) => {
            onProductCreated(product)
            updateItem(productCreationIndex, {
              productId: String(product.id),
              unitCost: formatMoneyInput(product.purchasePrice),
            })
            setProductCreationIndex(null)
            toast.success("Producto registrado y agregado a la compra")
          }}
        />
      )}
    </>
  )
}
