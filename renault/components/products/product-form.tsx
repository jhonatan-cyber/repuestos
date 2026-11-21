"use client"

import { logger } from "@/lib/logger"
import { loadList } from "@/lib/api-list"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ProductSchema } from "@/lib/validations"
import type { ProductInput } from "@/lib/types"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEffect, useState, ChangeEvent, DragEvent } from "react"
import type { Product, Supplier, EntityId } from "@/lib/types"
import { capitalizeWords } from "@/lib/format-utils"
import { BarcodeScanner } from "@/components/barcode-scanner"
import {
  Scan,
  Package,
  DollarSign,
  TrendingUp,
  Boxes,
  AlertCircle,
  Upload,
  X,
  Image as ImageIcon,
  Building2,
  Car,
} from "lucide-react"
import { toast } from "@/lib/toast"
import { SupplierCombobox } from "@/components/shared/supplier-combobox"
import { apiClient } from "@/lib/api-client"

// Formatea número con puntos de miles y 2 decimales
const formatCurrency = (value: unknown): string => {
  if (value === undefined || value === null || value === "") return ""
  const numeric = typeof value === "number" ? value : Number(value)
  if (Number.isNaN(numeric)) return ""
  return numeric.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

// Parsea string con formato argentino (puntos y coma) a número
const parseCurrencyInput = (value: string): number | undefined => {
  if (!value || value.trim() === "") return undefined
  // Reemplazar coma por punto para decimales, remover puntos de miles
  const normalized = value.replace(/\./g, "").replace(",", ".")
  const num = parseFloat(normalized)
  return isNaN(num) ? undefined : num
}

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
  categoryId: EntityId
  onSuccess: (updatedProduct?: Product) => void
}

