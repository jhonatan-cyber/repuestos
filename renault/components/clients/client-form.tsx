"use client"

import { logger } from "@/lib/logger"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ClientSchema, type ClientInput } from "@/lib/validations"
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
import type { Client } from "@/lib/types"
import { toast } from "@/lib/toast"

interface ClientFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Client | null
  onSuccess: (updatedClient?: Client) => void
}

export function ClientFormDialog({ open, onOpenChange, client, onSuccess }: ClientFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ClientInput>({
    resolver: zodResolver(ClientSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
    },
  })

  useEffect(() => {
    if (client) {
      form.reset({
        name: client.name,
        phone: client.phone,
        address: client.address || "",
      })
    } else {
      form.reset({
        name: "",
        phone: "",
        address: "",
      })
    }
  }, [client, form])

  async function onSubmit(data: ClientInput) {
    try {
      setIsSubmitting(true)

      const url = client ? `/api/clients/${client.id}` : "/api/clients"
      const method = client ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al guardar cliente")
      }

      const responseData = await response.json()
      onSuccess(responseData)
      onOpenChange(false)
      form.reset()
    } catch (error) {
      logger.error("Error saving client", { error: error instanceof Error ? error.message : error })
      toast.error(error instanceof Error ? error.message : "Error al guardar cliente")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="border-b">
          <DialogTitle className="text-xl">
            {client ? "Editar Cliente" : "Nuevo Cliente"}
          </DialogTitle>
          <DialogDescription>
            {client
              ? "Modifica la información del cliente"
              : "Completa el formulario para agregar un nuevo cliente"}
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
                      <FormLabel>Nombre / Razón Social *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nombre del cliente"
                          className="rounded-full"
                          {...field}
                          onChange={(e) => {
                            const val = e.target.value
                            const capitalized = val.replace(/\b\w/g, (l) => l.toUpperCase())
                            field.onChange(capitalized)
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
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Cra 10 # 20-30"
                          className="rounded-full"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const val = e.target.value
                            const capitalized = val.replace(/\b\w/g, (l) => l.toUpperCase())
                            field.onChange(capitalized)
                          }}
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
                {isSubmitting ? "Guardando..." : client ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
