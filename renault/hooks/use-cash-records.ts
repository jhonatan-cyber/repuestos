"use client"

import { formatDateLocal } from "@/lib/dates"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "@/lib/toast"
import { loadList } from "@/lib/api-list"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import type { CashRecord } from "@/lib/types"

type CashStatusFilter = "all" | "open" | "closed"

interface OpenCashFormState {
  date: string
  openingBalance: string
  notes: string
}

interface WithdrawFormState {
  amount: string
  reason: string
}

interface CloseCashFormState {
  cashIncome: string
  cashExpenses: string
  notes: string
}

interface CloseSummaryState {
  date: string
  openingBalance: number
  registeredCashIncome: number
  registeredCashExpenses: number
  paymentMethods: {
    efectivo: number
    transferencia: number
    credito: number
    qr: number
    otros: number
  }
  withdrawalsTotal: number
  expectedCashInBox: number
  expectedClosingBalance: number
}

export function useCashRecords() {
  const { user } = useAuth()

  const [records, setRecords] = useState<CashRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<CashStatusFilter>("all")
  const [pageSize, setPageSize] = useState(6)
  const [currentPage, setCurrentPage] = useState(1)

  const [openCashDialog, setOpenCashDialog] = useState(false)
  const [withdrawDialog, setWithdrawDialog] = useState(false)
  const [closeDialog, setCloseDialog] = useState(false)
  const [detailsDialog, setDetailsDialog] = useState(false)

  const [selectedRecord, setSelectedRecord] = useState<CashRecord | null>(null)

  const [openForm, setOpenForm] = useState<OpenCashFormState>({
    date: formatDateLocal(new Date()),
    openingBalance: "0",
    notes: "",
  })

  const [withdrawForm, setWithdrawForm] = useState<WithdrawFormState>({
    amount: "",
    reason: "",
  })

  const [closeForm, setCloseForm] = useState<CloseCashFormState>({
    cashIncome: "0",
    cashExpenses: "0",
    notes: "",
  })
  const [closeSummary, setCloseSummary] = useState<CloseSummaryState | null>(null)

  const fetchRecords = useCallback(async () => {
    try {
      setIsLoading(true)
      setRecords(await loadList<CashRecord>("/api/cash-records"))
    } catch {
      toast.error("Error al cargar cajas")
      setRecords([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, status, pageSize])

  const openRecord = useMemo(
    () => records.find((record) => record.status === "open") ?? null,
    [records],
  )

  const latestClosed = useMemo(
    () => records.find((record) => record.status === "closed") ?? null,
    [records],
  )

  const openingBalanceValue = Number(openForm.openingBalance || 0) || 0

  const canSubmitOpenCash =
    !!user?.id &&
    !isSubmitting &&
    !Number.isNaN(openingBalanceValue) &&
    openingBalanceValue >= 0 &&
    !!openForm.date

  const filteredRecords = useMemo(() => {
    let filtered = [...records]

    if (search) {
      const query = search.toLowerCase()
      filtered = filtered.filter((record) => {
        const userName = (record.userName || "").toLowerCase()
        const notes = (record.notes || "").toLowerCase()
        return userName.includes(query) || notes.includes(query) || record.date.includes(query)
      })
    }

    if (status !== "all") {
      filtered = filtered.filter((record) => record.status === status)
    }

    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return filtered
  }, [records, search, status])

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredRecords.slice(start, start + pageSize)
  }, [filteredRecords, currentPage, pageSize])

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize))

  const stats = useMemo(() => {
    const totalIncome = records.reduce((sum, record) => sum + record.cashIncome, 0)
    const totalExpenses = records.reduce((sum, record) => sum + record.cashExpenses, 0)

    return {
      totalRecords: records.length,
      openRecords: records.filter((record) => record.status === "open").length,
      closedRecords: records.filter((record) => record.status === "closed").length,
      totalIncome,
      totalExpenses,
      currentBalance: openRecord?.closingBalance ?? latestClosed?.closingBalance ?? 0,
    }
  }, [records, openRecord, latestClosed])

  function handleOpenCashDialog() {
    setOpenForm({
      date: formatDateLocal(new Date()),
      openingBalance: String(latestClosed?.closingBalance ?? 0),
      notes: "",
    })
    setOpenCashDialog(true)
  }

  async function submitOpenCash() {
    try {
      setIsSubmitting(true)

      await apiClient("/api/cash-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: openForm.date,
          openingBalance: Number(openForm.openingBalance),
          notes: openForm.notes,
          userId: user?.id,
        }),
      })

      toast.success("Caja abierta correctamente")
      setOpenCashDialog(false)
      await fetchRecords()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al abrir caja")
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleOpenWithdrawDialog(record: CashRecord) {
    setSelectedRecord(record)
    setWithdrawForm({ amount: "", reason: "" })
    setWithdrawDialog(true)
  }

  async function submitWithdraw() {
    if (!selectedRecord) return

    try {
      setIsSubmitting(true)
      await apiClient(`/api/cash-records/${selectedRecord.id}/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(withdrawForm.amount),
          reason: withdrawForm.reason,
          userId: user?.id,
        }),
      })

      toast.success("Retiro registrado correctamente")
      setWithdrawDialog(false)
      await fetchRecords()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al registrar retiro")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleOpenCloseDialog(record: CashRecord) {
    setSelectedRecord(record)
    try {
      const summary = await apiClient<CloseSummaryState>(
        `/api/cash-records/${record.id}/close-summary`,
      )

      setCloseSummary(summary)
      setCloseForm({
        cashIncome: String(summary.paymentMethods?.efectivo ?? record.cashIncome),
        cashExpenses: String(record.cashExpenses),
        notes: record.notes || "",
      })
      setCloseDialog(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al preparar cierre de caja")
    }
  }

  async function submitCloseCash() {
    if (!selectedRecord) return

    try {
      setIsSubmitting(true)
      await apiClient(`/api/cash-records/${selectedRecord.id}/close`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cashIncome: Number(closeForm.cashIncome),
          cashExpenses: Number(closeForm.cashExpenses),
          notes: closeForm.notes,
        }),
      })

      toast.success("Caja cerrada correctamente")
      setCloseDialog(false)
      await fetchRecords()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cerrar caja")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleOpenDetails(record: CashRecord) {
    try {
      const detail = await apiClient(`/api/cash-records/${record.id}`)

      setSelectedRecord(detail as CashRecord)
      setDetailsDialog(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cargar detalle")
    }
  }

  return {
    records: paginatedRecords,
    allRecords: records,
    openRecord,
    latestClosed,
    stats,
    isLoading,
    isSubmitting,
    search,
    setSearch,
    status,
    setStatus,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems: filteredRecords.length,
    openCashDialog,
    setOpenCashDialog,
    withdrawDialog,
    setWithdrawDialog,
    closeDialog,
    setCloseDialog,
    detailsDialog,
    setDetailsDialog,
    selectedRecord,
    openForm,
    setOpenForm,
    withdrawForm,
    setWithdrawForm,
    closeForm,
    setCloseForm,
    closeSummary,
    openingBalanceValue,
    canSubmitOpenCash,
    user,
    handleOpenCashDialog,
    submitOpenCash,
    handleOpenWithdrawDialog,
    submitWithdraw,
    handleOpenCloseDialog,
    submitCloseCash,
    handleOpenDetails,
  }
}
