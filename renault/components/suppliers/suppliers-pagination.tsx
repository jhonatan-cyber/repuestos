"use client"

import { ModulePagination } from "@/components/ui/module-pagination"

interface SuppliersPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function SuppliersPagination(props: SuppliersPaginationProps) {
  return <ModulePagination {...props} itemLabel="proveedores" />
}
