"use client"

import { ModulePagination } from "@/components/ui/module-pagination"

interface RolesPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function RolesPagination(props: RolesPaginationProps) {
  return <ModulePagination {...props} itemLabel="roles" />
}
