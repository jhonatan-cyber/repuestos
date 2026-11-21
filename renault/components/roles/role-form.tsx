"use client"

import { logger } from "@/lib/logger"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { RoleSchema, type RoleInput } from "@/lib/validations"
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
import { Checkbox } from "@/components/ui/checkbox"
import { useEffect, useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import type { Role } from "@/lib/types"

interface RoleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role?: Role | null
  onSuccess: (updatedRole?: Role) => void
}

const AVAILABLE_PERMISSIONS = [
  // ── Dashboard ──
  { id: "dashboard", label: "Ver Dashboard", category: "Dashboard" },

  // ── Clientes ──
  { id: "clients", label: "Acceso a Clientes", category: "Clientes" },
  { id: "clients.list", label: "Listar Clientes", category: "Clientes" },
  { id: "clients.create", label: "Crear Clientes", category: "Clientes" },
  { id: "clients.update", label: "Editar Clientes", category: "Clientes" },
  { id: "clients.delete", label: "Eliminar Clientes", category: "Clientes" },

  // ── Cotizaciones ──
  { id: "quotations", label: "Acceso a Cotizaciones", category: "Cotizaciones" },
  { id: "quotations.list", label: "Listar Cotizaciones", category: "Cotizaciones" },
  { id: "quotations.create", label: "Crear Cotizaciones", category: "Cotizaciones" },
  { id: "quotations.update", label: "Editar Cotizaciones", category: "Cotizaciones" },
  { id: "quotations.delete", label: "Eliminar Cotizaciones", category: "Cotizaciones" },
  { id: "quotations.convert", label: "Convertir a Venta", category: "Cotizaciones" },

  // ── Ventas ──
  { id: "sales", label: "Acceso a Ventas", category: "Ventas" },
  { id: "sales.list", label: "Listar Ventas", category: "Ventas" },
  { id: "sales.create", label: "Crear Ventas", category: "Ventas" },
  { id: "sales.update", label: "Editar Ventas", category: "Ventas" },
  { id: "sales.delete", label: "Cancelar Ventas", category: "Ventas" },

  // ── Productos ──
  { id: "products", label: "Acceso a Productos", category: "Productos" },
  { id: "products.list", label: "Listar Productos", category: "Productos" },
  { id: "products.create", label: "Crear Productos", category: "Productos" },
  { id: "products.update", label: "Editar Productos", category: "Productos" },
  { id: "products.delete", label: "Eliminar Productos", category: "Productos" },

  // ── Proveedores ──
  { id: "suppliers", label: "Acceso a Proveedores", category: "Proveedores" },
  { id: "suppliers.list", label: "Listar Proveedores", category: "Proveedores" },
  { id: "suppliers.create", label: "Crear Proveedores", category: "Proveedores" },
  { id: "suppliers.update", label: "Editar Proveedores", category: "Proveedores" },
  { id: "suppliers.delete", label: "Eliminar Proveedores", category: "Proveedores" },

  // ── Compras ──
  { id: "purchases", label: "Acceso a Compras", category: "Compras" },
  { id: "purchases.list", label: "Listar Compras", category: "Compras" },
  { id: "purchases.create", label: "Crear Compras", category: "Compras" },
  { id: "purchases.update", label: "Editar Compras", category: "Compras" },
  { id: "purchases.delete", label: "Cancelar Compras", category: "Compras" },

  // ── Categorías ──
  { id: "categories", label: "Acceso a Categorías", category: "Categorías" },
  { id: "categories.list", label: "Listar Categorías", category: "Categorías" },
  { id: "categories.create", label: "Crear Categorías", category: "Categorías" },
  { id: "categories.update", label: "Editar Categorías", category: "Categorías" },
  { id: "categories.delete", label: "Eliminar Categorías", category: "Categorías" },

  // ── Inventario ──
  { id: "inventory", label: "Ver Inventario", category: "Inventario" },
  { id: "inventory.update", label: "Actualizar Stock", category: "Inventario" },

  // ── Gastos ──
  { id: "expenses", label: "Acceso a Gastos", category: "Gastos" },
  { id: "expenses.list", label: "Listar Gastos", category: "Gastos" },
  { id: "expenses.create", label: "Crear Gastos", category: "Gastos" },
  { id: "expenses.update", label: "Editar Gastos", category: "Gastos" },
  { id: "expenses.delete", label: "Eliminar Gastos", category: "Gastos" },

  // ── Caja Diaria ──
  { id: "cash", label: "Acceso a Caja", category: "Caja" },
  { id: "cash.open", label: "Abrir Caja", category: "Caja" },
  { id: "cash.close", label: "Cerrar Caja", category: "Caja" },
  { id: "cash.withdraw", label: "Retirar de Caja", category: "Caja" },

  // ── Reportes ──
  { id: "reports", label: "Acceso a Reportes", category: "Reportes" },
  { id: "reports.view", label: "Ver Reportes", category: "Reportes" },
  { id: "reports.export", label: "Exportar Reportes", category: "Reportes" },
  { id: "reports.comparison", label: "Ver Comparativas", category: "Reportes" },

  // ── Usuarios ──
  { id: "users", label: "Acceso a Usuarios", category: "Usuarios" },
  { id: "users.list", label: "Listar Usuarios", category: "Usuarios" },
  { id: "users.create", label: "Crear Usuarios", category: "Usuarios" },
  { id: "users.update", label: "Editar Usuarios", category: "Usuarios" },
  { id: "users.delete", label: "Eliminar Usuarios", category: "Usuarios" },

  // ── Roles ──
  { id: "roles", label: "Acceso a Roles", category: "Roles" },
  { id: "roles.list", label: "Listar Roles", category: "Roles" },
  { id: "roles.create", label: "Crear Roles", category: "Roles" },
  { id: "roles.update", label: "Editar Roles", category: "Roles" },
  { id: "roles.delete", label: "Eliminar Roles", category: "Roles" },

  // ── Permisos ──
  { id: "permissions", label: "Acceso a Permisos", category: "Permisos" },
  { id: "permissions.view", label: "Ver Permisos", category: "Permisos" },
  { id: "permissions.update", label: "Asignar Permisos", category: "Permisos" },

  // ── Sincronización ──
  { id: "sync", label: "Sincronizar Bases de Datos", category: "Sistema" },
]

