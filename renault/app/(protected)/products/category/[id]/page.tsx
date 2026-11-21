"use client"

import { useParams } from "next/navigation"
import { ProductsHeader } from "@/components/products/products-header"
import { ProductsTable } from "@/components/products/products-table"
import { ProductsFilters } from "@/components/products/products-filters"
import { ProductsPagination } from "@/components/products/products-pagination"
import { ProductStats } from "@/components/products/product-stats"
import { ProductFormDialog } from "@/components/products/product-form"
import { ProductDeleteDialog } from "@/components/products/product-delete-dialog"
import { ProductToggleDialog } from "@/components/products/product-toggle-dialog"
import { ProductDetailsDialog } from "@/components/products/product-details-dialog"
import { useProducts } from "@/hooks/use-products"

export default function ProductsCategoryPage() {
  const params = useParams<{ id: string }>()
  const categoryId = params?.id || ""
  const {
    products,
    allProducts,
    category,
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
    toggleDialogOpen,
    setToggleDialogOpen,
    detailsDialogOpen,
    setDetailsDialogOpen,
    selectedProduct,
    productToDelete,
    productToToggle,
    productToView,
    stats,
    handleEdit,
    handleDelete,
    handleNewProduct,
    handleViewDetails,
    handleToggleStatus,
    confirmToggleStatus,
    confirmDelete,
    handleFormSuccess,
  } = useProducts(categoryId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <ProductsHeader
        onNewProduct={handleNewProduct}
        category={category}
        categoryId={categoryId}
        allProducts={allProducts}
      />

      {/* Stats */}
      <ProductStats stats={stats} />

      {/* Filters */}
      <ProductsFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      <ProductsTable
        products={products}
        isLoading={isLoading}
        search={search}
        onViewDetails={handleViewDetails}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
      />

      {/* Pagination */}
      <ProductsPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {/* Dialogs */}
      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={selectedProduct}
        categoryId={categoryId}
        onSuccess={handleFormSuccess}
      />

      <ProductDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        product={productToDelete}
        onConfirm={confirmDelete}
      />

      <ProductToggleDialog
        open={toggleDialogOpen}
        onOpenChange={setToggleDialogOpen}
        product={productToToggle}
        onConfirm={confirmToggleStatus}
      />

      <ProductDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        product={productToView}
      />
    </div>
  )
}
