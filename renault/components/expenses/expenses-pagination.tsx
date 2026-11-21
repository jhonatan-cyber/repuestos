"use client"

import { ModulePagination } from "@/components/ui/module-pagination"

interface ExpensesPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function ExpensesPagination(props: ExpensesPaginationProps) {
  return <ModulePagination {...props} itemLabel="gastos" />
}