const PERMISSION_CATEGORIES = Array.from(new Set(AVAILABLE_PERMISSIONS.map((p) => p.category)))

/**
 * Convierte permisos simples ("clients") a granulares ("clients.list", "clients.create", ...)
 * para que los checkboxes del formulario se muestren correctamente.
 */
function expandPermissions(simple: string[]): string[] {
  if (!simple || simple.length === 0) return []

  // Si ya son permisos granulares (contienen "."), devolverlos tal cual
  if (simple.some((p) => p.includes("."))) return simple

  const allIds = AVAILABLE_PERMISSIONS.map((p) => p.id)
  const expanded: string[] = []

  for (const perm of simple) {
    // Buscar todos los IDs granulares que empiezan con el permiso simple
    const matches = allIds.filter((id) => id.startsWith(perm + "."))
    if (matches.length > 0) {
      expanded.push(...matches)
    } else {
      // Si no hay match granular, buscar por coincidencia exacta (ej: "dashboard", "reports")
      const exact = allIds.filter((id) => id.startsWith(perm))
      expanded.push(...exact)
    }
  }

  return [...new Set(expanded)]
}

/**
 * Comprime permisos granulares ("clients.list", "clients.create") a simples ("clients")
 * para guardar en el formato que usa el sistema.
 */
function compressPermissions(granular: string[]): string[] {
  if (!granular || granular.length === 0) return []

  const simple = new Set<string>()
  for (const perm of granular) {
    const module = perm.split(".")[0]
    simple.add(module)
  }
  return [...simple]
}

