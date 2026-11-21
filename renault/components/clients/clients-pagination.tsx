"use client"

import { ModulePagination } from "@/components/ui/module-pagination"

interface ClientsPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function ClientsPagination(props: ClientsPaginationProps) {
  return <ModulePagination {...props} itemLabel="clientes" />
}
