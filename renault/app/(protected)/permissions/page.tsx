"use client"

import { PermissionsHeader } from "@/components/permissions/permissions-header"
import { PermissionsTable } from "@/components/permissions/permissions-table"
import { PermissionsFilters } from "@/components/permissions/permissions-filters"
import { PermissionsPagination } from "@/components/permissions/permissions-pagination"
import { PermissionStats } from "@/components/permissions/permission-stats"
import { PermissionFormDialog } from "@/components/permissions/permission-form"
import { PermissionDeleteDialog } from "@/components/permissions/permission-delete-dialog"
import { usePermissions } from "@/hooks/use-permissions"

export default function PermissionsPage() {
  const {
    permissions,
    isLoading,
    search,
    setSearch,
    status,
    setStatus,
    category,
    setCategory,
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
    selectedPermission,
    permissionToDelete,
    stats,
    handleEdit,
    handleDelete,
    handleToggleStatus,
    handleNewPermission,
    confirmDelete,
    handleFormSuccess,
  } = usePermissions()

  return (
    <div className="space-y-6">
      {/* Header */}
      <PermissionsHeader onNewPermission={handleNewPermission} />

      {/* Stats */}
      <PermissionStats stats={stats} />

      {/* Filters */}
      <PermissionsFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        category={category}
        onCategoryChange={setCategory}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      {/* Table */}
      <PermissionsTable
        permissions={permissions}
        isLoading={isLoading}
        search={search}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
      />

      {/* Pagination */}
      <PermissionsPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {/* Dialogs */}
      <PermissionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        permission={selectedPermission}
        onSuccess={handleFormSuccess}
      />

      <PermissionDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        permission={permissionToDelete}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
