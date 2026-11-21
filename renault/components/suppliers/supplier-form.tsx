"use client"

import { logger } from "@/lib/logger"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { SupplierSchema, type SupplierInput } from "@/lib/validations"
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
import { useEffect, useState } from "react"
import type { Supplier } from "@/lib/types"
import { capitalizeWordsPreservingCase } from "@/lib/format-utils"

interface SupplierFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier?: Supplier | null
  onSuccess: (data: any) => void
}

export function SupplierFormDialog({
  open,
  onOpenChange,
  supplier,
  onSuccess,
}: SupplierFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<SupplierInput>({
    resolver: zodResolver(SupplierSchema),
    defaultValues: {
      name: "",
      company: "",
      phone: "",
      direccion: "",
      address: "",
    },
  })

  useEffect(() => {
    if (supplier) {
      form.reset({
        name: supplier.name,
        company: supplier.company || "",
        phone: supplier.phone,
        direccion: supplier.direccion || "",
        address: supplier.address || "",
      })
    } else {
      form.reset({
        name: "",
        company: "",
        phone: "",
        direccion: "",
        address: "",
      })
    }
  }, [supplier, form])

  async function onSubmit(data: SupplierInput) {
    try {
      setIsSubmitting(true)
      await onSuccess(data)
      form.reset()
    } catch (error) {
      logger.error("Error saving supplier", {
        error: error instanceof Error ? error.message : error,
      })
      // El error ya se maneja en el hook
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="border-b">
          <DialogTitle className="text-xl">
            {supplier ? "Editar Proveedor" : "Nuevo Proveedor"}
          </DialogTitle>
          <DialogDescription>
            {supplier
              ? "Modifica la información del proveedor"
              : "Completa el formulario para agregar un nuevo proveedor"}
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
                    <FormItem>
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nombre del proveedor"
                          className="rounded-full"
                          {...field}
                          onChange={(event) => {
                            field.onChange(capitalizeWordsPreservingCase(event.target.value))
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Empresa */}
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nombre de la empresa"
                          className="rounded-full"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(event) => {
                            field.onChange(capitalizeWordsPreservingCase(event.target.value))
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Teléfono */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono *</FormLabel>
                      <FormControl>
                        <Input placeholder="+57 300 123 4567" className="rounded-full" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Dirección */}
                <FormField
                  control={form.control}
                  name="direccion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Calle 10 # 15-20, Ciudad"
                          className="rounded-full"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Notas adicionales */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Notas adicionales</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Información adicional del proveedor (opcional)"
                          rows={2}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
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
                {isSubmitting ? "Guardando..." : supplier ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
