"use client"

import { ModulePagination } from "@/components/ui/module-pagination"

interface CategoriesPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function CategoriesPagination(props: CategoriesPaginationProps) {
  return <ModulePagination {...props} itemLabel="categorías" />
}
