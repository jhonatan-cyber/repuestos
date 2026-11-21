"use client"

import { CashCards } from "@/components/cash/cash-cards"
import { CashCloseDialog } from "@/components/cash/cash-close-dialog"
import { CashDetailsDialog } from "@/components/cash/cash-details-dialog"
import { CashFilters } from "@/components/cash/cash-filters"
import { CashHeader } from "@/components/cash/cash-header"
import { CashOpenDialog } from "@/components/cash/cash-open-dialog"
import { CashPagination } from "@/components/cash/cash-pagination"
import { CashStats } from "@/components/cash/cash-stats"
import { CashWithdrawDialog } from "@/components/cash/cash-withdraw-dialog"
import { useCashRecords } from "@/hooks/use-cash-records"

export default function CashPage() {
  const {
    records,
    openRecord,
    latestClosed,
    stats,
    isLoading,
    isSubmitting,
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
    openCashDialog,
    setOpenCashDialog,
    withdrawDialog,
    setWithdrawDialog,
    closeDialog,
    setCloseDialog,
    detailsDialog,
    setDetailsDialog,
    selectedRecord,
    openForm,
    setOpenForm,
    withdrawForm,
    setWithdrawForm,
    closeForm,
    setCloseForm,
    closeSummary,
    openingBalanceValue,
    canSubmitOpenCash,
    user,
    handleOpenCashDialog,
    submitOpenCash,
    handleOpenWithdrawDialog,
    submitWithdraw,
    handleOpenCloseDialog,
    submitCloseCash,
    handleOpenDetails,
  } = useCashRecords()

  return (
    <div className="space-y-6">
      <CashHeader hasOpenCash={!!openRecord} onOpenCash={handleOpenCashDialog} />

      <CashStats stats={stats} />

      <CashFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      <CashCards
        records={records}
        isLoading={isLoading}
        search={search}
        onViewDetails={handleOpenDetails}
        onWithdraw={handleOpenWithdrawDialog}
        onClose={handleOpenCloseDialog}
      />

      <CashPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      <CashOpenDialog
        open={openCashDialog}
        onOpenChange={setOpenCashDialog}
        isSubmitting={isSubmitting}
        canSubmit={canSubmitOpenCash}
        latestClosed={latestClosed}
        userLabel={user?.name || user?.email || "Usuario actual"}
        openingBalanceValue={openingBalanceValue}
        form={openForm}
        onFormChange={setOpenForm}
        onSubmit={submitOpenCash}
      />

      <CashWithdrawDialog
        open={withdrawDialog}
        onOpenChange={setWithdrawDialog}
        isSubmitting={isSubmitting}
        form={withdrawForm}
        onFormChange={setWithdrawForm}
        onSubmit={submitWithdraw}
      />

      <CashCloseDialog
        open={closeDialog}
        onOpenChange={setCloseDialog}
        isSubmitting={isSubmitting}
        selectedRecord={selectedRecord}
        closeSummary={closeSummary}
        form={closeForm}
        onFormChange={setCloseForm}
        onSubmit={submitCloseCash}
      />

      <CashDetailsDialog
        open={detailsDialog}
        onOpenChange={setDetailsDialog}
        record={selectedRecord}
      />
    </div>
  )
}
