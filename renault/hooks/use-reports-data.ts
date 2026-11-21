"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "@/lib/toast"
import { loadList } from "@/lib/api-list"
import {
  currentMonthStart,
  dedupeByIdLatest,
  today,
  toYMD,
  type ReportExpense,
  type ReportPurchase,
  type ReportSale,
} from "@/lib/report-utils"

export function useReportsData() {
  const [dateFrom, setDateFrom] = useState(currentMonthStart)
  const [dateTo, setDateTo] = useState(today)
  const [salesData, setSalesData] = useState<ReportSale[]>([])
  const [purchasesData, setPurchasesData] = useState<ReportPurchase[]>([])
  const [expensesData, setExpensesData] = useState<ReportExpense[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const applyPreset = useCallback((preset: "today" | "week" | "month" | "year" | "all") => {
    if (preset === "all") {
      setDateFrom("")
      setDateTo("")
      return
    }

    const end = new Date()
    const start = new Date(end)

    if (preset === "week") {
      start.setDate(start.getDate() - 6)
    } else if (preset === "month") {
      start.setDate(1)
    } else if (preset === "year") {
      start.setMonth(0, 1)
    }

    setDateFrom(toYMD(start))
    setDateTo(toYMD(end))
  }, [])

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({ startDate: dateFrom, endDate: dateTo })
      const [sales, purchases, expenses] = await Promise.all([
        loadList<ReportSale>(`/api/sales?${params.toString()}`),
        loadList<ReportPurchase>(`/api/purchases?${params.toString()}`),
        loadList<ReportExpense>(`/api/expenses?${params.toString()}`),
      ])
      setSalesData(dedupeByIdLatest(sales))
      setPurchasesData(dedupeByIdLatest(purchases))
      setExpensesData(dedupeByIdLatest(expenses))
    } catch {
      setSalesData([])
      setPurchasesData([])
      setExpensesData([])
      toast.error("Error al cargar reportes")
    } finally {
      setIsLoading(false)
    }
  }, [dateFrom, dateTo])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const stats = useMemo(() => {
    const totalSales = salesData.reduce((sum, sale) => sum + sale.total, 0)
    const totalPurchases = purchasesData.reduce((sum, purchase) => sum + purchase.total, 0)
    const totalExpenses = expensesData.reduce((sum, expense) => sum + expense.amount, 0)
    return {
      totalSales,
      totalPurchases,
      totalExpenses,
      netProfit: totalSales - totalPurchases - totalExpenses,
    }
  }, [salesData, purchasesData, expensesData])

  return {
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    salesData,
    purchasesData,
    expensesData,
    isLoading,
    stats,
    fetchReports,
    applyPreset,
  }
}
