"use client"

import { useEffect, useMemo, useState } from "react"
import { apiClient } from "@/lib/api-client"
import type { ReportExpense, ReportPurchase, ReportSale } from "./use-reports"

interface TableFilters {
  search: string
  status: string
  minAmount: number
  maxAmount: number
}

interface RankingItem {
  name: string
  value: number
  trend?: number
}

interface PreviousStats {
  totalSales: number
  totalPurchases: number
  totalExpenses: number
  netProfit: number
}

interface BaseReportsData {
  salesData: ReportSale[]
  purchasesData: ReportPurchase[]
  expensesData: ReportExpense[]
  dateFrom: string
  dateTo: string
}

function aggregateByAttribute<T extends Record<string, any>>(
  data: T[],
  attribute: string,
  valueKey: string,
): RankingItem[] {
  const map = new Map<string, number>()

  data.forEach((item) => {
    const key = item[attribute] || "Sin nombre"
    const value = item[valueKey] || 0
    map.set(key, (map.get(key) || 0) + Number(value))
  })

  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
}

export function useReportsEnhanced(base: BaseReportsData) {
  const { salesData, purchasesData, expensesData, dateFrom, dateTo } = base

  const [previousStats, setPreviousStats] = useState<PreviousStats>({
    totalSales: 0,
    totalPurchases: 0,
    totalExpenses: 0,
    netProfit: 0,
  })

  useEffect(() => {
    async function fetchPreviousStats() {
      if (!dateFrom || !dateTo) {
        setPreviousStats({ totalSales: 0, totalPurchases: 0, totalExpenses: 0, netProfit: 0 })
        return
      }

      try {
        const params = new URLSearchParams({ startDate: dateFrom, endDate: dateTo })
        const data = await apiClient<{
          totalSales?: number
          totalPurchases?: number
          totalExpenses?: number
          netProfit?: number
        }>(`/api/reports/comparison?${params.toString()}`)
        setPreviousStats({
          totalSales: data.totalSales || 0,
          totalPurchases: data.totalPurchases || 0,
          totalExpenses: data.totalExpenses || 0,
          netProfit: data.netProfit || 0,
        })
      } catch (error) {
        console.error("Error fetching previous stats:", error)
      }
    }

    fetchPreviousStats()
  }, [dateFrom, dateTo])

  const [salesFilters, setSalesFilters] = useState<TableFilters>({
    search: "",
    status: "all",
    minAmount: 0,
    maxAmount: 999999,
  })
  const [purchasesFilters, setPurchasesFilters] = useState<TableFilters>({
    search: "",
    status: "all",
    minAmount: 0,
    maxAmount: 999999,
  })
  const [expensesFilters, setExpensesFilters] = useState<TableFilters>({
    search: "",
    status: "all",
    minAmount: 0,
    maxAmount: 999999,
  })

  const filteredSalesData = useMemo(() => {
    return salesData.filter((sale) => {
      const matchesSearch =
        !salesFilters.search ||
        sale.clientName?.toLowerCase().includes(salesFilters.search.toLowerCase()) ||
        sale.sellerName?.toLowerCase().includes(salesFilters.search.toLowerCase())

      const matchesStatus = salesFilters.status === "all" || sale.status === salesFilters.status
      const matchesAmount =
        sale.total >= salesFilters.minAmount && sale.total <= salesFilters.maxAmount

      return matchesSearch && matchesStatus && matchesAmount
    })
  }, [salesData, salesFilters])

  const filteredPurchasesData = useMemo(() => {
    return purchasesData.filter((purchase) => {
      const matchesSearch =
        !purchasesFilters.search ||
        purchase.supplierName?.toLowerCase().includes(purchasesFilters.search.toLowerCase()) ||
        purchase.buyerName?.toLowerCase().includes(purchasesFilters.search.toLowerCase())

      const matchesStatus =
        purchasesFilters.status === "all" || purchase.status === purchasesFilters.status
      const matchesAmount =
        purchase.total >= purchasesFilters.minAmount && purchase.total <= purchasesFilters.maxAmount

      return matchesSearch && matchesStatus && matchesAmount
    })
  }, [purchasesData, purchasesFilters])

  const filteredExpensesData = useMemo(() => {
    return expensesData.filter((expense) => {
      const matchesSearch =
        !expensesFilters.search ||
        expense.description?.toLowerCase().includes(expensesFilters.search.toLowerCase()) ||
        expense.category?.toLowerCase().includes(expensesFilters.search.toLowerCase()) ||
        expense.responsibleName?.toLowerCase().includes(expensesFilters.search.toLowerCase())

      const matchesAmount =
        expense.amount >= expensesFilters.minAmount && expense.amount <= expensesFilters.maxAmount

      return matchesSearch && matchesAmount
    })
  }, [expensesData, expensesFilters])

  const rankings = useMemo(() => {
    return {
      topSellers: aggregateByAttribute(filteredSalesData, "sellerName", "total"),
      topClients: aggregateByAttribute(filteredSalesData, "clientName", "total"),
      topProducts: aggregateByAttribute(
        filteredSalesData.flatMap((sale) => sale.items || []),
        "productName",
        "quantity",
      ),
      topSuppliers: aggregateByAttribute(filteredPurchasesData, "supplierName", "total"),
    }
  }, [filteredSalesData, filteredPurchasesData])

  return {
    filteredSalesData,
    filteredPurchasesData,
    filteredExpensesData,
    salesFilters,
    setSalesFilters,
    purchasesFilters,
    setPurchasesFilters,
    expensesFilters,
    setExpensesFilters,
    previousStats,
    rankings,
  }
}
