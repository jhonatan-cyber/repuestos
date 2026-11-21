"use client"

import { CategoriesHeader } from "@/components/categories/categories-header"
import { CategoriesTable } from "@/components/categories/categories-table"
import { CategoriesFilters } from "@/components/categories/categories-filters"
import { CategoriesPagination } from "@/components/categories/categories-pagination"
import { CategoryStats } from "@/components/categories/category-stats"
import { CategoryFormDialog } from "@/components/categories/category-form"
import { CategoryDeleteDialog } from "@/components/categories/category-delete-dialog"
import { CategoryToggleDialog } from "@/components/categories/category-toggle-dialog"
import { useCategories } from "@/hooks/use-categories"

export default function CategoriesPage() {
  const {
    categories,
    isLoading,
    search,
    setSearch,
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
    selectedCategory,
    categoryToDelete,
    toggleDialogOpen,
    setToggleDialogOpen,
    categoryToToggle,
    stats,
    handleEdit,
    handleDelete,
    handleNewCategory,
    handleToggleStatus,
    confirmDelete,
    confirmToggleStatus,
    handleFormSuccess,
  } = useCategories()

  return (
    <div className="space-y-6">
      {/* Header */}
      <CategoriesHeader onNewCategory={handleNewCategory} />

      {/* Stats */}
      <CategoryStats stats={stats} />

      {/* Filters */}
      <CategoriesFilters
        search={search}
        onSearchChange={setSearch}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      {/* Table */}
      <CategoriesTable
        categories={categories}
        isLoading={isLoading}
        search={search}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
      />

      {/* Pagination */}
      <CategoriesPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {/* Dialogs */}
      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={selectedCategory}
        onSuccess={handleFormSuccess}
      />

      <CategoryDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        category={categoryToDelete}
        onConfirm={confirmDelete}
      />

      <CategoryToggleDialog
        open={toggleDialogOpen}
        onOpenChange={setToggleDialogOpen}
        category={categoryToToggle}
        onConfirm={confirmToggleStatus}
      />
    </div>
  )
}
