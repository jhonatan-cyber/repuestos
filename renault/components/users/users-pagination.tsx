"use client"

import { ModulePagination } from "@/components/ui/module-pagination"

interface UsersPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function UsersPagination(props: UsersPaginationProps) {
  return <ModulePagination {...props} itemLabel="usuarios" />
}
