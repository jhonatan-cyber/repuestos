"use client"

import { ModulePagination } from "@/components/ui/module-pagination"

interface PurchasesPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function PurchasesPagination(props: PurchasesPaginationProps) {
  return <ModulePagination {...props} itemLabel="compras" />
}
