"use client"

import { ModulePagination } from "@/components/ui/module-pagination"

interface InventoryPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function InventoryPagination(props: InventoryPaginationProps) {
  return <ModulePagination {...props} itemLabel="productos" />
}
