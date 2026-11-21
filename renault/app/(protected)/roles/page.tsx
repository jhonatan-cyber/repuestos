"use client"

import { RolesHeader } from "@/components/roles/roles-header"
import { RolesTable } from "@/components/roles/roles-table"
import { RolesFilters } from "@/components/roles/roles-filters"
import { RolesPagination } from "@/components/roles/roles-pagination"
import { RoleStats } from "@/components/roles/role-stats"
import { RoleFormDialog } from "@/components/roles/role-form"
import { RoleDeleteDialog } from "@/components/roles/role-delete-dialog"
import { RoleDetailsDialog } from "@/components/roles/role-details-dialog"
import { useRoles } from "@/hooks/use-roles"

export default function RolesPage() {
  const {
    roles,
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
    detailsDialogOpen,
    setDetailsDialogOpen,
    selectedRole,
    roleToDelete,
    roleToView,
    stats,
    handleEdit,
    handleDelete,
    handleToggleStatus,
    handleViewDetails,
    handleNewRole,
    confirmDelete,
    handleFormSuccess,
  } = useRoles()

  return (
    <div className="space-y-6">
      {/* Header */}
      <RolesHeader onNewRole={handleNewRole} />

      {/* Stats */}
      <RoleStats stats={stats} />

      {/* Filters */}
      <RolesFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      {/* Table */}
      <RolesTable
        roles={roles}
        isLoading={isLoading}
        search={search}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        onViewDetails={handleViewDetails}
      />

      {/* Pagination */}
      <RolesPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {/* Dialogs */}
      <RoleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        role={selectedRole}
        onSuccess={handleFormSuccess}
      />

      <RoleDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        role={roleToDelete}
        onConfirm={confirmDelete}
      />

      <RoleDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        role={roleToView}
      />
    </div>
  )
}
