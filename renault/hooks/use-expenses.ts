"use client"

import { formatDateLocal } from "@/lib/dates"

import { useState, useEffect, useMemo } from "react"
import { parseDateStartLocal, parseDateEndLocal } from "@/lib/dates"
import { toast } from "@/lib/toast"
import { loadList } from "@/lib/api-list"
import { apiClient } from "@/lib/api-client"
import type { Expense, ExpenseInput } from "@/lib/types"
import { offlineStorage } from "@/lib/offline-storage"
import { exportExpensesPDF } from "@/lib/export"

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null)
  const [expenseToView, setExpenseToView] = useState<Expense | null>(null)

  const fetchExpenses = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const list = await loadList<Expense>("/api/expenses")
      setExpenses(list)
      await offlineStorage.setList("expenses", list)
    } catch (error) {
      try {
        const cachedData = await offlineStorage.getList("expenses")
        if (cachedData && cachedData.length > 0) {
          setExpenses(cachedData as Expense[])
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
    fetchExpenses()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, pageSize, startDate, endDate])

  const expensesInDateRange = useMemo(() => {
    const start = startDate ? parseDateStartLocal(startDate) : null
    const end = endDate ? parseDateEndLocal(endDate) : null

    return expenses.filter((expense) => {
      const expenseDate = parseDateStartLocal(expense.date as string)
      if (start && expenseDate < start) return false
      if (end && expenseDate > end) return false
      return true
    })
  }, [expenses, startDate, endDate])

  const filteredExpenses = useMemo(() => {
    let filtered = [...expensesInDateRange]

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (expense) =>
          expense.name.toLowerCase().includes(searchLower) ||
          expense.description.toLowerCase().includes(searchLower) ||
          expense.category?.toLowerCase().includes(searchLower),
      )
    }

    return filtered
  }, [expensesInDateRange, search])

  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredExpenses.slice(startIndex, endIndex)
  }, [filteredExpenses, currentPage, pageSize])

  const totalPages = Math.ceil(filteredExpenses.length / pageSize)

  function handleEdit(expense: Expense) {
    setSelectedExpense(expense)
    setFormOpen(true)
  }

  function handleDelete(expense: Expense) {
    setExpenseToDelete(expense)
    setDeleteDialogOpen(true)
  }

  function handleViewDetails(expense: Expense) {
    setExpenseToView(expense)
    setDetailsDialogOpen(true)
  }

  function handleNewExpense() {
    setSelectedExpense(null)
    setFormOpen(true)
  }

  function handleExportPDF() {
    exportExpensesPDF(
      filteredExpenses,
      {
        startDate,
        endDate,
        search: search.trim() || undefined,
      },
      `gastos-${formatDateLocal(new Date())}.pdf`,
    )
  }

  async function confirmDelete() {
    if (!expenseToDelete) return

    try {
      await apiClient(`/api/expenses/${expenseToDelete.id}`, {
        method: "DELETE",
      })

      setExpenses((prev) => prev.filter((expense) => expense.id !== expenseToDelete.id))

      const updatedExpenses = expenses.filter((expense) => expense.id !== expenseToDelete.id)
      await offlineStorage.setList("expenses", updatedExpenses)

      toast.success("Gasto eliminado correctamente")
    } catch (error) {
      toast.error("Error al eliminar gasto")
    } finally {
      setDeleteDialogOpen(false)
      setExpenseToDelete(null)
    }
  }

  function handleFormSuccess(updatedExpense?: Expense) {
    if (selectedExpense && updatedExpense) {
      setExpenses((prev) =>
        prev.map((expense) => (expense.id === selectedExpense.id ? updatedExpense : expense)),
      )
      toast.success("Gasto actualizado correctamente")
    } else if (updatedExpense) {
      setExpenses((prev) => [...prev, updatedExpense])
      toast.success("Gasto creado correctamente")
    }
    setSelectedExpense(null)
  }

  const stats = useMemo(
    () => ({
      totalExpenses: expensesInDateRange.length,
      totalAmount: expensesInDateRange.reduce((sum, e) => sum + e.amount, 0),
      avgAmount:
        expensesInDateRange.length > 0
          ? expensesInDateRange.reduce((sum, e) => sum + e.amount, 0) / expensesInDateRange.length
          : 0,
      expensesByCategory: expensesInDateRange.reduce(
        (acc, e) => {
          const category = e.category ?? "Sin categoria"
          acc[category] = (acc[category] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
    }),
    [expensesInDateRange],
  )

  return {
    expenses: paginatedExpenses,
    allExpenses: expenses,
    isLoading,
    error,
    search,
    setSearch,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems: filteredExpenses.length,
    formOpen,
    setFormOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    detailsDialogOpen,
    setDetailsDialogOpen,
    selectedExpense,
    expenseToDelete,
    expenseToView,
    stats,
    expensesInDateRange,
    handleEdit,
    handleDelete,
    handleViewDetails,
    handleNewExpense,
    confirmDelete,
    handleFormSuccess,
    handleExportPDF,
    clearDateRange: () => {
      setStartDate("")
      setEndDate("")
    },
  }
}
