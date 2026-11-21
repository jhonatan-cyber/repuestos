"use client"

import { logger } from "@/lib/logger"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { PermissionSchema, type PermissionInput } from "@/lib/validations"
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
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEffect, useState } from "react"
import type { Permission } from "@/lib/types"

interface PermissionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  permission?: Permission | null
  onSuccess: (updatedPermission?: Permission) => void
}

const MODULES = [
  "dashboard",
  "clients",
  "suppliers",
  "inventory",
  "quotations",
  "purchases",
  "sales",
  "expenses",
  "reports",
  "cash",
  "categories",
  "users",
  "roles",
  "permissions",
]

const CATEGORIES = [
  { id: "core", label: "Core" },
  { id: "sales", label: "Ventas" },
  { id: "inventory", label: "Inventario" },
  { id: "finance", label: "Finanzas" },
  { id: "admin", label: "Administración" },
]

export function PermissionFormDialog({
  open,
  onOpenChange,
  permission,
  onSuccess,
}: PermissionFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<PermissionInput>({
    resolver: zodResolver(PermissionSchema),
    defaultValues: {
      id: "",
      name: "",
      module: "",
      description: "",
      category: "core",
    },
  })

  useEffect(() => {
    if (permission) {
      form.reset({
        id: String(permission.id),
        name: permission.name,
        module: permission.module,
        description: permission.description,
        category: permission.category,
      })
    } else {
      form.reset({
        id: "",
        name: "",
        module: "",
        description: "",
        category: "core",
      })
    }
  }, [permission, form])

  async function onSubmit(data: PermissionInput) {
    try {
      setIsSubmitting(true)

      const url = permission ? `/api/permissions/${permission.id}` : "/api/permissions"
      const method = permission ? "PUT" : "POST"

      const responseData = await apiClient<Permission>(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      onSuccess(responseData)
      onOpenChange(false)
      form.reset()
    } catch (error) {
      logger.error("Error saving permission", {
        error: error instanceof Error ? error.message : error,
      })
      alert(error instanceof Error ? error.message : "Error al guardar permiso")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="border-b">
          <DialogTitle className="text-xl">
            {permission ? "Editar Permiso" : "Nuevo Permiso"}
          </DialogTitle>
          <DialogDescription>
            {permission
              ? "Modifica la información del permiso"
              : "Completa el formulario para agregar un nuevo permiso"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <DialogBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ID del Permiso */}
                <FormField
                  control={form.control}
                  name="id"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>ID del Permiso *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: view_reports, create_sales"
                          className="rounded-full"
                          disabled={!!permission}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        Identificador único en formato snake_case
                      </p>
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
                          placeholder="Ej: Ver Reportes, Crear Ventas"
                          className="rounded-full"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Módulo */}
                <FormField
                  control={form.control}
                  name="module"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Módulo *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-full">
                            <SelectValue placeholder="Seleccionar módulo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MODULES.map((module) => (
                            <SelectItem key={module} value={module}>
                              {module.charAt(0).toUpperCase() + module.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Categoría */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                          placeholder="Describe qué permite hacer este permiso"
                          rows={3}
                          {...field}
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
                {isSubmitting ? "Guardando..." : permission ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
