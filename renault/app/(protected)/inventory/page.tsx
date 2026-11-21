"use client"

import { InventoryDeleteDialog } from "@/components/inventory/inventory-delete-dialog"
import { InventoryFilters } from "@/components/inventory/inventory-filters"
import { InventoryHeader } from "@/components/inventory/inventory-header"
import { InventoryPagination } from "@/components/inventory/inventory-pagination"
import { InventoryStats } from "@/components/inventory/inventory-stats"
import { ProductFormDialog } from "@/components/inventory/product-form"
import { ProductsTable } from "@/components/inventory/products-table"
import { useInventory } from "@/hooks/use-inventory"

export default function InventoryPage() {
  const {
    products,
    isLoading,
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    supplierFilter,
    setSupplierFilter,
    stockFilter,
    setStockFilter,
    categories,
    suppliers,
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
    selectedProduct,
    productToDelete,
    stats,
    handleEdit,
    handleDelete,
    handleNewProduct,
    confirmDelete,
    handleFormSuccess,
  } = useInventory()

  return (
    <div className="space-y-6">
      <InventoryHeader onNewProduct={handleNewProduct} />

      <InventoryStats stats={stats} />

      <InventoryFilters
        search={search}
        onSearchChange={setSearch}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        supplierFilter={supplierFilter}
        onSupplierFilterChange={setSupplierFilter}
        stockFilter={stockFilter}
        onStockFilterChange={setStockFilter}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        categories={categories}
        suppliers={suppliers}
      />

      <ProductsTable
        products={products}
        isLoading={isLoading}
        search={search}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <InventoryPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={selectedProduct}
        onSuccess={handleFormSuccess}
      />

      <InventoryDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        product={productToDelete}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
