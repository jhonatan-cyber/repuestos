"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface ModulePaginationProps {
  currentPage: number
  totalItems: number
  pageSize: number
  itemLabel: string
  onPageChange: (page: number) => void
  totalPages?: number
}

export function ModulePagination({
  currentPage,
  totalItems,
  pageSize,
  itemLabel,
  onPageChange,
  totalPages: suppliedTotalPages,
}: ModulePaginationProps) {
  if (totalItems === 0) return null
  const totalPages = suppliedTotalPages ?? Math.max(1, Math.ceil(totalItems / pageSize))
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)
  if (totalPages <= 1) return null

  const visiblePages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (page) => {
      const distance = Math.abs(page - currentPage)
      return distance <= 1 || page === 1 || page === totalPages
    },
  )

  return (
    <div className="module-pagination flex flex-col items-center justify-between gap-4 py-4 sm:flex-row">
      <div className="text-sm text-muted-foreground">
        Mostrando {startItem} a {endItem} de {totalItems} {itemLabel}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <div className="flex items-center space-x-1">
          {visiblePages.map((page, index) => {
            const previousPage = visiblePages[index - 1]
            return (
              <div key={page} className="flex items-center">
                {previousPage && page - previousPage > 1 ? (
                  <span className="px-2 text-muted-foreground">...</span>
                ) : null}
                <Button
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page)}
                  className="h-8 w-8 p-0"
                >
                  {page}
                </Button>
              </div>
            )
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
