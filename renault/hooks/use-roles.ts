"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { sileo } from "sileo"
import type { Role } from "@/lib/types"
import { apiClient } from "@/lib/api-client"
import { ROLE_MESSAGES } from "@/lib/constants/messages"

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all")
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)
  const [roleToView, setRoleToView] = useState<Role | null>(null)

  // Cargar roles desde la API
  useEffect(() => {
    async function fetchRoles() {
      try {
        setIsLoading(true)
        setError(null)
        const data = await apiClient<Role[]>("/api/roles")
        setRoles(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error cargando roles"
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchRoles()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, pageSize, status])

  // Filtrar roles
  const filteredRoles = useMemo(() => {
    let filtered = [...roles]

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (role) =>
          role.name.toLowerCase().includes(searchLower) ||
          role.description.toLowerCase().includes(searchLower),
      )
    }

    if (status !== "all") {
      filtered = filtered.filter((role) => role.status === status)
    }

    return filtered
  }, [roles, search, status])

  const paginatedRoles = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredRoles.slice(startIndex, endIndex)
  }, [filteredRoles, currentPage, pageSize])

  const totalPages = Math.ceil(filteredRoles.length / pageSize)

  const handleEdit = useCallback((role: Role) => {
    if (role.isSystem) {
      sileo.error({
        title: ROLE_MESSAGES.error.editTitle,
        description: ROLE_MESSAGES.error.editSystem,
      })
      return
    }
    setSelectedRole(role)
    setFormOpen(true)
  }, [])

  const handleDelete = useCallback((role: Role) => {
    if (role.isSystem) {
      sileo.error({
        title: ROLE_MESSAGES.error.deleteTitle,
        description: ROLE_MESSAGES.error.deleteSystem,
      })
      return
    }

    if (role.usersCount && role.usersCount > 0) {
      sileo.error({
        title: ROLE_MESSAGES.error.deleteTitle,
        description: ROLE_MESSAGES.warning.hasUsers,
      })
      return
    }

    setRoleToDelete(role)
    setDeleteDialogOpen(true)
  }, [])

  const handleToggleStatus = useCallback(async (role: Role) => {
    if (role.isSystem) {
      sileo.error({
        title: ROLE_MESSAGES.error.editTitle,
        description: ROLE_MESSAGES.error.toggleSystem,
      })
      return
    }

    const newStatus = role.status === "active" ? "inactive" : "active"

    try {
      const updatedRole = await apiClient<Role>(`/api/roles/${role.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: role.name,
          description: role.description,
          permissions: role.permissions,
          color: role.color,
          status: newStatus,
        }),
      })

      setRoles((prevRoles) => prevRoles.map((r) => (r.id === role.id ? updatedRole : r)))

      const message =
        newStatus === "active" ? ROLE_MESSAGES.success.activated : ROLE_MESSAGES.success.deactivated

      sileo.success({ title: message })
    } catch (err) {
      sileo.error({
        title: ROLE_MESSAGES.error.toggleStatus,
        description: err instanceof Error ? err.message : ROLE_MESSAGES.error.toggleStatus,
      })
    }
  }, [])

  const handleViewDetails = useCallback((role: Role) => {
    setRoleToView(role)
    setDetailsDialogOpen(true)
  }, [])

  const handleNewRole = useCallback(() => {
    setSelectedRole(null)
    setFormOpen(true)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!roleToDelete || roleToDelete.isSystem) return

    try {
      await apiClient(`/api/roles/${roleToDelete.id}`, {
        method: "DELETE",
      })

      setRoles((prevRoles) => prevRoles.filter((r) => r.id !== roleToDelete.id))
      sileo.success({ title: ROLE_MESSAGES.success.deleted })
    } catch (err) {
      sileo.error({
        title: ROLE_MESSAGES.error.deleteTitle,
        description: err instanceof Error ? err.message : ROLE_MESSAGES.error.delete,
      })
    } finally {
      setDeleteDialogOpen(false)
      setRoleToDelete(null)
    }
  }, [roleToDelete])

  const handleFormSuccess = useCallback(
    (updatedRole?: Role) => {
      if (selectedRole && updatedRole) {
        setRoles((prevRoles) => prevRoles.map((r) => (r.id === selectedRole.id ? updatedRole : r)))
        sileo.success({ title: ROLE_MESSAGES.success.updated })
      } else if (updatedRole) {
        setRoles((prevRoles) => [...prevRoles, updatedRole])
        sileo.success({ title: ROLE_MESSAGES.success.created })
      }
      setSelectedRole(null)
    },
    [selectedRole],
  )

  // Calcular estadísticas
  const stats = useMemo(
    () => ({
      totalRoles: roles.length,
      activeRoles: roles.filter((r) => r.status === "active").length,
      inactiveRoles: roles.filter((r) => r.status === "inactive").length,
      totalUsers: roles.reduce((sum, role) => sum + (role.usersCount || 0), 0),
    }),
    [roles],
  )

  return {
    roles: paginatedRoles,
    allRoles: roles,
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
    totalItems: filteredRoles.length,
    formOpen,
    setFormOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    detailsDialogOpen,
    setDetailsDialogOpen,
    selectedRole,
    roleToDelete,
    roleToView,
    stats,
    handleEdit,
    handleDelete,
    handleToggleStatus,
    handleViewDetails,
    handleNewRole,
    confirmDelete,
    handleFormSuccess,
  }
}
