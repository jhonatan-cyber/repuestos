"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { sileo } from "sileo"
import type { Client } from "@/lib/types"
import { ApiError, apiClient } from "@/lib/api-client"
import { loadList } from "@/lib/api-list"
import { offlineStorage } from "@/lib/offline-storage"
import { filterValidClients } from "@/lib/client-utils"
import { CLIENT_MESSAGES } from "@/lib/constants/messages"

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)

  const loadFromCache = useCallback(async () => {
    const cachedClients = await offlineStorage.getList<Client>("clients")
    const validClients = filterValidClients(cachedClients)

    if (validClients.length > 0) {
      setClients(validClients)
      return true
    }
    return false
  }, [])

  useEffect(() => {
    fetchClients()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, status, pageSize])

  async function fetchClients() {
    try {
      setIsLoading(true)
      await loadFromCache()

      const data = await loadList<Client>("/api/clients", (url) =>
        apiClient<unknown>(url, {
          useCache: true,
          cacheTime: 300000,
        }),
      )

      let finalClients = [...data]

      const pending = await offlineStorage.getAllPendingMutations()
      const clientMutations = pending.filter((m) => m.endpoint.includes("/api/clients"))

      clientMutations.forEach((m) => {
        const idFromEndpoint = m.endpoint.split("/").pop()
        const payload = m.payload as Client | undefined

        if (m.operation === "POST" && payload) {
          if (!finalClients.find((c) => c.id === payload.id)) {
            finalClients.unshift(payload)
          }
        } else if (m.operation === "DELETE") {
          finalClients = finalClients.filter((c) => c.id !== idFromEndpoint)
        } else if ((m.operation === "PUT" || m.operation === "PATCH") && payload) {
          finalClients = finalClients.map((c) =>
            c.id === idFromEndpoint ? { ...c, ...payload } : c,
          )
        }
      })

      const validClients = filterValidClients(finalClients)
      setClients(validClients)

      if (validClients.length > 0) {
        await offlineStorage.setList("clients", validClients)
      }
    } catch (error) {
      await loadFromCache()
      sileo.warning({ title: CLIENT_MESSAGES.warning.offline })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredClients = useMemo(() => {
    let filtered = [...clients]

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(searchLower) ||
          client.phone.toLowerCase().includes(searchLower),
      )
    }

    if (status === "active") {
      filtered = filtered.filter((client) => client.status === "active")
    } else if (status === "inactive") {
      filtered = filtered.filter((client) => client.status === "inactive")
    }

    return filtered
  }, [clients, search, status])

  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredClients.slice(startIndex, endIndex)
  }, [filteredClients, currentPage, pageSize])

  const totalPages = Math.ceil(filteredClients.length / pageSize)

  function handleEdit(client: Client) {
    setSelectedClient(client)
    setFormOpen(true)
  }

  function handleDelete(client: Client) {
    setClientToDelete(client)
    setDeleteDialogOpen(true)
  }

  function handleNewClient() {
    setSelectedClient(null)
    setFormOpen(true)
  }

  async function confirmDelete() {
    if (!clientToDelete) return

    try {
      const result = await apiClient<{
        action?: "deleted" | "deactivated"
        client?: Client
      }>(`/api/clients/${clientToDelete.id}`, {
        method: "DELETE",
      })

      if (result.action === "deactivated" && result.client) {
        setClients((prev) => {
          const updatedClients: Client[] = prev.map((client) =>
            client.id === clientToDelete.id
              ? ({ ...client, status: "inactive" } as Client)
              : client,
          )
          void offlineStorage.setList("clients", updatedClients as Array<{ id: string } & Client>)
          return updatedClients
        })
        sileo.success({ title: CLIENT_MESSAGES.success.deactivated })
      } else {
        setClients((prev) => {
          const updatedClients: Client[] = prev.filter((client) => client.id !== clientToDelete.id)
          void offlineStorage.setList("clients", updatedClients as Array<{ id: string } & Client>)
          return updatedClients
        })
        sileo.success({ title: CLIENT_MESSAGES.success.deleted })
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        sileo.error({
          title: CLIENT_MESSAGES.error.deleteTitle,
          description: error.message,
        })
      } else {
        sileo.error({
          title: CLIENT_MESSAGES.error.deleteTitle,
          description: error instanceof Error ? error.message : CLIENT_MESSAGES.error.delete,
        })
      }
    } finally {
      setDeleteDialogOpen(false)
      setClientToDelete(null)
    }
  }

  async function handleFormSuccess(updatedClient?: Client) {
    if (selectedClient && updatedClient) {
      setClients((prevClients) =>
        prevClients.map((c) => (c.id === selectedClient.id ? updatedClient : c)),
      )
      sileo.success({ title: CLIENT_MESSAGES.success.updated })
    } else {
      await fetchClients()
      sileo.success({ title: CLIENT_MESSAGES.success.created })
    }
    setSelectedClient(null)
  }

  async function handleToggleStatus(client: Client) {
    if (!client.id) return
    const newStatus = client.status === "active" ? "inactive" : "active"

    // Optimistic UI
    setClients((prev) => prev.map((c) => (c.id === client.id ? { ...c, status: newStatus } : c)))

    try {
      await apiClient(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      sileo.success({
        title:
          newStatus === "active"
            ? CLIENT_MESSAGES.success.activated
            : CLIENT_MESSAGES.success.deactivated,
      })
    } catch (error) {
      await fetchClients()
      sileo.error({ title: CLIENT_MESSAGES.error.toggleStatus })
    }
  }

  const stats = useMemo(
    () => ({
      totalClients: clients.length,
      activeClients: clients.filter((c) => c.status === "active").length,
      totalSales: clients.reduce((sum, c) => sum + (c.totalPurchases || 0), 0),
      averageTicket:
        clients.length > 0
          ? clients.reduce((sum, c) => sum + (c.totalPurchases || 0), 0) / clients.length
          : 0,
    }),
    [clients],
  )

  return {
    clients: paginatedClients,
    allClients: clients,
    isLoading,
    search,
    setSearch,
    status,
    setStatus,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems: filteredClients.length,
    formOpen,
    setFormOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    selectedClient,
    clientToDelete,
    stats,
    handleEdit,
    handleDelete,
    handleNewClient,
    handleToggleStatus,
    confirmDelete,
    handleFormSuccess,
  }
}
