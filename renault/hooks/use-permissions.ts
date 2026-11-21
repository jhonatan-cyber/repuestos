"use client"

import { useState, useEffect, useMemo } from "react"
import { toast } from "@/lib/toast"
import type { Permission } from "@/lib/types"
import { offlineStorage } from "@/lib/offline-storage"
import { apiClient } from "@/lib/api-client"

const SYSTEM_PERMISSIONS: Permission[] = [
  // Dashboard
  {
    id: "dashboard.read",
    name: "Ver Dashboard",
    module: "dashboard",
    description: "Acceso al panel principal del sistema",
    category: "core",
    isSystem: true,
    status: "active",
    rolesCount: 4,
  },
  {
    id: "dashboard.all",
    name: "Dashboard Completo",
    module: "dashboard",
    description: "Acceso completo al dashboard con todas las métricas",
    category: "core",
    isSystem: true,
    status: "active",
    rolesCount: 1,
  },

  // Clientes
  {
    id: "clients.list",
    name: "Listar Clientes",
    module: "clients",
    description: "Ver lista de clientes",
    category: "sales",
    isSystem: true,
    status: "active",
    rolesCount: 2,
  },
  {
    id: "clients.create",
    name: "Crear Clientes",
    module: "clients",
    description: "Crear nuevos clientes",
    category: "sales",
    isSystem: true,
    status: "active",
    rolesCount: 2,
  },
  {
    id: "clients.read",
    name: "Ver Clientes",
    module: "clients",
    description: "Ver detalles de clientes",
    category: "sales",
    isSystem: true,
    status: "active",
    rolesCount: 2,
  },
  {
    id: "clients.update",
    name: "Editar Clientes",
    module: "clients",
    description: "Modificar información de clientes",
    category: "sales",
    isSystem: true,
    status: "active",
    rolesCount: 2,
  },
  {
    id: "clients.activate",
    name: "Activar Clientes",
    module: "clients",
    description: "Activar clientes desactivados",
    category: "sales",
    isSystem: true,
    status: "active",
    rolesCount: 2,
  },
  {
    id: "clients.deactivate",
    name: "Desactivar Clientes",
    module: "clients",
    description: "Desactivar clientes activos",
    category: "sales",
    isSystem: true,
    status: "active",
    rolesCount: 2,
  },

  // Ventas
  {
    id: "sales.list",
    name: "Listar Ventas",
    module: "sales",
    description: "Ver lista de ventas",
    category: "sales",
    isSystem: true,
    status: "active",
    rolesCount: 3,
  },
  {
    id: "sales.create",
    name: "Crear Ventas",
    module: "sales",
    description: "Registrar nuevas ventas",
    category: "sales",
    isSystem: true,
    status: "active",
    rolesCount: 2,
  },
  {
    id: "sales.read",
    name: "Ver Ventas",
    module: "sales",
    description: "Ver detalles de ventas",
    category: "sales",
    isSystem: true,
    status: "active",
    rolesCount: 3,
  },
  {
    id: "sales.update",
    name: "Editar Ventas",
    module: "sales",
    description: "Modificar ventas existentes",
    category: "sales",
    isSystem: true,
    status: "active",
    rolesCount: 1,
  },

  // Cotizaciones
  {
    id: "quotations.list",
    name: "Listar Cotizaciones",
    module: "quotations",
    description: "Ver lista de cotizaciones",
    category: "sales",
    isSystem: true,
    status: "active",
    rolesCount: 2,
  },
  {
    id: "quotations.create",
    name: "Crear Cotizaciones",
    module: "quotations",
    description: "Crear nuevas cotizaciones",
    category: "sales",
    isSystem: true,
    status: "active",
    rolesCount: 2,
  },
  {
    id: "quotations.read",
    name: "Ver Cotizaciones",
    module: "quotations",
    description: "Ver detalles de cotizaciones",
    category: "sales",
    isSystem: true,
    status: "active",
    rolesCount: 2,
  },
  {
    id: "quotations.update",
    name: "Editar Cotizaciones",
    module: "quotations",
    description: "Modificar cotizaciones",
    category: "sales",
    isSystem: true,
    status: "active",
    rolesCount: 2,
  },

  // Compras
  {
    id: "purchases.list",
    name: "Listar Compras",
    module: "purchases",
    description: "Ver lista de compras",
    category: "inventory",
    isSystem: true,
    status: "active",
    rolesCount: 3,
  },
  {
    id: "purchases.create",
    name: "Crear Compras",
    module: "purchases",
    description: "Registrar nuevas compras",
    category: "inventory",
    isSystem: true,
    status: "active",
    rolesCount: 2,
  },
  {
    id: "purchases.read",
    name: "Ver Compras",
    module: "purchases",
    description: "Ver detalles de compras",
    category: "inventory",
    isSystem: true,
    status: "active",
    rolesCount: 3,
  },
  {
    id: "purchases.update",
    name: "Editar Compras",
    module: "purchases",
    description: "Modificar compras",
    category: "inventory",
    isSystem: true,
    status: "active",
    rolesCount: 2,
  },
  {
    id: "purchases.delete",
    name: "Eliminar Compras",
    module: "purchases",
    description: "Eliminar compras",
    category: "inventory",
    isSystem: true,
    status: "active",
    rolesCount: 2,
  },

  // Proveedores
  {
    id: "suppliers.list",
    name: "Listar Proveedores",
    module: "suppliers",
    description: "Ver lista de proveedores",
    category: "inventory",
    isSystem: true,
    status: "active",
    rolesCount: 2,
  },
  {
    id: "suppliers.create",
    name: "Crear Proveedores",
    module: "suppliers",
    description: "Crear nuevos proveedores",
    category: "inventory",
    isSystem: true,
    status: "active",
    rolesCount: 2,
  },
  {
    id: "suppliers.read",
    name: "Ver Proveedores",
    module: "suppliers",
    description: "Ver detalles de proveedores",
    category: "inventory",
    isSystem: true,
    status: "active",
    rolesCount: 2,
  },
  {
    id: "suppliers.update",
    name: "Editar Proveedores",
    module: "suppliers",
    description: "Modificar proveedores",
    category: "inventory",
    isSystem: true,
    status: "active",
    rolesCount: 2,
  },
  {
    id: "suppliers.activate",
    name: "Activar Proveedores",
    module: "suppliers",
    description: "Activar proveedores",
    category: "inventory",
    isSystem: true,
    status: "active",
    rolesCount: 2,
  },
  {
    id: "suppliers.deactivate",
    name: "Desactivar Proveedores",
    module: "suppliers",
    description: "Desactivar proveedores",
    category: "inventory",
    isSystem: true,
    status: "active",
    rolesCount: 2,
  },

  // Inventario
  {
    id: "inventory.read",
    name: "Ver Inventario",
    module: "inventory",
    description: "Consultar inventario y stock",
    category: "inventory",
    isSystem: true,
    status: "active",
    rolesCount: 4,
  },
  {
    id: "inventory.update",
    name: "Actualizar Inventario",
    module: "inventory",
    description: "Modificar stock y productos",
    category: "inventory",
    isSystem: true,
    status: "active",
    rolesCount: 2,
  },

  // Productos
  {
    id: "products.list",
    name: "Listar Productos",
    module: "products",
    description: "Ver lista de productos",
    category: "inventory",
    isSystem: true,
    status: "active",
    rolesCount: 4,
  },
  {
    id: "products.create",
    name: "Crear Productos",
    module: "products",
    description: "Crear nuevos productos",
    category: "inventory",
    isSystem: true,
    status: "active",
    rolesCount: 2,
  },
  {
    id: "products.read",
    name: "Ver Productos",
    module: "products",
    description: "Ver detalles de productos",
    category: "inventory",
    isSystem: true,
    status: "active",
    rolesCount: 4,
  },
  {
    id: "products.update",
    name: "Editar Productos",
    module: "products",
    description: "Modificar productos",
    category: "inventory",
    isSystem: true,
    status: "active",
    rolesCount: 2,
  },
  {
    id: "products.delete",
    name: "Eliminar Productos",
    module: "products",
    description: "Eliminar productos",
    category: "inventory",
    isSystem: true,
    status: "active",
    rolesCount: 2,
  },

  // Reportes
  {
    id: "reports.read",
    name: "Ver Reportes",
    module: "reports",
    description: "Acceso a reportes del sistema",
    category: "finance",
    isSystem: true,
    status: "active",
    rolesCount: 3,
  },
  {
    id: "reports.export",
    name: "Exportar Reportes",
    module: "reports",
    description: "Exportar reportes en diferentes formatos",
    category: "finance",
    isSystem: true,
    status: "active",
    rolesCount: 2,
  },

  // Caja
  {
    id: "cash.read",
    name: "Ver Caja",
    module: "cash",
    description: "Consultar estado de caja",
    category: "finance",
    isSystem: true,
    status: "active",
    rolesCount: 2,
  },
  {
    id: "cash.open",
    name: "Abrir Caja",
    module: "cash",
    description: "Abrir caja diaria",
    category: "finance",
    isSystem: true,
    status: "active",
    rolesCount: 2,
  },
  {
    id: "cash.close",
    name: "Cerrar Caja",
    module: "cash",
    description: "Cerrar caja diaria",
    category: "finance",
    isSystem: true,
    status: "active",
    rolesCount: 2,
  },
  {
    id: "cash.update",
    name: "Actualizar Caja",
    module: "cash",
    description: "Modificar registros de caja",
    category: "finance",
    isSystem: true,
    status: "active",
    rolesCount: 2,
  },

  // Administración
  {
    id: "all",
    name: "Acceso Total",
    module: "admin",
    description: "Acceso completo a todas las funcionalidades del sistema",
    category: "admin",
    isSystem: true,
    status: "active",
    rolesCount: 1,
  },
]

