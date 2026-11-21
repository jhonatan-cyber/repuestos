"use client"

import { SuppliersHeader } from "@/components/suppliers/suppliers-header"
import { SupplierStats } from "@/components/suppliers/supplier-stats"
import { SuppliersFilters } from "@/components/suppliers/suppliers-filters"
import { SuppliersTable } from "@/components/suppliers/suppliers-table"
import { SuppliersPagination } from "@/components/suppliers/suppliers-pagination"
import { SupplierFormDialog } from "@/components/suppliers/supplier-form"
import { SupplierDetailsDialog } from "@/components/suppliers/supplier-details-dialog"
import { SupplierDeleteDialog } from "@/components/suppliers/supplier-delete-dialog"
import { SupplierToggleDialog } from "@/components/suppliers/supplier-toggle-dialog"
import { useSuppliers } from "@/hooks/use-suppliers"

export default function SuppliersPage() {
  const {
    suppliers,
    isLoading,
    error,
    search,
    setSearch,
    status,
    setStatus,
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
    toggleDialogOpen,
    setToggleDialogOpen,
    selectedSupplier,
    supplierToDelete,
    supplierToView,
    supplierToToggle,
    stats,
    handleEdit,
    handleDelete,
    handleToggleStatus,
    confirmToggleStatus,
    handleViewDetails,
    handleNewSupplier,
    confirmDelete,
    handleFormSuccess,
  } = useSuppliers()

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
      <SuppliersHeader onNewSupplier={handleNewSupplier} />

      {/* Error message */}
      {error && (
        <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
          <p className="text-orange-800">{error}</p>
        </div>
      )}

      {/* Stats */}
      <SupplierStats stats={stats} />

      {/* Filters */}
      <SuppliersFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      {/* Table */}
      <SuppliersTable
        suppliers={suppliers}
        isLoading={isLoading}
        search={search}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        onViewDetails={handleViewDetails}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <SuppliersPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          pageSize={pageSize}
        />
      )}

      {/* Dialogs */}
      <SupplierFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        supplier={selectedSupplier}
        onSuccess={handleFormSuccess}
      />

      <SupplierDetailsDialog
        supplier={supplierToView}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />

      <SupplierDeleteDialog
        supplier={supplierToDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
      />

      <SupplierToggleDialog
        supplier={supplierToToggle}
        open={toggleDialogOpen}
        onOpenChange={setToggleDialogOpen}
        onConfirm={confirmToggleStatus}
      />
    </div>
  )
}
