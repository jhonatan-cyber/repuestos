"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { Sale } from "@/lib/types"
import { toast } from "@/lib/toast"
import { useAuth } from "@/lib/auth-context"
import { parseDateStartLocal } from "@/lib/dates"
import { tryRefreshToken } from "@/lib/api-client"
import {
  exportSaleReceiptPDF,
  exportSalesCSV,
  exportSalesCSVWithItems,
  exportSalesExcel,
  exportSalesReportPDF,
} from "@/lib/export"
import { usePrintPreview } from "@/hooks/use-print-preview"
import { loadList } from "@/lib/api-list"

interface SalePayload {
  date: string
  clientId: string
  sellerUserId: string
  items: Array<{ productId: string; quantity: number; price: number; subtotal: number }>
  subtotal: number
  tax: number
  discount: number
  total: number
  saleType?: string
  paymentMethod: string
  initialPaymentMethod?: string
  initialPayment?: number
  paymentSplits?: Array<{ method: string; amount: number }>
  status: string
}

export function useSales() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [sales, setSales] = useState<Sale[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingSale, setIsCreatingSale] = useState(false)
  const [isUpdatingSale, setIsUpdatingSale] = useState(false)

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [selectedSaleForEdit, setSelectedSaleForEdit] = useState<Sale | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null)
  const [isCancellingSale, setIsCancellingSale] = useState(false)
  const {
    documentToPrint: saleToPrint,
    openPrintPreview,
    closePrintPreview: handleClosePrintPreview,
  } = usePrintPreview<Sale>()

  const fetchSales = useCallback(async () => {
    try {
      setIsLoading(true)

      let url = "/api/sales"
      const params = new URLSearchParams()
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      setSales(await loadList<Sale>(url))
    } catch {
      toast.error("Error al cargar ventas")
      setSales([])
    } finally {
      setIsLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    fetchSales()
  }, [fetchSales])

  /**
   * Wrapper around fetch that automatically retries once after a 401 by
   * attempting a token refresh. All mutation calls should use this instead
   * of fetch() directly so they survive an expired access token.
   */
  const fetchWithAuthRetry = useCallback(
    async (url: string, init: RequestInit): Promise<Response> => {
      const opts: RequestInit = { ...init, credentials: "include" }
      const res = await fetch(url, opts)
      if (res.status === 401) {
        const refreshed = await tryRefreshToken()
        if (refreshed) return fetch(url, opts)
      }
      return res
    },
    [],
  )

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, status, pageSize, startDate, endDate])

  const filteredSales = useMemo(() => {
    let filtered = [...sales]

    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase()
      filtered = filtered.filter((sale) => {
        const clientName = (sale.clientName || "").toLowerCase()
        const sellerName = (sale.sellerName || "").toLowerCase()
        const method = (sale.paymentMethod || "").toLowerCase()
        return clientName.includes(query) || sellerName.includes(query) || method.includes(query)
      })
    }

    if (status !== "all") {
      filtered = filtered.filter((sale) => sale.status === status)
    }

    filtered.sort(
      (a, b) => parseDateStartLocal(b.date).getTime() - parseDateStartLocal(a.date).getTime(),
    )

    return filtered
  }, [sales, debouncedSearch, status])

  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredSales.slice(start, start + pageSize)
  }, [filteredSales, currentPage, pageSize])

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / pageSize))

  const stats = useMemo(() => {
    const totalSalesAmount = sales.reduce((sum, s) => sum + s.total, 0)
    const completedSalesCount = sales.filter((s) => s.status === "completada").length
    const pendingSalesCount = sales.filter((s) => s.status === "pendiente").length

    return {
      totalSalesAmount,
      totalSalesCount: sales.length,
      completedSalesCount,
      pendingSalesCount,
    }
  }, [sales])

  // Calculate trend vs previous period (same number of days before startDate)
  const trend = useMemo(() => {
    if (!startDate || !endDate) return undefined
    const start = parseDateStartLocal(startDate)
    const end = parseDateStartLocal(endDate)
    const dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    const prevStart = new Date(start)
    prevStart.setDate(prevStart.getDate() - dayCount)
    const prevEnd = new Date(start)
    prevEnd.setDate(prevEnd.getDate() - 1)

    const prevPeriodSales = sales.filter((s) => {
      const d = parseDateStartLocal(s.date)
      return d >= prevStart && d <= prevEnd
    })

    if (prevPeriodSales.length === 0) return undefined

    const prevAmount = prevPeriodSales.reduce((sum, s) => sum + s.total, 0)
    const amountChange =
      stats.totalSalesAmount > 0 && prevAmount > 0
        ? ((stats.totalSalesAmount - prevAmount) / prevAmount) * 100
        : 0

    const countChange =
      stats.totalSalesCount > 0 && prevPeriodSales.length > 0
        ? ((stats.totalSalesCount - prevPeriodSales.length) / prevPeriodSales.length) * 100
        : 0

    return {
      amountChange,
      countChange,
      amountVsLastPeriod: prevAmount,
      countVsLastPeriod: prevPeriodSales.length,
    }
  }, [sales, startDate, endDate, stats])

  const handleViewDetails = (sale: Sale) => {
    setSelectedSale(sale)
    setDetailsOpen(true)
  }

  const handlePrint = (sale: Sale) => {
    openPrintPreview(sale)
  }

  const handleExportReceipt = (sale: Sale) => {
    void exportSaleReceiptPDF(sale)
  }

  const handleNewSale = () => {
    setFormOpen(true)
  }

  const handleEditSale = (sale: Sale) => {
    setSelectedSaleForEdit(sale)
    setEditOpen(true)
  }

  const handleUpdateSale = async (payload: SalePayload) => {
    if (!selectedSaleForEdit) {
      toast.error("No hay venta seleccionada para editar")
      return
    }

    try {
      setIsUpdatingSale(true)
      const response = await fetchWithAuthRetry(`/api/sales/${selectedSaleForEdit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || "No se pudo actualizar la venta")
      }

      toast.success("Venta actualizada correctamente")
      setEditOpen(false)
      setSelectedSaleForEdit(null)
      await fetchSales()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al actualizar venta"
      toast.error(message)
      throw error
    } finally {
      setIsUpdatingSale(false)
    }
  }

  const handleRequestCancelSale = (sale: Sale) => {
    setSaleToCancel(sale)
    setCancelOpen(true)
  }

  const handleConfirmCancelSale = async () => {
    if (!saleToCancel) return

    try {
      setIsCancellingSale(true)
      const response = await fetchWithAuthRetry(`/api/sales/${saleToCancel.id}/cancel`, {
        method: "PATCH",
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || "No se pudo anular la venta")
      }

      toast.success("Venta anulada correctamente")
      setCancelOpen(false)
      setSaleToCancel(null)
      await fetchSales()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al anular venta"
      toast.error(message)
    } finally {
      setIsCancellingSale(false)
    }
  }

  const handleCreateSale = async (payload: SalePayload) => {
    if (!user?.id) {
      toast.error("Sesión no disponible. Recarga la página e intenta de nuevo.")
      return
    }
    try {
      setIsCreatingSale(true)
      const response = await fetchWithAuthRetry("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || "No se pudo crear la venta")
      }

      toast.success("Venta creada correctamente")
      setFormOpen(false)
      await fetchSales()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al crear venta"
      toast.error(message)
      throw error
    } finally {
      setIsCreatingSale(false)
    }
  }

  const handleExportCSV = () => {
    if (filteredSales.length === 0) {
      toast.error("No hay datos para exportar")
      return
    }
    exportSalesCSV(filteredSales)
  }

  const handleExportExcel = () => {
    if (filteredSales.length === 0) {
      toast.error("No hay datos para exportar")
      return
    }
    exportSalesExcel(filteredSales)
  }

  const handleExportCSVWithItems = () => {
    if (filteredSales.length === 0) {
      toast.error("No hay datos para exportar")
      return
    }
    exportSalesCSVWithItems(filteredSales)
  }

  const handleExportPDF = () => {
    if (filteredSales.length === 0) {
      toast.error("No hay datos para exportar")
      return
    }
    exportSalesReportPDF(filteredSales)
  }

  return {
    sales: paginatedSales,
    allSales: sales,
    isLoading,
    search,
    setSearch,
    status,
    setStatus,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems: filteredSales.length,
    detailsOpen,
    setDetailsOpen,
    formOpen,
    setFormOpen,
    editOpen,
    setEditOpen,
    selectedSale,
    saleToPrint,
    selectedSaleForEdit,
    setSelectedSaleForEdit,
    isUpdatingSale,
    isCreatingSale,
    cancelOpen,
    setCancelOpen,
    saleToCancel,
    isCancellingSale,
    user,
    isAuthLoading,
    stats,
    trend,
    handleViewDetails,
    handlePrint,
    handleExportReceipt,
    handleClosePrintPreview,
    handleNewSale,
    handleEditSale,
    handleCreateSale,
    handleUpdateSale,
    handleRequestCancelSale,
    handleConfirmCancelSale,
    handleExportCSV,
    handleExportCSVWithItems,
    handleExportExcel,
    handleExportPDF,
    clearDateRange: () => {
      setStartDate("")
      setEndDate("")
    },
    refresh: fetchSales,
  }
}
