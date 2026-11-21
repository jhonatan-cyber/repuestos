"use client"

import type { ReactNode } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type DataTableColumn<T> = {
  key: string
  header: string
  headerClassName?: string
  cellClassName?: string
  render: (row: T) => ReactNode
}

/**
 * Tabla desktop genérica: shadcn Table + caption/scope accesibles,
 * skeleton en carga y mensaje vacío. El responsive móvil se resuelve
 * con MobileList* junto a este componente (ver categories-table).
 */
export function DataTable<T extends { id?: string | number }>({
  columns = [],
  rows = [],
  isLoading = false,
  emptyMessage = "Sin registros",
  loadingMessage = "Cargando...",
  caption,
  minWidth = "min-w-[820px]",
  loadingContent,
  rowClassName,
  children,
  isEmpty,
}: {
  columns?: DataTableColumn<T>[]
  rows?: T[]
  isLoading?: boolean
  emptyMessage?: string
  loadingMessage?: string
  caption: string
  minWidth?: string
  /** Contenido custom en carga (ej. skeleton rows). Por defecto un mensaje. */
  loadingContent?: ReactNode
  rowClassName?: (row: T) => string | undefined
  /** Escape hatch for complex rows while retaining caption and table semantics. */
  children?: ReactNode
  /** Indica que el contenido complejo no tiene filas y evita montar la tabla. */
  isEmpty?: boolean
}) {
  const hasNoRows = isEmpty ?? (!isLoading && !children && rows.length === 0)

  if (hasNoRows) {
    return (
      <div className="module-empty hidden items-center justify-center md:flex" role="status">
        {emptyMessage}
      </div>
    )
  }

  if (children) {
    return (
      <Table className={minWidth}>
        <caption className="sr-only">{caption}</caption>
        {children}
      </Table>
    )
  }
  return (
    <div className="module-table hidden md:block">
      <div className="overflow-x-auto">
        <Table className={minWidth}>
          <caption className="sr-only">{caption}</caption>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.headerClassName}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? (loadingContent ?? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="py-8 text-center">
                      {loadingMessage}
                    </TableCell>
                  </TableRow>
                ))
              : rows.map((row, rowIndex) => (
                  <TableRow key={row.id ?? rowIndex} className={rowClassName?.(row)}>
                    {columns.map((col) => (
                      <TableCell key={col.key} className={col.cellClassName}>
                        {col.render(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export function DataTableSkeleton({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: columns }).map((_, j) => (
            <TableCell key={j}>
              <div className="h-4 animate-pulse rounded bg-muted" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}
