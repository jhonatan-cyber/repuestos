"use client"

import { ModulePagination } from "@/components/ui/module-pagination"

interface QuotationsPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function QuotationsPagination(props: QuotationsPaginationProps) {
  return <ModulePagination {...props} itemLabel="cotizaciones" />
}
