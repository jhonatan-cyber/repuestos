"use client"

import { useState, useEffect, useMemo } from "react"
import { toast } from "@/lib/toast"
import type { Supplier, SupplierInput } from "@/lib/types"
import { loadList } from "@/lib/api-list"
import { offlineStorage } from "@/lib/offline-storage"

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all")
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null)
  const [supplierToView, setSupplierToView] = useState<Supplier | null>(null)
  const [supplierToToggle, setSupplierToToggle] = useState<Supplier | null>(null)

  const fetchWithAuthRetry = async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await fetch(input, { ...init, credentials: "include" })

    if (response.status !== 401) {
      return response
    }

    const refreshResponse = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    })

    if (!refreshResponse.ok) {
      return response
    }

    return fetch(input, { ...init, credentials: "include" })
  }

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Intentar obtener datos del servidor
      const list = await loadList<Supplier>("/api/suppliers", async (url) => {
        const response = await fetchWithAuthRetry(url)
        if (!response.ok) throw new Error("Error del servidor")
        return response.json()
      })
      setSuppliers(list)
      // Guardar en cache offline
      await offlineStorage.setList("suppliers", list)
    } catch (error) {
      try {
        const cachedData = await offlineStorage.getList("suppliers")
        if (cachedData && cachedData.length > 0) {
          setSuppliers(cachedData as Supplier[])
          setError("Mostrando datos offline")
        } else {
          setError("No hay datos disponibles")
        }
      } catch (offlineError) {
        setError("Error al cargar datos")
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSuppliers()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, pageSize, status])

  // Filtrar proveedores
  const filteredSuppliers = useMemo(() => {
    let filtered = [...suppliers]

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (supplier) =>
          supplier.name.toLowerCase().includes(searchLower) ||
          supplier.company?.toLowerCase().includes(searchLower) ||
          supplier.phone.includes(search) ||
          supplier.direccion?.toLowerCase().includes(searchLower) ||
          supplier.address?.toLowerCase().includes(searchLower),
      )
    }

    if (status !== "all") {
      filtered = filtered.filter((supplier) => supplier.status === status)
    }

    return filtered
  }, [suppliers, search, status])

  const paginatedSuppliers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredSuppliers.slice(startIndex, endIndex)
  }, [filteredSuppliers, currentPage, pageSize])

  const totalPages = Math.ceil(filteredSuppliers.length / pageSize)

  function handleEdit(supplier: Supplier) {
    setSelectedSupplier(supplier)
    setFormOpen(true)
  }

  function handleDelete(supplier: Supplier) {
    setSupplierToDelete(supplier)
    setDeleteDialogOpen(true)
  }

  function handleViewDetails(supplier: Supplier) {
    setSupplierToView(supplier)
    setDetailsDialogOpen(true)
  }

  function handleNewSupplier() {
    setSelectedSupplier(null)
    setFormOpen(true)
  }

  function handleToggleStatus(supplier: Supplier) {
    setSupplierToToggle(supplier)
    setToggleDialogOpen(true)
  }

  async function confirmToggleStatus() {
    if (!supplierToToggle) return
    try {
      const response = await fetchWithAuthRetry(
        `/api/suppliers/${supplierToToggle.id}/toggle-status`,
        {
          method: "PATCH",
        },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al cambiar estado del proveedor")
      }

      const updatedSupplier = await response.json()

      // Actualizar estado local inmediatamente
      setSuppliers((prev) => prev.map((s) => (s.id === supplierToToggle.id ? updatedSupplier : s)))

      // Actualizar cache offline
      const updatedSuppliers = suppliers.map((s) =>
        s.id === supplierToToggle.id ? updatedSupplier : s,
      )
      await offlineStorage.setList("suppliers", updatedSuppliers)

      const newStatus = updatedSupplier.status === "active" ? "activado" : "desactivado"
      toast.success(`Proveedor "${supplierToToggle.name}" ${newStatus} correctamente`)
    } catch (error) {
      toast.error("Error al cambiar estado del proveedor")
    } finally {
      setToggleDialogOpen(false)
      setSupplierToToggle(null)
    }
  }

  async function confirmDelete() {
    if (!supplierToDelete) return

    try {
      const response = await fetchWithAuthRetry(`/api/suppliers/${supplierToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al eliminar proveedor")
      }

      const result = await response.json()

      if (result.action === "deactivated" && result.supplier) {
        setSuppliers((prev) =>
          prev.map((supplier) =>
            supplier.id === supplierToDelete.id ? { ...supplier, status: "inactive" } : supplier,
          ),
        )
        await offlineStorage.setList(
          "suppliers",
          suppliers.map((supplier) =>
            supplier.id === supplierToDelete.id ? { ...supplier, status: "inactive" } : supplier,
          ),
        )
        toast.success("Proveedor desactivado correctamente")
      } else {
        setSuppliers((prev) => prev.filter((supplier) => supplier.id !== supplierToDelete.id))
        const updatedSuppliers = suppliers.filter((supplier) => supplier.id !== supplierToDelete.id)
        await offlineStorage.setList("suppliers", updatedSuppliers)
        toast.success("Proveedor eliminado correctamente")
      }
    } catch (error) {
      toast.error("Error al eliminar proveedor")
    } finally {
      setDeleteDialogOpen(false)
      setSupplierToDelete(null)
    }
  }

  async function handleFormSuccess(supplierData: SupplierInput) {
    try {
      if (selectedSupplier) {
        // Actualizar proveedor existente
        const response = await fetchWithAuthRetry(`/api/suppliers/${selectedSupplier.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(supplierData),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Error al actualizar proveedor")
        }

        const updatedSupplier = await response.json()

        // Actualizar estado local inmediatamente
        setSuppliers((prev) =>
          prev.map((supplier) =>
            supplier.id === selectedSupplier.id ? updatedSupplier : supplier,
          ),
        )

        // Actualizar cache offline
        const updatedSuppliers = suppliers.map((supplier) =>
          supplier.id === selectedSupplier.id ? updatedSupplier : supplier,
        )
        await offlineStorage.setList("suppliers", updatedSuppliers)

        toast.success("Proveedor actualizado correctamente")
      } else {
        // Crear nuevo proveedor
        const response = await fetchWithAuthRetry("/api/suppliers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(supplierData),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Error al crear proveedor")
        }

        const newSupplier = {
          ...(await response.json()),
          status: "active" as const, // Los nuevos proveedores se crean activos
        }

        // Actualizar estado local inmediatamente
        setSuppliers((prev) => [...prev, newSupplier])

        // Actualizar cache offline
        const updatedSuppliers = [...suppliers, newSupplier]
        await offlineStorage.setList("suppliers", updatedSuppliers)

        toast.success("Proveedor creado correctamente")
      }

      setSelectedSupplier(null)
      setFormOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar proveedor")
      throw error
    }
  }

  // Calcular estadísticas
  const stats = useMemo(
    () => ({
      totalSuppliers: suppliers.length,
      activeSuppliers: suppliers.filter((s) => s.status === "active").length,
      inactiveSuppliers: suppliers.filter((s) => s.status === "inactive").length,
      suppliersWithCompany: suppliers.filter((s) => s.company).length,
      totalPurchases: suppliers.reduce((sum, s) => sum + (s.totalPurchases ?? 0), 0),
      avgPurchases:
        suppliers.length > 0
          ? suppliers.reduce((sum, s) => sum + (s.totalPurchases ?? 0), 0) / suppliers.length
          : 0,
    }),
    [suppliers],
  )

  return {
    suppliers: paginatedSuppliers,
    allSuppliers: suppliers,
    isLoading,
    error,
    search,
    setSearch,
    status,
    setStatus,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems: filteredSuppliers.length,
    formOpen,
    setFormOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    detailsDialogOpen,
    setDetailsDialogOpen,
    toggleDialogOpen,
    setToggleDialogOpen,
    selectedSupplier,
    supplierToDelete,
    supplierToView,
    supplierToToggle,
    stats,
    handleEdit,
    handleDelete,
    handleToggleStatus,
    confirmToggleStatus,
    handleViewDetails,
    handleNewSupplier,
    confirmDelete,
    handleFormSuccess,
  }
}
