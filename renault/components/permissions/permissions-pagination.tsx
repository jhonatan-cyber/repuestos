"use client"

import { ModulePagination } from "@/components/ui/module-pagination"

interface PermissionsPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function PermissionsPagination(props: PermissionsPaginationProps) {
  return <ModulePagination {...props} itemLabel="permisos" />
}
