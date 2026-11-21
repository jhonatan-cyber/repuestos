"use client"

import React from "react"
import { Download } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/format-utils"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SaleDetailModal } from "@/components/reports/modals/sale-detail-modal"
import { PurchaseDetailModal } from "@/components/reports/modals/purchase-detail-modal"
import { ExpenseDetailModal } from "@/components/reports/modals/expense-detail-modal"
import { TableFilters } from "@/components/reports/filters/advanced-table-filters"
import { RankingGrid } from "@/components/reports/analytics/ranking-grid"
import { PeriodComparisonCards } from "@/components/reports/comparison/period-comparison-cards"
import type { ReportSale, ReportPurchase, ReportExpense } from "@/hooks/use-reports"
import {
  MobileList,
  MobileListCard,
  MobileListField,
  MobileListGrid,
  MobileListHeader,
} from "@/components/ui/mobile-list-card"

export type ReportTab = "all" | "sales" | "purchases" | "expenses" | "analytics"

interface ReportsTabsEnhancedProps {
  activeTab: ReportTab
  salesData: ReportSale[]
  purchasesData: ReportPurchase[]
  expensesData: ReportExpense[]
  onExport: (
    type: "sales" | "purchases" | "expenses",
    override?: {
      salesData?: ReportSale[]
      purchasesData?: ReportPurchase[]
      expensesData?: ReportExpense[]
    },
  ) => void
  onExportAllPdf: (override?: {
    salesData?: ReportSale[]
    purchasesData?: ReportPurchase[]
    expensesData?: ReportExpense[]
  }) => void
  onExportAllExcel: (override?: {
    salesData?: ReportSale[]
    purchasesData?: ReportPurchase[]
    expensesData?: ReportExpense[]
  }) => void
  // Filtros
  salesFilters?: { search: string; status: string; minAmount: number; maxAmount: number }
  setSalesFilters?: (filters: any) => void
  purchasesFilters?: { search: string; status: string; minAmount: number; maxAmount: number }
  setPurchasesFilters?: (filters: any) => void
  expensesFilters?: { search: string; status: string; minAmount: number; maxAmount: number }
  setExpensesFilters?: (filters: any) => void
  // Rankings
  rankings?: { topSellers: any[]; topClients: any[]; topProducts: any[]; topSuppliers: any[] }
  // Comparativa
  previousStats?: {
    totalSales: number
    totalPurchases: number
    totalExpenses: number
    netProfit: number
  }
  stats?: { totalSales: number; totalPurchases: number; totalExpenses: number; netProfit: number }
}

function ExportActions({
  activeTab,
  salesData,
  purchasesData,
  expensesData,
  onExport,
  onExportAllPdf,
  onExportAllExcel,
}: {
  activeTab: ReportTab
  salesData: ReportSale[]
  purchasesData: ReportPurchase[]
  expensesData: ReportExpense[]
  onExport: (
    type: "sales" | "purchases" | "expenses",
    override?: {
      salesData?: ReportSale[]
      purchasesData?: ReportPurchase[]
      expensesData?: ReportExpense[]
    },
  ) => void
  onExportAllPdf: (override?: {
    salesData?: ReportSale[]
    purchasesData?: ReportPurchase[]
    expensesData?: ReportExpense[]
  }) => void
  onExportAllExcel: (override?: {
    salesData?: ReportSale[]
    purchasesData?: ReportPurchase[]
    expensesData?: ReportExpense[]
  }) => void
}) {
  const activeExportData = {
    salesData,
    purchasesData,
    expensesData,
  }

  const activeType = activeTab === "all" || activeTab === "analytics" ? null : activeTab

  const exportCurrentTab = () => {
    if (!activeType) {
      onExportAllPdf(activeExportData)
      return
    }

    onExport(activeType, activeExportData)
  }

  const currentButtonLabel =
    activeType === "sales"
      ? "Exportar ventas en PDF"
      : activeType === "purchases"
        ? "Exportar compras en PDF"
        : activeType === "expenses"
          ? "Exportar gastos en PDF"
          : "Exportar actual en PDF"

  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Exportar todo
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuItem onClick={() => onExportAllPdf(activeExportData)}>
            Exportar todo en PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExportAllExcel(activeExportData)}>
            Exportar todo en Excel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button className="w-full sm:w-auto" variant="outline" onClick={exportCurrentTab}>
        <Download className="mr-2 h-4 w-4" />
        {currentButtonLabel}
      </Button>
    </div>
  )
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <h3 className="text-lg font-semibold">
        {title} <span className="text-sm font-normal text-muted-foreground">({count})</span>
      </h3>
    </div>
  )
}

