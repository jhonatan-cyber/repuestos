"use client"

import { ModulePagination } from "@/components/ui/module-pagination"

interface SalesPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function SalesPagination(props: SalesPaginationProps) {
  return <ModulePagination {...props} itemLabel="ventas" />
}
