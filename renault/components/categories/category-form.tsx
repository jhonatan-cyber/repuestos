"use client"

import { logger } from "@/lib/logger"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CategorySchema, type CategoryInput } from "@/lib/validations"
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
import { useEffect, useState } from "react"
import type { Category } from "@/lib/types"
import { toast } from "@/lib/toast"
import { capitalizeWords } from "@/lib/format-utils"

// Capitaliza solo la primera letra de la oración, respetando mayúsculas del medio
// "Este es un PRODUCTO test" → "Este es un PRODUCTO test"
const capitalizeFirstLetter = (text: string): string => {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// Helper to generate random color
const generateRandomColor = () => {
  const colors = [
    "#EF4444",
    "#DC2626",
    "#F59E0B",
    "#3B82F6",
    "#10B981",
    "#8B5CF6",
    "#F97316",
    "#06B6D4",
    "#6366F1",
    "#EC4899",
    "#14B8A6",
    "#F43F5E",
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
  onSuccess: (updatedCategory?: Category) => void
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: CategoryFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CategoryInput>({
    resolver: zodResolver(CategorySchema),
    defaultValues: {
      name: "",
      color: "#3b82f6",
      description: "",
    },
  })

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        color: category.color,
        description: category.description || "",
      })
    } else {
      form.reset({
        name: "",
        color: generateRandomColor(),
        description: "",
      })
    }
  }, [category, form])

  async function onSubmit(data: CategoryInput) {
    try {
      setIsSubmitting(true)

      // Aplicar capitalización
      const formattedData = {
        ...data,
        name: capitalizeWords(data.name),
        description: data.description ? capitalizeFirstLetter(data.description) : "",
      }

      const url = category ? `/api/categories/${category.id}` : "/api/categories"
      const method = category ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formattedData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al guardar categoría")
      }

      const responseData = await response.json()
      onSuccess(responseData)
      onOpenChange(false)
      form.reset()
    } catch (error) {
      logger.error("Error saving category", {
        error: error instanceof Error ? error.message : error,
      })
      toast.error({
        title: "Error al guardar",
        description: error instanceof Error ? error.message : "Error desconocido",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="border-b">
          <DialogTitle className="text-xl">
            {category ? "Editar Categoría" : "Nueva Categoría"}
          </DialogTitle>
          <DialogDescription>
            {category
              ? "Modifica la información de la categoría"
              : "Completa el formulario para agregar una nueva categoría de productos"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <DialogBody className="space-y-4">
              {/* Nombre */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nombre de la categoría (ej: Frenos, Amortiguadores)"
                        className="rounded-full"
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

              {/* Color - Random auto-generated */}
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => {
                  // Generate random color on mount if empty
                  const randomColor = () => {
                    const colors = [
                      "#EF4444",
                      "#DC2626",
                      "#F59E0B",
                      "#3B82F6",
                      "#10B981",
                      "#8B5CF6",
                      "#F97316",
                      "#06B6D4",
                      "#6366F1",
                      "#EC4899",
                      "#14B8A6",
                      "#F43F5E",
                    ]
                    return colors[Math.floor(Math.random() * colors.length)]
                  }

                  return (
                    <FormItem>
                      <FormLabel>Color Distintivo</FormLabel>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full border-2 shadow-sm"
                          style={{ backgroundColor: field.value || "#3b82f6" }}
                        />
                        <span className="text-sm text-muted-foreground">Color auto-generado</span>
                      </div>
                    </FormItem>
                  )
                }}
              />

              {/* Descripción */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Breve descripción de la categoría"
                        className="rounded-full"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          field.onChange(capitalizeFirstLetter(e.target.value))
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </DialogBody>

            <DialogFooter className="border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : category ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
