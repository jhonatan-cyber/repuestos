"use client"

import { ModulePagination } from "@/components/ui/module-pagination"

interface ProductsPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function ProductsPagination(props: ProductsPaginationProps) {
  return <ModulePagination {...props} itemLabel="productos" />
}
