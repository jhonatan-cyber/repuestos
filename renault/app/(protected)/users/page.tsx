"use client"

import { UsersHeader } from "@/components/users/users-header"
import { UsersTable } from "@/components/users/users-table"
import { UsersFilters } from "@/components/users/users-filters"
import { UsersPagination } from "@/components/users/users-pagination"
import { UserStats } from "@/components/users/user-stats"
import { UserFormDialog } from "@/components/users/user-form"
import { UserDeleteDialog } from "@/components/users/user-delete-dialog"
import { UserDetailsDialog } from "@/components/users/user-details-dialog"
import { useUsers } from "@/hooks/use-users"

export default function UsersPage() {
  const {
    users,
    isLoading,
    search,
    setSearch,
    status,
    setStatus,
    role,
    setRole,
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
    selectedUser,
    userToDelete,
    userToView,
    stats,
    handleEdit,
    handleDelete,
    handleViewDetails,
    handleNewUser,
    handleToggleStatus,
    confirmDelete,
    handleFormSuccess,
  } = useUsers()

  return (
    <div className="space-y-6">
      {/* Header */}
      <UsersHeader onNewUser={handleNewUser} />

      {/* Stats */}
      <UserStats stats={stats} />

      {/* Filters */}
      <UsersFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        role={role}
        onRoleChange={setRole}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      {/* Table */}
      <UsersTable
        users={users}
        isLoading={isLoading}
        search={search}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        onViewDetails={handleViewDetails}
      />

      {/* Pagination */}
      <UsersPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {/* Dialogs */}
      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={selectedUser}
        onSuccess={handleFormSuccess}
      />

      <UserDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        user={userToDelete}
        onConfirm={confirmDelete}
      />

      <UserDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        user={userToView}
      />
    </div>
  )
}