export function ReportsTabsEnhanced({
  activeTab,
  salesData,
  purchasesData,
  expensesData,
  onExport,
  onExportAllPdf,
  onExportAllExcel,
  salesFilters = { search: "", status: "all", minAmount: 0, maxAmount: 999999 },
  setSalesFilters = () => {},
  purchasesFilters = { search: "", status: "all", minAmount: 0, maxAmount: 999999 },
  setPurchasesFilters = () => {},
  expensesFilters = { search: "", status: "all", minAmount: 0, maxAmount: 999999 },
  setExpensesFilters = () => {},
  rankings = { topSellers: [], topClients: [], topProducts: [], topSuppliers: [] },
  previousStats,
  stats,
}: ReportsTabsEnhancedProps) {
  // Estado para modales
  const [selectedSale, setSelectedSale] = React.useState<ReportSale | null>(null)
  const [selectedPurchase, setSelectedPurchase] = React.useState<ReportPurchase | null>(null)
  const [selectedExpense, setSelectedExpense] = React.useState<ReportExpense | null>(null)

  return (
    <>
      {activeTab !== "all" && (
        <ExportActions
          activeTab={activeTab}
          salesData={salesData}
          purchasesData={purchasesData}
          expensesData={expensesData}
          onExport={onExport}
          onExportAllPdf={onExportAllPdf}
          onExportAllExcel={onExportAllExcel}
        />
      )}
      <Tabs value={activeTab} className="space-y-6">
        <TabsContent value="all" className="space-y-4">
          <ExportActions
            activeTab={activeTab}
            salesData={salesData}
            purchasesData={purchasesData}
            expensesData={expensesData}
            onExport={onExport}
            onExportAllPdf={onExportAllPdf}
            onExportAllExcel={onExportAllExcel}
          />

          {/* Comparativa de períodos */}
          {stats && previousStats && (
            <div>
              <h3 className="text-sm font-semibold mb-3">Comparativa vs Período Anterior</h3>
              <PeriodComparisonCards
                stats={[
                  {
                    label: "Ventas",
                    current: stats.totalSales,
                    previous: previousStats.totalSales,
                    isCurrency: true,
                  },
                  {
                    label: "Compras",
                    current: stats.totalPurchases,
                    previous: previousStats.totalPurchases,
                    isCurrency: true,
                  },
                  {
                    label: "Gastos",
                    current: stats.totalExpenses,
                    previous: previousStats.totalExpenses,
                    isCurrency: true,
                  },
                  {
                    label: "Utilidad Neta",
                    current: stats.netProfit,
                    previous: previousStats.netProfit,
                    isCurrency: true,
                  },
                ]}
              />
            </div>
          )}

          {salesData.length === 0 && purchasesData.length === 0 && expensesData.length === 0 ? (
            <div className="module-empty flex items-center justify-center" role="status">
              No hay registros para los filtros seleccionados
            </div>
          ) : null}

          {salesData.length > 0 && (
            <section className="space-y-4">
              <SectionHeader title="Reporte de ventas" count={salesData.length} />
              <TableFilters
                search={salesFilters.search}
                onSearchChange={(s) => setSalesFilters({ ...salesFilters, search: s })}
                status={salesFilters.status}
                onStatusChange={(s) => setSalesFilters({ ...salesFilters, status: s })}
                minAmount={salesFilters.minAmount}
                maxAmount={salesFilters.maxAmount}
                onAmountChange={(min, max) =>
                  setSalesFilters({ ...salesFilters, minAmount: min, maxAmount: max })
                }
                statuses={["completada", "pendiente", "cancelada"]}
                onClear={() =>
                  setSalesFilters({ search: "", status: "all", minAmount: 0, maxAmount: 999999 })
                }
              />
              <MobileList>
                {salesData.map((sale) => (
                  <MobileListCard key={sale.id} onClick={() => setSelectedSale(sale)}>
                    <MobileListHeader title={sale.clientName} subtitle={formatDate(sale.date)} />
                    <MobileListGrid>
                      <MobileListField label="Vendedor" value={sale.sellerName} />
                      <MobileListField
                        label="Total"
                        value={
                          <span className="text-base font-bold">{formatCurrency(sale.total)}</span>
                        }
                      />
                    </MobileListGrid>
                  </MobileListCard>
                ))}
              </MobileList>
              <div className="module-table hidden md:block">
                <div className="max-h-[420px] overflow-auto">
                  <DataTable caption="Detalle de ventas del reporte" minWidth="min-w-[760px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Vendedor</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="text-right">Descuento</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesData.map((sale) => (
                        <TableRow
                          key={sale.id}
                          onClick={() => setSelectedSale(sale)}
                          className="cursor-pointer hover:bg-muted transition-colors"
                        >
                          <TableCell className="font-mono text-sm">
                            {formatDate(sale.date)}
                          </TableCell>
                          <TableCell>{sale.clientName}</TableCell>
                          <TableCell className="text-muted-foreground">{sale.sellerName}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(sale.subtotal)}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            -{formatCurrency(sale.discount)}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {formatCurrency(sale.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </DataTable>
                </div>
              </div>
            </section>
          )}

          {purchasesData.length > 0 && (
            <section className="space-y-4">
              <SectionHeader title="Reporte de compras" count={purchasesData.length} />
              <TableFilters
                search={purchasesFilters.search}
                onSearchChange={(s) => setPurchasesFilters({ ...purchasesFilters, search: s })}
                status={purchasesFilters.status}
                onStatusChange={(s) => setPurchasesFilters({ ...purchasesFilters, status: s })}
                minAmount={purchasesFilters.minAmount}
                maxAmount={purchasesFilters.maxAmount}
                onAmountChange={(min, max) =>
                  setPurchasesFilters({ ...purchasesFilters, minAmount: min, maxAmount: max })
                }
                statuses={["pendiente", "recibida", "cancelada"]}
                onClear={() =>
                  setPurchasesFilters({
                    search: "",
                    status: "all",
                    minAmount: 0,
                    maxAmount: 999999,
                  })
                }
              />
              <MobileList>
                {purchasesData.map((purchase) => (
                  <MobileListCard key={purchase.id} onClick={() => setSelectedPurchase(purchase)}>
                    <MobileListHeader
                      title={purchase.supplierName}
                      subtitle={formatDate(purchase.date)}
                    />
                    <MobileListGrid>
                      <MobileListField label="Comprador" value={purchase.buyerName} />
                      <MobileListField
                        label="Total"
                        value={
                          <span className="text-base font-bold">
                            {formatCurrency(purchase.total)}
                          </span>
                        }
                      />
                    </MobileListGrid>
                  </MobileListCard>
                ))}
              </MobileList>
              <div className="module-table hidden md:block">
                <div className="max-h-[420px] overflow-auto">
                  <DataTable caption="Detalle de compras del reporte" minWidth="min-w-[760px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Proveedor</TableHead>
                        <TableHead>Comprador</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="text-right">Impuesto</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchasesData.map((purchase) => (
                        <TableRow
                          key={purchase.id}
                          onClick={() => setSelectedPurchase(purchase)}
                          className="cursor-pointer hover:bg-muted transition-colors"
                        >
                          <TableCell className="font-mono text-sm">
                            {formatDate(purchase.date)}
                          </TableCell>
                          <TableCell>{purchase.supplierName}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {purchase.buyerName}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(purchase.subtotal)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(purchase.tax)}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {formatCurrency(purchase.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </DataTable>
                </div>
              </div>
            </section>
          )}

          {expensesData.length > 0 && (
            <section className="space-y-4">
              <SectionHeader title="Reporte de gastos" count={expensesData.length} />
              <TableFilters
                search={expensesFilters.search}
                onSearchChange={(s) => setExpensesFilters({ ...expensesFilters, search: s })}
                status={expensesFilters.status}
                onStatusChange={(s) => setExpensesFilters({ ...expensesFilters, status: s })}
                minAmount={expensesFilters.minAmount}
                maxAmount={expensesFilters.maxAmount}
                onAmountChange={(min, max) =>
                  setExpensesFilters({ ...expensesFilters, minAmount: min, maxAmount: max })
                }
                statuses={[]}
                onClear={() =>
                  setExpensesFilters({ search: "", status: "all", minAmount: 0, maxAmount: 999999 })
                }
              />
              <MobileList>
                {expensesData.map((expense) => (
                  <MobileListCard key={expense.id} onClick={() => setSelectedExpense(expense)}>
                    <MobileListHeader
                      title={expense.description}
                      subtitle={formatDate(expense.date)}
                    />
                    <MobileListGrid>
                      <MobileListField label="Categoría" value={expense.category || "-"} />
                      <MobileListField
                        label="Monto"
                        value={
                          <span className="text-base font-bold">
                            {formatCurrency(expense.amount)}
                          </span>
                        }
                      />
                    </MobileListGrid>
                  </MobileListCard>
                ))}
              </MobileList>
              <div className="module-table hidden md:block">
                <div className="max-h-[420px] overflow-auto">
                  <DataTable caption="Detalle de gastos del reporte" minWidth="min-w-[720px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Responsable</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expensesData.map((expense) => (
                        <TableRow
                          key={expense.id}
                          onClick={() => setSelectedExpense(expense)}
                          className="cursor-pointer hover:bg-muted transition-colors"
                        >
                          <TableCell className="font-mono text-sm">
                            {formatDate(expense.date)}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{expense.description}</TableCell>
                          <TableCell>{expense.category || "-"}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {expense.responsibleName || "-"}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {formatCurrency(expense.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </DataTable>
                </div>
              </div>
            </section>
          )}
        </TabsContent>

        {/* Tab Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <RankingGrid
            topSellers={rankings.topSellers}
            topClients={rankings.topClients}
            topProducts={rankings.topProducts}
            topSuppliers={rankings.topSuppliers}
          />
        </TabsContent>
      </Tabs>

      {/* Modales */}
      <SaleDetailModal
        sale={selectedSale}
        open={!!selectedSale}
        onOpenChange={(open) => !open && setSelectedSale(null)}
      />
      <PurchaseDetailModal
        purchase={selectedPurchase}
        open={!!selectedPurchase}
        onOpenChange={(open) => !open && setSelectedPurchase(null)}
      />
      <ExpenseDetailModal
        expense={selectedExpense}
        allExpenses={expensesData}
        open={!!selectedExpense}
        onOpenChange={(open) => !open && setSelectedExpense(null)}
      />
    </>
  )
}
