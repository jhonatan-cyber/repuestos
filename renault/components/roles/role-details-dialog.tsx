"use client"

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Shield,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { useState } from "react"
import type { Role } from "@/lib/types"

interface RoleDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role | null
}

const PERMISSION_LABELS: Record<string, string> = {
  // Dashboard
  "dashboard.read": "Ver Dashboard",
  "dashboard.all": "Gestionar Dashboard",

  // Clientes
  "clients.list": "Listar Clientes",
  "clients.create": "Crear Clientes",
  "clients.read": "Ver Clientes",
  "clients.update": "Editar Clientes",
  "clients.delete": "Eliminar Clientes",
  "clients.activate": "Activar Clientes",
  "clients.deactivate": "Desactivar Clientes",
  "clients.all": "Gestionar Clientes",

  // Ventas
  "sales.list": "Listar Ventas",
  "sales.create": "Crear Ventas",
  "sales.read": "Ver Ventas",
  "sales.update": "Editar Ventas",
  "sales.delete": "Eliminar Ventas",
  "sales.all": "Gestionar Ventas",

  // Compras
  "purchases.list": "Listar Compras",
  "purchases.create": "Crear Compras",
  "purchases.read": "Ver Compras",
  "purchases.update": "Editar Compras",
  "purchases.delete": "Eliminar Compras",
  "purchases.all": "Gestionar Compras",

  // Proveedores
  "suppliers.list": "Listar Proveedores",
  "suppliers.create": "Crear Proveedores",
  "suppliers.read": "Ver Proveedores",
  "suppliers.update": "Editar Proveedores",
  "suppliers.delete": "Eliminar Proveedores",
  "suppliers.activate": "Activar Proveedores",
  "suppliers.deactivate": "Desactivar Proveedores",
  "suppliers.all": "Gestionar Proveedores",

  // Inventario
  "inventory.read": "Ver Inventario",
  "inventory.all": "Gestionar Inventario",

  // Productos
  "products.list": "Listar Productos",
  "products.create": "Crear Productos",
  "products.read": "Ver Productos",
  "products.update": "Editar Productos",
  "products.delete": "Eliminar Productos",
  "products.all": "Gestionar Productos",

  // Cotizaciones
  "quotations.list": "Listar Cotizaciones",
  "quotations.create": "Crear Cotizaciones",
  "quotations.read": "Ver Cotizaciones",
  "quotations.update": "Editar Cotizaciones",
  "quotations.delete": "Eliminar Cotizaciones",
  "quotations.all": "Gestionar Cotizaciones",

  // Reportes
  "reports.read": "Ver Reportes",
  "reports.all": "Gestionar Reportes",

  // Caja
  "cash.read": "Ver Caja",
  "cash.all": "Gestionar Caja",

  // Usuarios
  "users.list": "Listar Usuarios",
  "users.create": "Crear Usuarios",
  "users.read": "Ver Usuarios",
  "users.update": "Editar Usuarios",
  "users.delete": "Eliminar Usuarios",
  "users.activate": "Activar Usuarios",
  "users.deactivate": "Desactivar Usuarios",
  "users.all": "Gestionar Usuarios",

  // Roles
  "roles.list": "Listar Roles",
  "roles.create": "Crear Roles",
  "roles.read": "Ver Roles",
  "roles.update": "Editar Roles",
  "roles.delete": "Eliminar Roles",
  "roles.activate": "Activar Roles",
  "roles.deactivate": "Desactivar Roles",
  "roles.all": "Gestionar Roles",

  // Especiales
  all: "Acceso Total al Sistema",
}

export function RoleDetailsDialog({ open, onOpenChange, role }: RoleDetailsDialogProps) {
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({})

  if (!role) return null

  const toggleModule = (module: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [module]: !prev[module],
    }))
  }

  const groupedPermissions = role.permissions.reduce(
    (acc, permission) => {
      if (permission === "all") {
        acc["Sistema"] = acc["Sistema"] || []
        acc["Sistema"].push(permission)
        return acc
      }

      const [module] = permission.split(".")
      const moduleNames: Record<string, string> = {
        dashboard: "Dashboard",
        clients: "Clientes",
        sales: "Ventas",
        purchases: "Compras",
        suppliers: "Proveedores",
        inventory: "Inventario",
        products: "Productos",
        quotations: "Cotizaciones",
        reports: "Reportes",
        cash: "Caja",
        users: "Usuarios",
        roles: "Roles",
      }

      const moduleName = moduleNames[module] || module
      acc[moduleName] = acc[moduleName] || []
      acc[moduleName].push(permission)
      return acc
    },
    {} as Record<string, string[]>,
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">{role.name}</DialogTitle>
          <DialogDescription>Información detallada del rol y sus permisos</DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6">
          {/* Información General */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Información General</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  Tipo de Rol
                </div>
                <Badge
                  variant={role.isSystem ? "default" : "secondary"}
                  className="flex items-center gap-1 w-fit"
                >
                  {role.isSystem ? "Sistema" : "Personalizado"}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {role.status === "active" ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  Estado
                </div>
                <Badge
                  variant={role.status === "active" ? "default" : "secondary"}
                  className="flex items-center gap-1 w-fit"
                >
                  {role.status === "active" ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Usuarios Asociados ({role.usersCount || 0})
                </div>
                {role.users && role.users.length > 0 ? (
                  <div className="space-y-1">
                    {role.users.map((user) => (
                      <div key={user.id} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="font-medium">{user.name}</span>
                        <span className="text-muted-foreground">({user.email})</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">
                    No hay usuarios asociados a este rol
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Descripción</div>
              <p className="text-sm">{role.description}</p>
            </div>
          </div>

          <Separator />

          {/* Permisos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Permisos ({role.permissions.length})</h3>
              <button
                type="button"
                onClick={() => {
                  const allExpanded = Object.values(expandedModules).every(Boolean)
                  const newState = Object.keys(groupedPermissions).reduce(
                    (acc, module) => {
                      acc[module] = !allExpanded
                      return acc
                    },
                    {} as Record<string, boolean>,
                  )
                  setExpandedModules(newState)
                }}
                className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
              >
                {Object.values(expandedModules).every(Boolean) ? "Colapsar Todo" : "Expandir Todo"}
              </button>
            </div>

            <div className="space-y-3">
              {Object.entries(groupedPermissions).map(([module, permissions]) => {
                const isExpanded = expandedModules[module]

                return (
                  <div key={module} className="border rounded-lg">
                    {/* Header expandible */}
                    <button
                      type="button"
                      onClick={() => toggleModule(module)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <h4 className="font-semibold text-sm text-foreground">{module}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium">
                          {permissions.length} permiso{permissions.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </button>

                    {/* Contenido expandible */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t bg-muted/20">
                        <div className="flex flex-wrap gap-2 pt-3">
                          {permissions.map((permission) => (
                            <Badge key={permission} variant="outline" className="text-xs">
                              {PERMISSION_LABELS[permission] || permission}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
