"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { PrintPreviewDialog } from "@/components/sales/print-preview-dialog"
import { exportQuotationPDF } from "@/lib/export"
import { useQuotations } from "@/hooks/use-quotations"
import { apiClient } from "@/lib/api-client"
import { QuotationsHeader } from "@/components/quotations/quotations-header"
import { QuotationStats } from "@/components/quotations/quotation-stats"
import { QuotationsFilters } from "@/components/quotations/quotations-filters"
import { QuotationsTable } from "@/components/quotations/quotations-table"
import { QuotationsPagination } from "@/components/quotations/quotations-pagination"
import { QuotationFormDialog } from "@/components/quotations/quotation-form"
import { QuotationDetailsDialog } from "@/components/quotations/quotation-details-dialog"
import { QuotationDeleteDialog } from "@/components/quotations/quotation-delete-dialog"
import { ConvertQuotationDialog } from "@/components/quotations/convert-quotation-dialog"
import { PrintQuotation } from "@/components/quotations/print-quotation"
import { SupplierRequestsTable } from "@/components/quotations/supplier-requests-table"
import { SupplierRequestDetailsDialog } from "@/components/quotations/supplier-request-details-dialog"
import type { SupplierRequestWithProducts } from "@/lib/types"
import { ModulePagination } from "@/components/ui/module-pagination"

export default function QuotationsPage() {
  const [activeTab, setActiveTab] = useState("clientes")
  const [supplierRequests, setSupplierRequests] = useState<any[]>([])
  const [isLoadingSupplierRequests, setIsLoadingSupplierRequests] = useState(false)
  const [supplierCurrentPage, setSupplierCurrentPage] = useState(1)
  const [supplierRequestDetailOpen, setSupplierRequestDetailOpen] = useState(false)
  const [selectedSupplierRequest, setSelectedSupplierRequest] =
    useState<SupplierRequestWithProducts | null>(null)

  const {
    quotations,
    isLoading,
    search,
    setSearch,
    status,
    setStatus,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    totalPages,
    totalItems,
    formOpen,
    setFormOpen,
    detailsOpen,
    setDetailsOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    convertDialogOpen,
    setConvertDialogOpen,
    selectedQuotation,
    setSelectedQuotation,
    quotationToDelete,
    quotationToConvert,
    quotationToPrint,
    sellerUserId,
    stats,
    handleViewDetails,
    handleEdit,
    handleDelete,
    handleConvert,
    handlePrint,
    handleClosePrintPreview,
    handleNewQuotation,
    confirmDelete,
    handleFormSuccess,
    handleConvertSuccess,
    handleExport,
  } = useQuotations()

  const fetchSupplierRequests = useCallback(async () => {
    setIsLoadingSupplierRequests(true)
    try {
      const data = await apiClient<{ data?: unknown[] } | unknown[]>("/api/supplier-requests")
      setSupplierRequests((data as { data?: unknown[] })?.data ?? (Array.isArray(data) ? data : []))
    } catch {
      // silencio
    } finally {
      setIsLoadingSupplierRequests(false)
    }
  }, [])

  const onFormSuccess = useCallback(() => {
    handleFormSuccess()
    fetchSupplierRequests()
  }, [handleFormSuccess, fetchSupplierRequests])

  useEffect(() => {
    if (activeTab === "proveedores") {
      fetchSupplierRequests()
    }
  }, [activeTab, fetchSupplierRequests])

  useEffect(() => setSupplierCurrentPage(1), [search, status, startDate, endDate, pageSize])

  const filteredSupplierRequests = useMemo(() => {
    const query = search.trim().toLowerCase()
    return supplierRequests.filter((request) => {
      const requestDate = String(request.sentAt || "").slice(0, 10)
      const matchesSearch =
        !query ||
        [request.supplierName, request.notes, request.id].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query),
        )
      const matchesStatus = status === "all" || request.status === status
      const matchesStart = !startDate || requestDate >= startDate
      const matchesEnd = !endDate || requestDate <= endDate
      return matchesSearch && matchesStatus && matchesStart && matchesEnd
    })
  }, [supplierRequests, search, status, startDate, endDate])

  const paginatedSupplierRequests = useMemo(
    () =>
      filteredSupplierRequests.slice(
        (supplierCurrentPage - 1) * pageSize,
        supplierCurrentPage * pageSize,
      ),
    [filteredSupplierRequests, supplierCurrentPage, pageSize],
  )

  const handleViewSupplierRequestDetail = (request: any) => {
    setSelectedSupplierRequest(request as SupplierRequestWithProducts)
    setSupplierRequestDetailOpen(true)
  }

  return (
    <>
      <div className="space-y-6 print:hidden">
        <QuotationsHeader onNewQuotation={handleNewQuotation} />

        <QuotationStats stats={stats} />

        <QuotationsFilters
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          onExport={handleExport}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab)
            setStatus("all")
          }}
        />

        {activeTab === "clientes" && (
          <>
            <QuotationsTable
              quotations={quotations}
              isLoading={isLoading}
              onViewDetails={handleViewDetails}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onConvert={handleConvert}
              onPrint={handlePrint}
            />

            <QuotationsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </>
        )}

        {activeTab === "proveedores" && (
          <>
            <SupplierRequestsTable
              requests={paginatedSupplierRequests}
              isLoading={isLoadingSupplierRequests}
              onViewDetails={handleViewSupplierRequestDetail}
            />
            <ModulePagination
              currentPage={supplierCurrentPage}
              totalItems={filteredSupplierRequests.length}
              pageSize={pageSize}
              itemLabel="solicitudes"
              onPageChange={setSupplierCurrentPage}
            />
          </>
        )}

        <SupplierRequestDetailsDialog
          open={supplierRequestDetailOpen}
          onOpenChange={setSupplierRequestDetailOpen}
          request={selectedSupplierRequest}
        />

        <QuotationFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          quotation={selectedQuotation}
          sellerUserId={sellerUserId}
          onSuccess={onFormSuccess}
          defaultMode={activeTab === "proveedores" && !selectedQuotation ? "proveedor" : undefined}
        />

        <QuotationDetailsDialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          quotation={selectedQuotation}
          onSupplierRequestSuccess={fetchSupplierRequests}
        />

        <QuotationDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          quotation={quotationToDelete}
          onConfirm={confirmDelete}
        />

        {quotationToConvert && (
          <ConvertQuotationDialog
            open={convertDialogOpen}
            onOpenChange={setConvertDialogOpen}
            quotation={quotationToConvert}
            onSuccess={handleConvertSuccess}
          />
        )}
      </div>

      <PrintPreviewDialog
        open={!!quotationToPrint}
        onClose={handleClosePrintPreview}
        elementId="quotation-to-print"
        onExportPdf={() => quotationToPrint && exportQuotationPDF(quotationToPrint)}
      >
        <PrintQuotation quotation={quotationToPrint!} />
      </PrintPreviewDialog>
    </>
  )
}
