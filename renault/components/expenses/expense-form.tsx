"use client"

import { formatDateLocal } from "@/lib/dates"

import { logger } from "@/lib/logger"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ExpenseSchema, type ExpenseInput } from "@/lib/validations"
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
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { X } from "lucide-react"
import type { Expense } from "@/lib/types"
import { capitalizeWordsPreservingCase } from "@/lib/format-utils"

interface ExpenseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense?: Expense | null
  onSuccess: (updatedExpense?: Expense) => void
}

const SUGGESTED_CATEGORIES = [
  "Servicios",
  "Alquiler",
  "Salarios",
  "Mantenimiento",
  "Marketing",
  "Transporte",
  "Suministros",
  "Alimentación",
  "Tecnología",
  "Otros",
]

const formatAmountWithThousands = (value: number): string =>
  new Intl.NumberFormat("es-BO", { maximumFractionDigits: 0 }).format(
    Math.max(0, Math.trunc(value || 0)),
  )

export function ExpenseFormDialog({
  open,
  onOpenChange,
  expense,
  onSuccess,
}: ExpenseFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categoryInput, setCategoryInput] = useState("")
  const [isAmountFocused, setIsAmountFocused] = useState(false)

  const form = useForm<ExpenseInput>({
    resolver: zodResolver(ExpenseSchema),
    defaultValues: {
      name: "",
      amount: 0,
      description: "",
      category: "",
      date: formatDateLocal(new Date()),
    },
  })

  useEffect(() => {
    if (expense) {
      form.reset({
        name: expense.name,
        amount: expense.amount,
        description: expense.description,
        category: expense.category || "",
        date: new Date(expense.date).toISOString().split("T")[0],
      })
      setCategoryInput(expense.category || "")
    } else {
      form.reset({
        name: "",
        amount: 0,
        description: "",
        category: "",
        date: formatDateLocal(new Date()),
      })
      setCategoryInput("")
    }
  }, [expense, form])

  async function onSubmit(data: ExpenseInput) {
    try {
      setIsSubmitting(true)

      const url = expense ? `/api/expenses/${expense.id}` : "/api/expenses"
      const method = expense ? "PUT" : "POST"

      const responseData = await apiClient<Expense>(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          category: categoryInput.trim() || undefined,
        }),
      })
      onSuccess(responseData)
      onOpenChange(false)
      form.reset()
      setCategoryInput("")
    } catch (error) {
      logger.error("Error saving expense", {
        error: error instanceof Error ? error.message : error,
      })
      alert(error instanceof Error ? error.message : "Error al guardar gasto")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCategorySelect = (category: string) => {
    setCategoryInput(category)
    form.setValue("category", category)
  }

  const handleCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCategoryInput(value)
    form.setValue("category", value)
  }

  const clearCategory = () => {
    setCategoryInput("")
    form.setValue("category", "")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="border-b">
          <DialogTitle className="text-xl">{expense ? "Editar Gasto" : "Nuevo Gasto"}</DialogTitle>
          <DialogDescription>
            {expense
              ? "Modifica la información del gasto"
              : "Completa el formulario para agregar un nuevo gasto"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <DialogBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Nombre del Gasto *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Servicios públicos, Almuerzo cliente..."
                          className="rounded-full"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(capitalizeWordsPreservingCase(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Monto */}
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto *</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          className="rounded-full"
                          {...field}
                          value={
                            isAmountFocused && (Number(field.value) || 0) === 0
                              ? ""
                              : formatAmountWithThousands(Number(field.value) || 0)
                          }
                          onFocus={() => setIsAmountFocused(true)}
                          onBlur={() => setIsAmountFocused(false)}
                          onChange={(e) => {
                            const numericValue = Number(e.target.value.replace(/\D/g, "")) || 0
                            field.onChange(numericValue)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Fecha */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="rounded-full"
                          {...field}
                          value={
                            typeof field.value === "string"
                              ? field.value
                              : new Date(field.value).toISOString().split("T")[0]
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Descripción */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Descripción *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe detalladamente el gasto..."
                          className="rounded-lg resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Categoría */}
                <div className="md:col-span-2 space-y-3">
                  <FormLabel>Categoría (Opcional)</FormLabel>
                  <div className="space-y-3">
                    <div className="relative">
                      <Input
                        className="rounded-full pr-8"
                        placeholder="Escribe una categoría personalizada..."
                        value={categoryInput}
                        onChange={handleCategoryInputChange}
                      />
                      {categoryInput && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                          onClick={clearCategory}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {SUGGESTED_CATEGORIES.map((category) => (
                        <Badge
                          key={category}
                          variant={categoryInput === category ? "default" : "outline"}
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                          onClick={() => handleCategorySelect(category)}
                        >
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
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
                {isSubmitting ? "Guardando..." : expense ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
