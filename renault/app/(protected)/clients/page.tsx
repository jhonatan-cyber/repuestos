"use client"

import { ClientsHeader } from "@/components/clients/clients-header"
import { ClientsTable } from "@/components/clients/clients-table"
import { ClientsFilters } from "@/components/clients/clients-filters"
import { ClientsPagination } from "@/components/clients/clients-pagination"
import { ClientStats } from "@/components/clients/client-stats"
import { ClientFormDialog } from "@/components/clients/client-form"
import { ClientDeleteDialog } from "@/components/clients/client-delete-dialog"
import { useClients } from "@/hooks/use-clients"

export default function ClientsPage() {
  const {
    clients,
    isLoading,
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
    selectedClient,
    clientToDelete,
    stats,
    handleEdit,
    handleDelete,
    handleNewClient,
    handleToggleStatus,
    confirmDelete,
    handleFormSuccess,
  } = useClients()

  return (
    <div className="space-y-6">
      {/* Header */}
      <ClientsHeader onNewClient={handleNewClient} />

      {/* Stats */}
      <ClientStats stats={stats} />

      {/* Filters */}
      <ClientsFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      {/* Table */}
      <ClientsTable
        clients={clients}
        isLoading={isLoading}
        search={search}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
      />

      {/* Pagination */}
      <ClientsPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {/* Dialogs */}
      <ClientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        client={selectedClient}
        onSuccess={handleFormSuccess}
      />

      <ClientDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        client={clientToDelete}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
