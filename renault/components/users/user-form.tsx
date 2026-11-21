"use client"

import { logger } from "@/lib/logger"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { UserSchema, type UserInput } from "@/lib/validations"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEffect, useState } from "react"
import type { User } from "@/lib/types"
import { useRoles } from "@/hooks/use-roles"

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User | null
  onSuccess: (updatedUser?: User) => void
}

export function UserFormDialog({ open, onOpenChange, user, onSuccess }: UserFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { allRoles } = useRoles()

  const form = useForm<UserInput>({
    resolver: zodResolver(UserSchema),
    defaultValues: {
      ci: "",
      firstName: "",
      lastName: "",
      address: "",
      phone: "",
      email: "",
      role: "invitado",
      status: "active",
    },
  })

  useEffect(() => {
    if (user) {
      form.reset({
        ci: user.ci,
        firstName: user.firstName,
        lastName: user.lastName,
        address: user.address,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
      })
    } else {
      form.reset({
        ci: "",
        firstName: "",
        lastName: "",
        address: "",
        phone: "",
        email: "",
        role: "invitado",
        status: "active",
      })
    }
  }, [user, form])

  async function onSubmit(data: UserInput) {
    try {
      setIsSubmitting(true)

      const url = user ? `/api/users/${user.id}` : "/api/users"
      const method = user ? "PUT" : "POST"

      // Para nuevos usuarios, la contraseña será el CI hasheado
      // Para edición, mantener la contraseña actual
      const submitData = {
        ...data,
        status: user ? data.status : "active", // Siempre activo para nuevos usuarios
        // La contraseña se manejará en el backend (CI hasheado para nuevos usuarios)
      }

      const responseData = await apiClient<User>(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      })
      onSuccess(responseData)
      onOpenChange(false)
      form.reset()
    } catch (error) {
      logger.error("Error saving user", { error: error instanceof Error ? error.message : error })
      alert(error instanceof Error ? error.message : "Error al guardar usuario")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="border-b">
          <DialogTitle className="text-xl">{user ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
          <DialogDescription>
            {user
              ? "Modifica la información del usuario"
              : "Completa el formulario para agregar un nuevo usuario"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <DialogBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* CI */}
                <FormField
                  control={form.control}
                  name="ci"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CI *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 12345678" className="rounded-full" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="usuario@empresa.com"
                          className="rounded-full"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Nombre */}
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Juan" className="rounded-full" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Apellido */}
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Pérez" className="rounded-full" {...field} />
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
                        <Input placeholder="Ej: 70123456" className="rounded-full" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Rol */}
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rol *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-full w-full">
                            <SelectValue placeholder="Seleccionar rol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {allRoles
                            .filter((role) => role.status === "active") // Solo roles activos
                            .map((role) => (
                              <SelectItem key={role.id} value={role.name.toLowerCase()}>
                                {role.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Dirección - Campo completo */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Av. Siempre Viva 123, Zona Central"
                        className="rounded-full"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Solo mostrar estado al editar */}
              {user && (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-full">
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Activo</SelectItem>
                          <SelectItem value="inactive">Inactivo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Información sobre contraseña */}
              {!user && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    <strong>Nota:</strong> La contraseña inicial será el número de CI hasheado. El
                    usuario podrá cambiarla después del primer inicio de sesión.
                  </p>
                </div>
              )}
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
                {isSubmitting ? "Guardando..." : user ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
