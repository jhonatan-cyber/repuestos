"use client"

import { formatCurrency } from "@/lib/format-utils"
import { ExpensesHeader } from "@/components/expenses/expenses-header"
import { ExpenseStats } from "@/components/expenses/expense-stats"
import { ExpensesFilters } from "@/components/expenses/expenses-filters"
import { ExpensesTable } from "@/components/expenses/expenses-table"
import { ExpensesPagination } from "@/components/expenses/expenses-pagination"
import { ExpenseFormDialog } from "@/components/expenses/expense-form"
import { ExpenseDetailsDialog } from "@/components/expenses/expense-details-dialog"
import { ExpenseDeleteDialog } from "@/components/expenses/expense-delete-dialog"
import { useOpenCashStatus } from "@/hooks/use-open-cash-status"
import { useExpenses } from "@/hooks/use-expenses"

export default function ExpensesPage() {
  const { hasOpenCash } = useOpenCashStatus()
  const {
    expenses,
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
    totalItems,
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
    clearDateRange,
    handleEdit,
    handleDelete,
    handleViewDetails,
    handleNewExpense,
    confirmDelete,
    handleFormSuccess,
    handleExportPDF,
  } = useExpenses()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded" />
          ))}
        </div>
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <ExpensesHeader
        onNewExpense={handleNewExpense}
        onExportPDF={handleExportPDF}
        disableNewExpense={!hasOpenCash}
      />

      {/* Error message */}
      {error && (
        <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
          <p className="text-orange-800">{error}</p>
        </div>
      )}

      {/* Stats */}
      <ExpenseStats stats={stats} />

      <div className="rounded-2xl border bg-primary/5 px-4 py-3 text-sm text-primary-foreground/90">
        <p className="font-medium text-primary">
          Total gastado en el rango seleccionado:{" "}
          <span className="font-semibold">{formatCurrency(stats.totalAmount)}</span>
        </p>
        <p className="text-muted-foreground">
          {startDate || endDate
            ? `Rango: ${startDate || "inicio"} - ${endDate || "hoy"}`
            : "Mostrando todos los gastos registrados."}
        </p>
      </div>

      {/* Filters */}
      <ExpensesFilters
        search={search}
        onSearchChange={setSearch}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onClearDates={clearDateRange}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      {/* Table */}
      <ExpensesTable
        expenses={expenses}
        isLoading={isLoading}
        search={search}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewDetails={handleViewDetails}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <ExpensesPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          pageSize={pageSize}
        />
      )}

      {/* Dialogs */}
      <ExpenseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        expense={selectedExpense}
        onSuccess={handleFormSuccess}
      />

      <ExpenseDetailsDialog
        expense={expenseToView}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />

      <ExpenseDeleteDialog
        expense={expenseToDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