export function RoleFormDialog({ open, onOpenChange, role, onSuccess }: RoleFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    // Por defecto, todas las categorías están expandidas
    PERMISSION_CATEGORIES.reduce(
      (acc, category) => {
        acc[category] = true
        return acc
      },
      {} as Record<string, boolean>,
    ),
  )

  const form = useForm<RoleInput>({
    resolver: zodResolver(RoleSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: [],
    },
  })

  useEffect(() => {
    if (role) {
      form.reset({
        name: role.name,
        description: role.description,
        permissions: expandPermissions(role.permissions),
      })
    } else {
      form.reset({
        name: "",
        description: "",
        permissions: [],
      })
    }
  }, [role, form])

  // Función para generar un color aleatorio
  const generateRandomColor = () => {
    const colors = [
      "#3B82F6", // Blue
      "#10B981", // Green
      "#F59E0B", // Yellow
      "#EF4444", // Red
      "#8B5CF6", // Purple
      "#06B6D4", // Cyan
      "#F97316", // Orange
      "#84CC16", // Lime
      "#EC4899", // Pink
      "#6B7280", // Gray
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  async function onSubmit(data: RoleInput) {
    try {
      setIsSubmitting(true)

      const newRole: Role = {
        id: role?.id || crypto.randomUUID(),
        name: data.name,
        description: data.description,
        permissions: compressPermissions(data.permissions),
        color: role?.color || generateRandomColor(),
        status: "active",
        isSystem: false,
        usersCount: role?.usersCount || 0,
      }

      onSuccess(newRole)
      onOpenChange(false)
      form.reset()
    } catch (error) {
      logger.error("Error saving role", { error: error instanceof Error ? error.message : error })
      alert(error instanceof Error ? error.message : "Error al guardar rol")
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedPermissions = form.watch("permissions")

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  const getCategoryPermissionCount = (category: string) => {
    const categoryPermissions = AVAILABLE_PERMISSIONS.filter((p) => p.category === category)
    const selectedInCategory = categoryPermissions.filter((p) =>
      selectedPermissions?.includes(p.id),
    )
    return {
      selected: selectedInCategory.length,
      total: categoryPermissions.length,
    }
  }

  const toggleCategoryPermissions = (category: string) => {
    const categoryPermissions = AVAILABLE_PERMISSIONS.filter((p) => p.category === category)
    const categoryPermissionIds = categoryPermissions.map((p) => p.id)
    const { selected, total } = getCategoryPermissionCount(category)

    const currentPermissions = form.getValues("permissions") || []

    if (selected === total) {
      // Si todos están seleccionados, deseleccionar todos
      const newPermissions = currentPermissions.filter((p) => !categoryPermissionIds.includes(p))
      form.setValue("permissions", newPermissions)
    } else {
      // Si no todos están seleccionados, seleccionar todos
      const newPermissions = [...new Set([...currentPermissions, ...categoryPermissionIds])]
      form.setValue("permissions", newPermissions)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="border-b pb-4 flex-shrink-0">
          <DialogTitle className="text-xl">{role ? "Editar Rol" : "Nuevo Rol"}</DialogTitle>
          <DialogDescription>
            {role
              ? "Modifica la información del rol personalizado"
              : "Completa el formulario para crear un nuevo rol personalizado"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <DialogBody className="flex-1 overflow-y-auto space-y-6 py-4">
              {/* Nombre */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Rol *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Gerente de Ventas"
                        className="rounded-full"
                        {...field}
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
                  <FormItem>
                    <FormLabel>Descripción *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe las responsabilidades y alcance de este rol..."
                        className="min-h-[80px] rounded-2xl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Permisos */}
              <FormField
                control={form.control}
                name="permissions"
                render={() => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Permisos *</FormLabel>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const allExpanded = Object.values(expandedCategories).every(Boolean)
                            const newState = PERMISSION_CATEGORIES.reduce(
                              (acc, category) => {
                                acc[category] = !allExpanded
                                return acc
                              },
                              {} as Record<string, boolean>,
                            )
                            setExpandedCategories(newState)
                          }}
                          className="text-xs"
                        >
                          {Object.values(expandedCategories).every(Boolean)
                            ? "Colapsar Todo"
                            : "Expandir Todo"}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {PERMISSION_CATEGORIES.map((category) => {
                        const isExpanded = expandedCategories[category]
                        const { selected, total } = getCategoryPermissionCount(category)

                        return (
                          <div key={category} className="border rounded-lg">
                            {/* Header expandible */}
                            <div className="flex items-center">
                              <button
                                type="button"
                                onClick={() => toggleCategory(category)}
                                className="flex-1 flex items-center justify-between px-4 py-4 hover:bg-muted/50 transition-colors rounded-tl-lg"
                              >
                                <div className="flex items-center gap-3">
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <h4 className="font-semibold text-sm text-foreground">
                                    {category}
                                  </h4>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-muted-foreground font-medium">
                                    {selected}/{total}
                                  </span>
                                  {/* Barra de progreso mini */}
                                  <div className="w-10 h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-blue-500 transition-all duration-200"
                                      style={{
                                        width: `${total > 0 ? (selected / total) * 100 : 0}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleCategoryPermissions(category)}
                                className="px-4 py-4 text-xs font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 transition-colors border-l"
                                title={
                                  selected === total ? "Deseleccionar todos" : "Seleccionar todos"
                                }
                              >
                                {selected === total ? "Ninguno" : "Todos"}
                              </button>
                            </div>

                            {/* Contenido expandible */}
                            {isExpanded && (
                              <div className="px-4 py-4 border-t bg-muted/20">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {AVAILABLE_PERMISSIONS.filter((p) => p.category === category).map(
                                    (permission) => (
                                      <FormField
                                        key={permission.id}
                                        control={form.control}
                                        name="permissions"
                                        render={({ field }) => {
                                          return (
                                            <FormItem
                                              key={permission.id}
                                              className="flex flex-row items-center space-x-3 space-y-0 p-2 rounded-md hover:bg-background/50 transition-colors"
                                            >
                                              <FormControl>
                                                <Checkbox
                                                  checked={field.value?.includes(permission.id)}
                                                  onCheckedChange={(checked) => {
                                                    return checked
                                                      ? field.onChange([
                                                          ...field.value,
                                                          permission.id,
                                                        ])
                                                      : field.onChange(
                                                          field.value?.filter(
                                                            (value) => value !== permission.id,
                                                          ),
                                                        )
                                                  }}
                                                />
                                              </FormControl>
                                              <FormLabel className="text-sm font-normal cursor-pointer leading-relaxed">
                                                {permission.label}
                                              </FormLabel>
                                            </FormItem>
                                          )
                                        }}
                                      />
                                    ),
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <FormMessage />
                    <div className="text-xs text-muted-foreground">
                      Permisos seleccionados: {selectedPermissions?.length || 0}
                    </div>
                  </FormItem>
                )}
              />
            </DialogBody>

            <DialogFooter className="border-t pt-4 flex justify-center gap-3 sm:justify-center flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : role ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