const UNITS = ["unidad", "kg", "g", "litro", "ml", "metro", "cm", "caja", "paquete", "docena"]

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  categoryId,
  onSuccess,
}: ProductFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageUrlInput, setImageUrlInput] = useState("")
  const [isDragging, setIsDragging] = useState(false)

  const form = useForm<ProductInput>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      brand: "",
      model: "",
      categoryId: String(categoryId),
      purchasePrice: undefined,
      salePrice: undefined,
      stock: 0,
      minimumStock: 0,
      unit: "unidad",
      supplierId: "",
      image: undefined,
    },
  })

  useEffect(() => {
    fetchSuppliers()
  }, [])

  useEffect(() => {
    if (product) {
      form.reset({
        code: product.code,
        name: product.name,
        description: product.description || "",
        brand: product.brand,
        model: product.model,
        categoryId: String(product.categoryId),
        purchasePrice: product.purchasePrice ?? undefined,
        salePrice: product.salePrice ?? undefined,
        stock: product.stock ?? undefined,
        minimumStock: product.minimumStock ?? undefined,
        unit: product.unit,
        supplierId: product.supplierId ? String(product.supplierId) : "",
        image: product.image || "",
      })
      setImagePreview(product.image ?? null)
      setImageUrlInput(product.image ?? "")
    } else {
      form.reset({
        code: "",
        name: "",
        description: "",
        brand: "",
        model: "",
        categoryId: String(categoryId),
        purchasePrice: undefined,
        salePrice: undefined,
        stock: 0,
        minimumStock: 0,
        unit: "unidad",
        supplierId: "",
        image: undefined,
      })
      setImagePreview(null)
      setImageUrlInput("")
    }
  }, [product, categoryId, form])

  const readImageFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      form.setValue("image", dataUrl)
      setImagePreview(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const handleImageSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      readImageFile(file)
    } else if (file) {
      toast.error("Solo se permiten archivos de imagen.")
    }
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file && file.type.startsWith("image/")) {
      readImageFile(file)
    } else if (file) {
      toast.error("Solo se permiten archivos de imagen.")
    }
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  async function fetchSuppliers() {
    try {
      const data = await loadList<Supplier>("/api/suppliers")
      setSuppliers(data.filter((supplier) => supplier.status === "active"))
    } catch (error) {
      logger.error("Error fetching suppliers", {
        error: error instanceof Error ? error.message : error,
      })
      // Mostrar un mensaje más claro al usuario
      toast.error(
        "No se pudieron cargar los proveedores. Por favor, recargue la página e intente nuevamente.",
      )
    }
  }

  async function onSubmit(data: ProductInput) {
    try {
      setIsSubmitting(true)

      const toNumberOrZero = (value: unknown) => {
        if (value === "" || value === undefined || value === null) return 0
        const numeric = Number(value)
        return Number.isNaN(numeric) ? 0 : numeric
      }

      const processedData = {
        ...data,
        purchasePrice: toNumberOrZero(data.purchasePrice),
        salePrice: toNumberOrZero(data.salePrice),
        stock: toNumberOrZero(data.stock),
        minimumStock: toNumberOrZero(data.minimumStock),
      }

      const url = product ? `/api/products/${product.id}` : "/api/products"
      const method = product ? "PUT" : "POST"

      const responseData = await apiClient<Product>(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(processedData),
      })
      onSuccess(responseData)
      onOpenChange(false)
      form.reset()
    } catch (error) {
      logger.error("Error saving product", {
        error: error instanceof Error ? error.message : error,
      })
      toast.error(error instanceof Error ? error.message : "Error al guardar producto")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw]!">
        <DialogHeader className="border-b">
          <DialogTitle className="text-xl">
            {product ? "Editar Producto" : "Nuevo Producto"}
          </DialogTitle>
          <DialogDescription>
            {product
              ? "Modifica la información del producto"
              : "Completa el formulario para agregar un nuevo producto"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 min-h-0">
            <DialogBody className="space-y-6">
              {/* Fila 1: Código + Nombre | Imagen (misma altura) */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
                {/* Columna Izquierda: Código + Nombre */}
                <div className="space-y-5">
                  {/* Código */}
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          Código *
                        </FormLabel>
                        <div className="flex gap-2 w-full">
                          <FormControl>
                            <Input
                              placeholder="REP-REN-FIL-001"
                              className="rounded-full w-full"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="rounded-full shrink-0"
                            onClick={() => setIsScanning(true)}
                            title="Escanear código de barras"
                          >
                            <Scan className="h-4 w-4" />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {isScanning && (
                    <BarcodeScanner
                      onScan={(code) => {
                        form.setValue("code", code)
                        setIsScanning(false)
                      }}
                      onClose={() => setIsScanning(false)}
                    />
                  )}

                  {/* Nombre */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          Nombre del Producto *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: Filtro de aceite Logan 1.6"
                            className="rounded-full w-full"
                            {...field}
                            onChange={(e) => {
                              field.onChange(capitalizeWords(e.target.value))
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Columna Derecha: Imagen (misma altura que código + nombre) */}
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem className="h-full">
                      <FormLabel className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        Imagen del Producto
                      </FormLabel>
                      <FormControl>
                        <div
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          className={`rounded-2xl border-2 border-dashed p-4 transition-all min-h-35 ${
                            isDragging
                              ? "border-primary bg-primary/5 scale-[1.02]"
                              : "border-border/50 bg-muted/30"
                          }`}
                        >
                          <input
                            id="product-image-input"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageSelection}
                          />
                          {imagePreview ? (
                            <div className="space-y-3">
                              <div className="relative rounded-xl overflow-hidden bg-background flex items-center justify-center">
                                <img
                                  src={imagePreview}
                                  alt="Vista previa del producto"
                                  className="h-24 w-full object-contain"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setImagePreview(null)
                                    form.setValue("image", undefined)
                                    setImageUrlInput("")
                                  }}
                                  className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                              <div className="flex items-center justify-center">
                                <label
                                  htmlFor="product-image-input"
                                  className="cursor-pointer text-sm text-primary hover:text-primary/80 transition-colors"
                                >
                                  Cambiar
                                </label>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center min-h-25 gap-3">
                              <Upload
                                className={`h-6 w-6 ${isDragging ? "text-primary" : "text-muted-foreground"}`}
                              />
                              <div className="text-center">
                                <p className="text-sm text-muted-foreground">Arrastra o</p>
                              </div>
                              <label
                                htmlFor="product-image-input"
                                className="cursor-pointer px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs hover:bg-primary/90 transition-colors"
                              >
                                Seleccionar
                              </label>
                            </div>
                          )}

                          <div className="mt-4 space-y-2">
                            <p className="text-xs text-muted-foreground">O pegar URL de imagen</p>
                            <Input
                              type="url"
                              placeholder="https://ejemplo.com/repuesto.jpg"
                              className="rounded-full w-full"
                              value={imageUrlInput}
                              onChange={(e) => {
                                const value = e.target.value
                                setImageUrlInput(value)
                                form.setValue("image", value || undefined)
                                setImagePreview(value || null)
                              }}
                            />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Resto de campos */}
              <div className="space-y-5">
                {/* Marca y Modelo */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          Marca *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: Bosch"
                            className="rounded-full w-full"
                            {...field}
                            onChange={(e) => {
                              field.onChange(capitalizeWords(e.target.value))
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          Modelo *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: Logan / Sandero / Duster"
                            className="rounded-full w-full"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Descripción */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción (opcional)</FormLabel>
                      <FormControl>
                        <textarea
                          placeholder="Descripción detallada del producto, características técnicas, compatibilidad..."
                          className="flex min-h-[80px] w-full rounded-2xl border border-input bg-transparent px-4 py-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Proveedor y Unidad */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proveedor (opcional)</FormLabel>
                        {suppliers.length > 0 && (
                          <FormControl>
                            <SupplierCombobox
                              suppliers={suppliers}
                              value={field.value ? String(field.value) : ""}
                              onChange={field.onChange}
                              placeholder="Seleccionar proveedor de repuestos"
                            />
                          </FormControl>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidad *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-full w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {UNITS.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Precios */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="purchasePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          Precio de Compra *
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              $
                            </span>
                            <Input
                              type="text"
                              placeholder="Ej: 85,50"
                              className="rounded-full pl-7 w-full"
                              value={formatCurrency(field.value as number | undefined)}
                              onChange={(e) => {
                                const raw = e.target.value
                                field.onChange(raw === "" ? "" : parseCurrencyInput(raw))
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="salePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          Precio de Venta *
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              $
                            </span>
                            <Input
                              type="text"
                              placeholder="Ej: 120,00"
                              className="rounded-full pl-7 w-full"
                              value={formatCurrency(field.value as number | undefined)}
                              onChange={(e) => {
                                const raw = e.target.value
                                field.onChange(raw === "" ? "" : parseCurrencyInput(raw))
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Stock */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Boxes className="h-4 w-4 text-muted-foreground" />
                          Stock Actual *
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Ej: 12"
                            className="rounded-full w-full"
                            value={field.value?.toString() || ""}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value === "") {
                                field.onChange("")
                              } else {
                                const num = parseInt(value, 10)
                                field.onChange(isNaN(num) ? "" : num)
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="minimumStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          Stock Mínimo *
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Ej: 4"
                            className="rounded-full w-full"
                            value={field.value?.toString() || ""}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value === "") {
                                field.onChange("")
                              } else {
                                const num = parseInt(value, 10)
                                field.onChange(isNaN(num) ? "" : num)
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </DialogBody>

            <DialogFooter className="border-t flex justify-center gap-3 sm:justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Guardando...
                  </>
                ) : product ? (
                  "Actualizar"
                ) : (
                  "Crear"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