export function usePermissions() {
  const [customPermissions, setCustomPermissions] = useState<Permission[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all")
  const [category, setCategory] = useState<string>("all")
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null)
  const [permissionToDelete, setPermissionToDelete] = useState<Permission | null>(null)

  useEffect(() => {
    fetchPermissions()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, pageSize, status, category])

  async function fetchPermissions() {
    try {
      setIsLoading(true)

      // Intentar cargar desde la API
      try {
        const data = await apiClient<Permission[]>("/api/permissions")
        const customPerms = Array.isArray(data) ? data.filter((p: Permission) => !p.isSystem) : []
        setCustomPermissions(customPerms)

        // Guardar en cache offline
        await offlineStorage.setList("permissions", [...SYSTEM_PERMISSIONS, ...customPerms])
      } catch {
        // Cargar desde cache offline
        const cachedPermissions = await offlineStorage.getList<Permission>("permissions")
        const customPerms = cachedPermissions.filter((p) => !p.isSystem)
        setCustomPermissions(customPerms)
      }
    } catch (error) {
      // Cargar desde cache offline como fallback
      try {
        const cachedPermissions = await offlineStorage.getList<Permission>("permissions")
        const customPerms = cachedPermissions.filter((p) => !p.isSystem)
        setCustomPermissions(customPerms)
      } catch (cacheError) {
        toast.error("Error al cargar permisos")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Combinar permisos del sistema con permisos personalizados
  const allPermissions = useMemo(() => {
    return [...SYSTEM_PERMISSIONS, ...customPermissions]
  }, [customPermissions])

  // Filtrar permisos
  const filteredPermissions = useMemo(() => {
    let filtered = [...allPermissions]

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (permission) =>
          permission.name.toLowerCase().includes(searchLower) ||
          permission.module.toLowerCase().includes(searchLower) ||
          (permission.description ?? "").toLowerCase().includes(searchLower),
      )
    }

    if (status !== "all") {
      filtered = filtered.filter((permission) => permission.status === status)
    }

    if (category !== "all") {
      filtered = filtered.filter((permission) => permission.category === category)
    }

    return filtered
  }, [allPermissions, search, status, category])

  const paginatedPermissions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredPermissions.slice(startIndex, endIndex)
  }, [filteredPermissions, currentPage, pageSize])

  const totalPages = Math.ceil(filteredPermissions.length / pageSize)

  function handleEdit(permission: Permission) {
    if (permission.isSystem) {
      toast.error("No se pueden editar permisos del sistema")
      return
    }
    setSelectedPermission(permission)
    setFormOpen(true)
  }

  function handleDelete(permission: Permission) {
    if (permission.isSystem) {
      toast.error("No se pueden eliminar permisos del sistema")
      return
    }

    if (permission.rolesCount && permission.rolesCount > 0) {
      toast.error(
        `No se puede eliminar el permiso "${permission.name}" porque está asignado a ${permission.rolesCount} rol(es). Desactívalo primero.`,
      )
      return
    }

    setPermissionToDelete(permission)
    setDeleteDialogOpen(true)
  }

  async function handleToggleStatus(permission: Permission) {
    if (permission.isSystem) {
      toast.error("No se puede cambiar el estado de permisos del sistema")
      return
    }

    try {
      const newStatus = permission.status === "active" ? "inactive" : "active"

      // Actualizar en la API
      await apiClient(`/api/permissions/${permission.id}/toggle-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      // Actualizar estado local
      setCustomPermissions((prevPermissions) =>
        prevPermissions.map((p) => (p.id === permission.id ? { ...p, status: newStatus } : p)),
      )

      // Actualizar cache offline
      const updatedPermissions = allPermissions.map((p) =>
        p.id === permission.id ? { ...p, status: newStatus } : p,
      )
      await offlineStorage.setList("permissions", updatedPermissions)

      toast.success(
        `Permiso "${permission.name}" ${newStatus === "active" ? "activado" : "desactivado"} correctamente`,
      )
    } catch (error) {
      toast.error("Error al cambiar estado del permiso")
    }
  }

  function handleNewPermission() {
    setSelectedPermission(null)
    setFormOpen(true)
  }

  async function confirmDelete() {
    if (!permissionToDelete || permissionToDelete.isSystem) return

    try {
      // Eliminar de la API
      await apiClient(`/api/permissions/${permissionToDelete.id}`, {
        method: "DELETE",
      })

      // Remover del estado local
      setCustomPermissions((prevPermissions) =>
        prevPermissions.filter((p) => p.id !== permissionToDelete.id),
      )

      // Actualizar cache offline
      const updatedPermissions = allPermissions.filter((p) => p.id !== permissionToDelete.id)
      await offlineStorage.setList("permissions", updatedPermissions)

      toast.success("Permiso eliminado correctamente")
    } catch (error) {
      toast.error("Error al eliminar permiso")
    } finally {
      setDeleteDialogOpen(false)
      setPermissionToDelete(null)
    }
  }

  async function handleFormSuccess(updatedPermission?: Permission) {
    try {
      if (selectedPermission && updatedPermission) {
        // Actualizar permiso existente
        setCustomPermissions((prevPermissions) =>
          prevPermissions.map((p) => (p.id === selectedPermission.id ? updatedPermission : p)),
        )

        // Actualizar cache offline
        const updatedPermissions = allPermissions.map((p) =>
          p.id === selectedPermission.id ? updatedPermission : p,
        )
        await offlineStorage.setList("permissions", updatedPermissions)

        toast.success("Permiso actualizado correctamente")
      } else if (updatedPermission) {
        // Agregar nuevo permiso
        setCustomPermissions((prevPermissions) => [...prevPermissions, updatedPermission])

        // Actualizar cache offline
        await offlineStorage.setList("permissions", [...allPermissions, updatedPermission])

        toast.success("Permiso creado correctamente")
      }
      setSelectedPermission(null)
    } catch (error) {
      toast.error("Error al guardar permiso")
    }
  }

  // Calcular estadísticas
  const stats = useMemo(
    () => ({
      totalPermissions: allPermissions.length,
      activePermissions: allPermissions.filter((p) => p.status === "active").length,
      inactivePermissions: allPermissions.filter((p) => p.status === "inactive").length,
      systemPermissions: allPermissions.filter((p) => p.isSystem).length,
      customPermissions: allPermissions.filter((p) => !p.isSystem).length,
    }),
    [allPermissions],
  )

  return {
    permissions: paginatedPermissions,
    allPermissions,
    isLoading,
    search,
    setSearch,
    status,
    setStatus,
    category,
    setCategory,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems: filteredPermissions.length,
    formOpen,
    setFormOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    selectedPermission,
    permissionToDelete,
    stats,
    handleEdit,
    handleDelete,
    handleToggleStatus,
    handleNewPermission,
    confirmDelete,
    handleFormSuccess,
  }
}
