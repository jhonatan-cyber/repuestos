"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { ReportsDataManagement } from "@/components/reports/reports-data-management"
import { ReportsFilters } from "@/components/reports/reports-filters"
import { ReportsHeader } from "@/components/reports/reports-header"
import { ReportsStats } from "@/components/reports/reports-stats"
import { ReportsTabsEnhanced, type ReportTab } from "@/components/reports/reports-tabs-enhanced"
import { useReports, useReportsEnhanced } from "@/hooks/use-reports"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// recharts (~400KB) bajo demanda, no en bundle inicial
const ReportsCharts = dynamic(
  () => import("@/components/reports/reports-charts").then((m) => m.ReportsCharts),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
        Cargando gráficos...
      </div>
    ),
  },
)

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("all")

  const reports = useReports()
  const {
    filteredSalesData,
    filteredPurchasesData,
    filteredExpensesData,
    salesFilters,
    setSalesFilters,
    purchasesFilters,
    setPurchasesFilters,
    expensesFilters,
    setExpensesFilters,
    rankings,
    previousStats,
  } = useReportsEnhanced({
    salesData: reports.salesData,
    purchasesData: reports.purchasesData,
    expensesData: reports.expensesData,
    dateFrom: reports.dateFrom,
    dateTo: reports.dateTo,
  })

  return (
    <div className="space-y-6">
      <ReportsHeader />
      <ReportsFilters
        dateFrom={reports.dateFrom}
        onDateFromChange={reports.setDateFrom}
        dateTo={reports.dateTo}
        onDateToChange={reports.setDateTo}
        isLoading={reports.isLoading}
        onRefresh={reports.fetchReports}
        onPreset={reports.applyPreset}
      >
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as ReportTab)}
          className="w-full"
        >
          <TabsList className="grid h-auto min-w-[680px] grid-cols-5">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="sales">Ventas</TabsTrigger>
            <TabsTrigger value="purchases">Compras</TabsTrigger>
            <TabsTrigger value="expenses">Gastos</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
        </Tabs>
      </ReportsFilters>

      {activeTab !== "analytics" && (
        <>
          <ReportsStats
            stats={reports.stats}
            salesCount={reports.salesData.length}
            purchasesCount={reports.purchasesData.length}
            expensesCount={reports.expensesData.length}
            salesData={reports.salesData}
            previousStats={previousStats}
          />
          <ReportsCharts
            activeTab={activeTab}
            salesData={reports.salesData}
            purchasesData={reports.purchasesData}
            expensesData={reports.expensesData}
          />
        </>
      )}

      <ReportsTabsEnhanced
        activeTab={activeTab}
        salesData={filteredSalesData}
        purchasesData={filteredPurchasesData}
        expensesData={filteredExpensesData}
        onExport={reports.exportPDF}
        onExportAllPdf={reports.exportAllPDF}
        onExportAllExcel={reports.exportAllExcel}
        salesFilters={salesFilters}
        setSalesFilters={setSalesFilters}
        purchasesFilters={purchasesFilters}
        setPurchasesFilters={setPurchasesFilters}
        expensesFilters={expensesFilters}
        setExpensesFilters={setExpensesFilters}
        rankings={rankings}
        previousStats={previousStats}
        stats={reports.stats}
      />

      <ReportsDataManagement onBackup={reports.handleBackup} />
    </div>
  )
}
