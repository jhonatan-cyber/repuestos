"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { sileo } from "sileo"
import type { User } from "@/lib/types"
import { apiClient } from "@/lib/api-client"
import { loadList } from "@/lib/api-list"
import { offlineStorage } from "@/lib/offline-storage"
import { filterValidUsers, getUserFullName } from "@/lib/user-utils"
import { USER_MESSAGES } from "@/lib/constants/messages"

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [role, setRole] = useState("all")
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [userToView, setUserToView] = useState<User | null>(null)

  // Cargar datos del cache de forma reutilizable
  const loadFromCache = useCallback(async () => {
    const cachedUsers = await offlineStorage.getList<User>("users")
    const validUsers = filterValidUsers(cachedUsers)

    if (validUsers.length > 0) {
      setUsers(validUsers)
      return true
    }
    return false
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, status, role, pageSize])

  async function fetchUsers() {
    try {
      setIsLoading(true)

      // Cargar desde cache primero
      const hasCachedData = await loadFromCache()
      if (hasCachedData) {
        setIsLoading(false)
      }

      // Obtener datos frescos de la API
      const usersArray = await loadList<User>("/api/users", (url) =>
        apiClient<unknown>(url, {
          useCache: true,
          cacheTime: 300000, // 5 minutos
        }),
      )
      const validUsers = filterValidUsers(usersArray)

      setUsers(validUsers)

      if (validUsers.length > 0) {
        await offlineStorage.setList("users", validUsers)
      }
    } catch (error) {
      const hasCachedData = await loadFromCache()

      if (hasCachedData) {
        sileo.warning({
          title: USER_MESSAGES.warning.offline,
          description: USER_MESSAGES.warning.offlineDescription,
        })
      } else {
        sileo.error({
          title: USER_MESSAGES.info.noConnection,
          description: USER_MESSAGES.info.noConnectionDescription,
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrar y paginar usuarios
  const filteredUsers = useMemo(() => {
    let filtered = [...users]

    // Filtrar por búsqueda
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter((user) => {
        const fullName = getUserFullName(user)
        return (
          fullName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          user.ci.toLowerCase().includes(searchLower) ||
          user.role.toLowerCase().includes(searchLower)
        )
      })
    }

    // Filtrar por estado
    if (status === "active") {
      filtered = filtered.filter((user) => user.status === "active")
    } else if (status === "inactive") {
      filtered = filtered.filter((user) => user.status === "inactive")
    }

    // Filtrar por rol
    if (role !== "all") {
      filtered = filtered.filter((user) => user.role === role)
    }

    return filtered
  }, [users, search, status, role])

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredUsers.slice(startIndex, endIndex)
  }, [filteredUsers, currentPage, pageSize])

  const totalPages = Math.ceil(filteredUsers.length / pageSize)

  const handleEdit = useCallback((user: User) => {
    setSelectedUser(user)
    setFormOpen(true)
  }, [])

  const handleDelete = useCallback((user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }, [])

  const handleViewDetails = useCallback((user: User) => {
    setUserToView(user)
    setDetailsDialogOpen(true)
  }, [])

  const handleNewUser = useCallback(() => {
    setSelectedUser(null)
    setFormOpen(true)
  }, [])

  const handleToggleStatus = useCallback(async (user: User) => {
    try {
      if (!user.id) {
        throw new Error(USER_MESSAGES.error.invalidId)
      }

      const newStatus = user.status === "active" ? "inactive" : "active"

      const updatedUser = await apiClient<{ status: "active" | "inactive"; id: unknown }>(
        `/api/users/${user.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        },
      )

      // Actualizar solo el usuario específico en el estado local
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === user.id ? { ...u, status: updatedUser.status } : u)),
      )

      const message =
        newStatus === "active" ? USER_MESSAGES.success.activated : USER_MESSAGES.success.deactivated

      sileo.success({ title: message })
    } catch (error) {
      sileo.error({
        title: USER_MESSAGES.error.toggleStatus,
        description: error instanceof Error ? error.message : USER_MESSAGES.error.toggleStatus,
      })
    }
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!userToDelete) return

    try {
      await apiClient(`/api/users/${userToDelete.id}`, { method: "DELETE" })

      // Remover el usuario del estado local
      setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userToDelete.id))

      sileo.success({ title: USER_MESSAGES.success.deleted })
    } catch (error) {
      sileo.error({
        title: USER_MESSAGES.error.deleteTitle,
        description: error instanceof Error ? error.message : USER_MESSAGES.error.delete,
      })
    } finally {
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }, [userToDelete])

  const handleFormSuccess = useCallback(
    async (updatedUser?: User) => {
      if (selectedUser && updatedUser) {
        // Actualizar usuario existente
        setUsers((prevUsers) => prevUsers.map((u) => (u.id === selectedUser.id ? updatedUser : u)))
        sileo.success({ title: USER_MESSAGES.success.updated })
      } else {
        // Recargar datos para nuevo usuario
        await fetchUsers()
        sileo.success({ title: USER_MESSAGES.success.created })
      }
      setSelectedUser(null)
    },
    [selectedUser],
  )

  // Calcular estadísticas
  const stats = useMemo(
    () => ({
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.status === "active").length,
      adminUsers: users.filter((u) => u.role === "administrador").length,
      sellerUsers: users.filter((u) => u.role === "vendedor").length,
    }),
    [users],
  )

  return {
    users: paginatedUsers,
    allUsers: users,
    isLoading,
    search,
    setSearch,
    status,
    setStatus,
    role,
    setRole,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems: filteredUsers.length,
    formOpen,
    setFormOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    detailsDialogOpen,
    setDetailsDialogOpen,
    selectedUser,
    userToDelete,
    userToView,
    stats,
    handleEdit,
    handleDelete,
    handleViewDetails,
    handleNewUser,
    handleToggleStatus,
    confirmDelete,
    handleFormSuccess,
  }
}
