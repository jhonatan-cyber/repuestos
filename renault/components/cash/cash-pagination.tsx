"use client"

import { ModulePagination } from "@/components/ui/module-pagination"

interface CashPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function CashPagination(props: CashPaginationProps) {
  return <ModulePagination {...props} itemLabel="cajas" />
}
