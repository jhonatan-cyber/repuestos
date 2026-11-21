"use client"

import { formatDateLocal } from "@/lib/dates"

import { useState, useEffect, useMemo, useCallback } from "react"
import { sileo } from "sileo"
import type { Quotation } from "@/lib/types"
import { apiClient } from "@/lib/api-client"
import { loadList } from "@/lib/api-list"
import { offlineStorage } from "@/lib/offline-storage"
import { QUOTATION_MESSAGES } from "@/lib/constants/messages"
import { useAuth } from "@/lib/auth-context"
import { usePrintPreview } from "@/hooks/use-print-preview"
import { exportQuotationsPDF } from "@/lib/export"

export function useQuotations() {
  const { user } = useAuth()
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const [formOpen, setFormOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [convertDialogOpen, setConvertDialogOpen] = useState(false)

  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [quotationToDelete, setQuotationToDelete] = useState<Quotation | null>(null)
  const [quotationToConvert, setQuotationToConvert] = useState<Quotation | null>(null)
  const {
    documentToPrint: quotationToPrint,
    openPrintPreview,
    closePrintPreview: handleClosePrintPreview,
  } = usePrintPreview<Quotation>()

  const loadFromCache = useCallback(async () => {
    const cachedQuotations = await offlineStorage.getList<Quotation>("quotations")
    if (cachedQuotations && cachedQuotations.length > 0) {
      setQuotations(cachedQuotations)
      return true
    }
    return false
  }, [])

  useEffect(() => {
    fetchQuotations()
  }, [startDate, endDate])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, status, pageSize])

  async function fetchQuotations() {
    try {
      setIsLoading(true)
      await loadFromCache()

      let url = "/api/quotations"
      const params = new URLSearchParams()
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const data = await loadList<Quotation>(url, (pageUrl) =>
        apiClient<unknown>(pageUrl, {
          useCache: true,
          cacheTime: 60000,
        }),
      )

      let finalQuotations = [...data]

      // FASE 4: Proyectar mutaciones pendientes sobre la UI (Optimistic UI Global)
      const pending = await offlineStorage.getAllPendingMutations()
      const quotationMutations = pending.filter((m) => m.endpoint.includes("/api/quotations"))

      quotationMutations.forEach((m) => {
        const idFromEndpoint = m.endpoint.split("/").pop()
        const payload = m.payload as Quotation | undefined

        if (m.operation === "POST" && payload) {
          // Agregar si no está (evitar duplicados si ya se sincronizó pero no se refrescó)
          if (!finalQuotations.find((q) => q.id === payload.id)) {
            finalQuotations.unshift(payload)
          }
        } else if (m.operation === "DELETE") {
          finalQuotations = finalQuotations.filter((q) => q.id !== idFromEndpoint)
        } else if (m.operation === "PUT" && payload) {
          finalQuotations = finalQuotations.map((q) =>
            q.id === idFromEndpoint ? { ...q, ...payload } : q,
          )
        }
      })

      setQuotations(finalQuotations)

      if (finalQuotations.length > 0) {
        await offlineStorage.setList("quotations", finalQuotations)
      }
    } catch (error) {
      const hasCached = await loadFromCache()

      if (hasCached) {
        sileo.warning({
          title: QUOTATION_MESSAGES.warning.offline,
          description: QUOTATION_MESSAGES.warning.offlineDescription,
        })
      } else {
        sileo.error({
          title: QUOTATION_MESSAGES.error.fetch,
          description: QUOTATION_MESSAGES.info.noConnectionDescription,
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const filteredQuotations = useMemo(() => {
    let filtered = [...quotations]

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (quotation) =>
          quotation.clientName?.toLowerCase().includes(searchLower) ||
          quotation.id.toString().includes(searchLower) ||
          quotation.sellerName?.toLowerCase().includes(searchLower),
      )
    }

    if (status !== "all") {
      filtered = filtered.filter((quotation) => quotation.status === status)
    }

    return filtered
  }, [quotations, search, status])

  const paginatedQuotations = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredQuotations.slice(startIndex, endIndex)
  }, [filteredQuotations, currentPage, pageSize])

  const totalPages = Math.ceil(filteredQuotations.length / pageSize)

  const handleViewDetails = (quotation: Quotation) => {
    setSelectedQuotation(quotation)
    setDetailsOpen(true)
  }

  const handleEdit = (quotation: Quotation) => {
    setSelectedQuotation(quotation)
    setFormOpen(true)
  }

  const handleDelete = (quotation: Quotation) => {
    setQuotationToDelete(quotation)
    setDeleteDialogOpen(true)
  }

  const handleConvert = (quotation: Quotation) => {
    setQuotationToConvert(quotation)
    setConvertDialogOpen(true)
  }

  const handlePrint = (quotation: Quotation) => {
    openPrintPreview(quotation)
  }

  const handleNewQuotation = () => {
    setSelectedQuotation(null)
    setFormOpen(true)
  }

  const confirmDelete = async () => {
    if (!quotationToDelete) return
    const deletedQuotation = quotationToDelete
    const idToDelete = deletedQuotation.id

    // Optimistic UI: Actualizar localmente de inmediato
    setQuotations((prev) => prev.filter((q) => q.id !== idToDelete))
    setDeleteDialogOpen(false)
    setQuotationToDelete(null)

    try {
      await apiClient(`/api/quotations/${idToDelete}`, {
        method: "DELETE",
      })
      sileo.success({ title: QUOTATION_MESSAGES.success.deleted })
    } catch (error) {
      setQuotations((prev) => {
        if (prev.some((quotation) => quotation.id === deletedQuotation.id)) {
          return prev
        }
        return [deletedQuotation, ...prev]
      })

      sileo.error({
        title: QUOTATION_MESSAGES.error.deleteTitle,
        description: error instanceof Error ? error.message : QUOTATION_MESSAGES.error.delete,
      })
    }
  }

  const handleFormSuccess = async () => {
    await fetchQuotations()
    setFormOpen(false)
    setSelectedQuotation(null)
  }

  const handleConvertSuccess = async () => {
    await fetchQuotations()
    setConvertDialogOpen(false)
    setQuotationToConvert(null)
    sileo.success({ title: QUOTATION_MESSAGES.success.converted })
  }

  const handleExport = () => {
    if (filteredQuotations.length === 0) {
      sileo.error({ description: "No hay datos para exportar" })
      return
    }

    exportQuotationsPDF(
      filteredQuotations,
      {
        search: search.trim() || undefined,
        status,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      },
      `cotizaciones-${formatDateLocal(new Date())}.pdf`,
    )
  }

  const stats = useMemo(() => {
    const total = quotations.reduce((sum, quotation) => sum + quotation.total, 0)
    const pending = quotations.filter((quotation) => quotation.status === "pendiente").length
    const approved = quotations.filter((quotation) => quotation.status === "aprobada").length
    const converted = quotations.filter((quotation) => quotation.status === "convertida").length

    return {
      totalAmount: total,
      pendingCount: pending,
      approvedCount: approved,
      convertedCount: converted,
      totalCount: quotations.length,
    }
  }, [quotations])

  return {
    quotations: paginatedQuotations,
    isLoading,
    search,
    setSearch,
    status,
    setStatus,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    totalPages,
    totalItems: filteredQuotations.length,
    formOpen,
    setFormOpen,
    detailsOpen,
    setDetailsOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    convertDialogOpen,
    setConvertDialogOpen,
    selectedQuotation,
    setSelectedQuotation,
    quotationToDelete,
    quotationToConvert,
    quotationToPrint,
    sellerUserId: String(user?.id ?? ""),
    stats,
    fetchQuotations,
    handleViewDetails,
    handleEdit,
    handleDelete,
    handleConvert,
    handlePrint,
    handleClosePrintPreview,
    handleNewQuotation,
    confirmDelete,
    handleFormSuccess,
    handleConvertSuccess,
    handleExport,
  }
}
