"use client"

import { ClientHistoryDialog } from "@/components/sales/client-history-dialog"
import { PrintSale } from "@/components/sales/print-sale"
import { SaleDetailsDialog } from "@/components/sales/sale-details-dialog"
import { SaleEditDialog } from "@/components/sales/sale-edit-dialog"
import { SaleFormDialog } from "@/components/sales/sale-form-dialog"
import { SalesFilters } from "@/components/sales/sales-filters"
import { SalesHeader } from "@/components/sales/sales-header"
import { SalesPagination } from "@/components/sales/sales-pagination"
import { SalesStats } from "@/components/sales/sales-stats"
import { SalesTable } from "@/components/sales/sales-table"
import { CancelSaleDialog } from "@/components/sales/cancel-sale-dialog"
import { PrintPreviewDialog } from "@/components/sales/print-preview-dialog"
import { useOpenCashStatus } from "@/hooks/use-open-cash-status"
import { useSales } from "@/hooks/use-sales"
import { useEffect, useState } from "react"

export default function SalesPage() {
  const { hasOpenCash } = useOpenCashStatus()

  const [clientHistoryOpen, setClientHistoryOpen] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [selectedClientName, setSelectedClientName] = useState<string>("")

  const {
    sales,
    isLoading,
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
    editOpen,
    setEditOpen,
    selectedSale,
    saleToPrint,
    selectedSaleForEdit,
    isCreatingSale,
    isUpdatingSale,
    cancelOpen,
    setCancelOpen,
    saleToCancel,
    isCancellingSale,
    user,
    isAuthLoading,
    stats,
    trend,
    handleViewDetails,
    handlePrint,
    handleExportReceipt,
    handleClosePrintPreview,
    handleNewSale,
    handleEditSale,
    handleCreateSale,
    handleUpdateSale,
    handleRequestCancelSale,
    handleConfirmCancelSale,
    handleExportPDF,
    clearDateRange,
  } = useSales()

  const handleViewClientHistory = (clientId: string, clientName: string) => {
    setSelectedClientId(clientId)
    setSelectedClientName(clientName)
    setClientHistoryOpen(true)
  }

  const handleCloseClientHistory = () => {
    setClientHistoryOpen(false)
    setSelectedClientId("")
    setSelectedClientName("")
  }

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault()
        if (hasOpenCash && !formOpen && !editOpen && !detailsOpen && !cancelOpen) {
          handleNewSale()
        }
      }
    }
    window.addEventListener("keydown", handleKeydown)
    return () => window.removeEventListener("keydown", handleKeydown)
  }, [hasOpenCash, formOpen, editOpen, detailsOpen, cancelOpen, handleNewSale])

  return (
    <>
      <div className="space-y-6 print:hidden">
        <SalesHeader
          onNewSale={handleNewSale}
          onExportPDF={handleExportPDF}
          disableNewSale={!hasOpenCash || isAuthLoading}
        />

        <SalesStats stats={stats} trend={trend} />

        <SalesFilters
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

        <SalesTable
          sales={sales}
          isLoading={isLoading}
          search={search}
          onViewDetails={handleViewDetails}
          onPrint={handlePrint}
          onEdit={handleEditSale}
          onCancel={handleRequestCancelSale}
          onViewClientHistory={handleViewClientHistory}
          onNewSale={hasOpenCash ? handleNewSale : undefined}
        />

        <SalesPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />

        <SaleDetailsDialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          sale={selectedSale}
          onExportPdf={handleExportReceipt}
        />
        <ClientHistoryDialog
          open={clientHistoryOpen}
          onOpenChange={handleCloseClientHistory}
          clientId={selectedClientId}
          clientName={selectedClientName}
          onViewSaleDetails={(sale) => {
            handleCloseClientHistory()
            handleViewDetails(sale)
          }}
        />
        <CancelSaleDialog
          open={cancelOpen}
          onOpenChange={setCancelOpen}
          sale={saleToCancel}
          isCancelling={isCancellingSale}
          onConfirm={handleConfirmCancelSale}
        />
        <SaleFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          isSubmitting={isCreatingSale}
          sellerUserId={String(user?.id ?? "")}
          onSubmit={handleCreateSale}
        />
        <SaleEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          sale={selectedSaleForEdit}
          isSubmitting={isUpdatingSale}
          sellerUserId={String(user?.id ?? "")}
          onSubmit={handleUpdateSale}
        />
      </div>

      <PrintPreviewDialog
        landscape
        open={!!saleToPrint}
        onClose={handleClosePrintPreview}
        onExportPdf={() => saleToPrint && handleExportReceipt(saleToPrint)}
      >
        <PrintSale sale={saleToPrint!} />
      </PrintPreviewDialog>
    </>
  )
}
