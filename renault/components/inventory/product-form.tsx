"use client"

import { loadList } from "@/lib/api-list"

import { logger } from "@/lib/logger"
import { toast } from "@/lib/toast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ProductSchema } from "@/lib/validations"
import type { ProductInput } from "@/lib/types"
import { apiClient } from "@/lib/api-client"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import type { Product, Category, Supplier } from "@/lib/types"

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
  onSuccess: (product: Product) => void
  purchaseMode?: boolean
  defaultSupplierId?: string
}

function readNumberInput(input: HTMLInputElement): number | null {
  const value = input.valueAsNumber
  // Preserve an empty controlled field instead of restoring its numeric default.
  return Number.isFinite(value) ? value : null
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
  purchaseMode = false,
  defaultSupplierId = "",
}: ProductFormDialogProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ProductInput>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      code: "",
      name: "",
      brand: "",
      model: "",
      description: "",
      image: null,
      categoryId: "",
      purchasePrice: 0,
      salePrice: 0,
      stock: 0,
      minimumStock: 0,
      unit: "unidad",
      supplierId: "",
    },
  })

  useEffect(() => {
    if (!open) return
    fetchCategories()
    fetchSuppliers()
  }, [open])

  useEffect(() => {
    if (product) {
      form.reset({
        code: product.code,
        name: product.name,
        brand: product.brand || "",
        model: product.model || "",
        description: product.description || "",
        image: product.image,
        categoryId: String(product.categoryId),
        purchasePrice: product.purchasePrice,
        salePrice: product.salePrice,
        stock: product.stock,
        minimumStock: product.minimumStock,
        unit: product.unit,
        supplierId: product.supplierId ? String(product.supplierId) : "",
      })
    } else {
      form.reset({
        code: "",
        name: "",
        brand: "",
        model: "",
        description: "",
        image: null,
        categoryId: "",
        purchasePrice: 0,
        salePrice: 0,
        stock: 0,
        minimumStock: 0,
        unit: "unidad",
        supplierId: defaultSupplierId,
      })
    }
  }, [product, form, open, defaultSupplierId])

  async function fetchCategories() {
    try {
      const data = await apiClient<Category[]>("/api/categories")
      setCategories(Array.isArray(data) ? data.filter((c: Category) => c.type === "product") : [])
    } catch (error) {
      logger.error("Error fetching categories", {
        error: error instanceof Error ? error.message : error,
      })
    }
  }

  async function fetchSuppliers() {
    try {
      setSuppliers(await loadList<Supplier>("/api/suppliers"))
    } catch (error) {
      logger.error("Error fetching suppliers", {
        error: error instanceof Error ? error.message : error,
      })
    }
  }

  async function onSubmit(data: ProductInput) {
    try {
      setIsSubmitting(true)

      const url = product ? `/api/products/${product.id}` : "/api/products"
      const method = product ? "PUT" : "POST"

      const savedProduct = await apiClient<Product>(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(purchaseMode && !product ? { ...data, stock: 0 } : data),
      })
      onSuccess({
        ...data,
        ...savedProduct,
        categoryId: String(data.categoryId),
        category: categories.find((category) => String(category.id) === String(data.categoryId))
          ?.name,
        supplierId: data.supplierId ? String(data.supplierId) : null,
        supplierName: suppliers.find((supplier) => String(supplier.id) === String(data.supplierId))
          ?.name,
        image: savedProduct.image ?? null,
        lastSyncedAt: savedProduct.lastSyncedAt ?? null,
      })
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
      <DialogContent className="max-w-2xl">
        <DialogHeader className="border-b">
          <DialogTitle className="text-xl">
            {product ? "Editar Producto" : "Nuevo Producto"}
          </DialogTitle>
          <DialogDescription>
            {product
              ? "Modifica la información del producto"
              : purchaseMode
                ? "Selecciona la categoría y registra el producto. El stock se actualizará al registrar la compra."
                : "Completa el formulario para agregar un nuevo producto al inventario"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <DialogBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Código */}
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="PROD-001"
                          className="rounded-full"
                          style={{ textTransform: "uppercase" }}
                          value={String(field.value ?? "").toUpperCase()}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Nombre */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nombre del producto"
                          className="rounded-full"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {(["brand", "model"] as const).map((name) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{name === "brand" ? "Marca *" : "Modelo *"}</FormLabel>
                        <FormControl>
                          <Input className="rounded-full" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}

                {/* Categoría */}
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value?.toString() || ""}>
                        <FormControl>
                          <SelectTrigger className="rounded-full">
                            <SelectValue placeholder="Seleccionar categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Proveedor */}
                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proveedor (opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value?.toString() || ""}>
                        <FormControl>
                          <SelectTrigger className="rounded-full">
                            <SelectValue placeholder="Seleccionar proveedor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id.toString()}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Precio de Compra */}
                <FormField
                  control={form.control}
                  name="purchasePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio de Compra *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="rounded-full"
                          {...field}
                          value={Number.isFinite(field.value) ? field.value : ""}
                          onChange={(e) => field.onChange(readNumberInput(e.currentTarget))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Precio de Venta */}
                <FormField
                  control={form.control}
                  name="salePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio de Venta *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="rounded-full"
                          {...field}
                          value={Number.isFinite(field.value) ? field.value : ""}
                          onChange={(e) => field.onChange(readNumberInput(e.currentTarget))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Stock */}
                {!purchaseMode && (
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock Actual</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            className="rounded-full"
                            {...field}
                            value={Number.isFinite(field.value) ? field.value : ""}
                            onChange={(e) => field.onChange(readNumberInput(e.currentTarget))}
                            onBlur={(e) => {
                              if (!Number.isFinite(e.currentTarget.valueAsNumber)) field.onChange(0)
                              field.onBlur()
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Stock Mínimo */}
                <FormField
                  control={form.control}
                  name="minimumStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Mínimo</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          className="rounded-full"
                          {...field}
                          value={Number.isFinite(field.value) ? field.value : ""}
                          onChange={(e) => field.onChange(readNumberInput(e.currentTarget))}
                          onBlur={(e) => {
                            if (!Number.isFinite(e.currentTarget.valueAsNumber)) field.onChange(0)
                            field.onBlur()
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Unidad */}
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidad de Medida</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unidad">Unidad</SelectItem>
                          <SelectItem value="kg">Kilogramo</SelectItem>
                          <SelectItem value="g">Gramo</SelectItem>
                          <SelectItem value="l">Litro</SelectItem>
                          <SelectItem value="ml">Mililitro</SelectItem>
                          <SelectItem value="m">Metro</SelectItem>
                          <SelectItem value="cm">Centímetro</SelectItem>
                          <SelectItem value="caja">Caja</SelectItem>
                          <SelectItem value="paquete">Paquete</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </DialogBody>

            <DialogFooter className="border-t flex justify-center gap-3 sm:justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : product ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
