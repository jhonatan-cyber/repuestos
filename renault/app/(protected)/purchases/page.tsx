"use client"

import { PrintPreviewDialog } from "@/components/sales/print-preview-dialog"
import { PurchaseDetailsDialog } from "@/components/purchases/purchase-details-dialog"
import { PurchaseFormDialog } from "@/components/purchases/purchase-form-dialog"
import { PurchaseStats } from "@/components/purchases/purchase-stats"
import { PurchasesFilters } from "@/components/purchases/purchases-filters"
import { PurchasesHeader } from "@/components/purchases/purchases-header"
import { PurchasesPagination } from "@/components/purchases/purchases-pagination"
import { PurchasesTable } from "@/components/purchases/purchases-table"
import { PrintPurchase } from "@/components/purchases/print-purchase"
import { useOpenCashStatus } from "@/hooks/use-open-cash-status"
import { usePurchases } from "@/hooks/use-purchases"

export default function PurchasesPage() {
  const { hasOpenCash } = useOpenCashStatus()
  const {
    purchases,
    isLoading,
    isSubmitting,
    suppliers,
    products,
    search,
    setSearch,
    status,
    setStatus,
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
    detailsOpen,
    setDetailsOpen,
    formOpen,
    setFormOpen,
    selectedPurchase,
    purchaseToPrint,
    stats,
    handleViewDetails,
    handlePrint,
    handleExportReceipt,
    handleClosePrintPreview,
    handleNewPurchase,
    handleCreatePurchase,
    handleProductCreated,
    handleCreateSupplier,
    handleExportPDF,
    clearDateRange,
  } = usePurchases()

  return (
    <>
      <div className="space-y-6 print:hidden">
        <PurchasesHeader
          onNewPurchase={handleNewPurchase}
          onExportPDF={handleExportPDF}
          disableNewPurchase={!hasOpenCash}
        />
        <PurchaseStats stats={stats} />
        <PurchasesFilters
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          onClearDates={clearDateRange}
        />
        <PurchasesTable
          purchases={purchases}
          isLoading={isLoading}
          search={search}
          onViewDetails={handleViewDetails}
          onPrint={handlePrint}
        />
        <PurchasesPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
        <PurchaseDetailsDialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          purchase={selectedPurchase}
          onExportPdf={handleExportReceipt}
        />
        <PurchaseFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          suppliers={suppliers}
          products={products}
          isSubmitting={isSubmitting}
          onSubmit={handleCreatePurchase}
          onProductCreated={handleProductCreated}
          onCreateSupplier={handleCreateSupplier}
        />
      </div>

      <PrintPreviewDialog
        open={!!purchaseToPrint}
        onClose={handleClosePrintPreview}
        elementId="purchase-to-print"
        onExportPdf={() => purchaseToPrint && handleExportReceipt(purchaseToPrint)}
      >
        <PrintPurchase purchase={purchaseToPrint!} />
      </PrintPreviewDialog>
    </>
  )
}
