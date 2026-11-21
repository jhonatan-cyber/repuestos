"use client"

import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import {
  MobileList,
  MobileListActions,
  MobileListCard,
  MobileListField,
  MobileListGrid,
  MobileListHeader,
  MobileListState,
} from "@/components/ui/mobile-list-card"
import { formatCurrency } from "@/lib/format-utils"

export interface CreditAccountListRow<T> {
  id: string
  partyName: string
  reference: string
  total: number
  balance: number
  overdue: boolean
  record: T
}

function StatusBadge({ row }: { row: CreditAccountListRow<unknown> }) {
  return (
    <Badge variant={row.balance <= 0 ? "secondary" : row.overdue ? "destructive" : "outline"}>
      {row.balance <= 0 ? "Pagado" : row.overdue ? "Vencido" : "Pendiente"}
    </Badge>
  )
}

export function CreditAccountsList<T>({
  rows,
  isLoading,
  partyLabel,
  referenceLabel,
  emptyMessage,
  caption,
  renderActions,
  mobileOnly = false,
}: {
  rows: CreditAccountListRow<T>[]
  isLoading: boolean
  partyLabel: string
  referenceLabel: string
  emptyMessage: string
  caption: string
  renderActions: (row: CreditAccountListRow<T>) => ReactNode
  mobileOnly?: boolean
}) {
  const columns: DataTableColumn<CreditAccountListRow<T>>[] = [
    {
      key: "party",
      header: partyLabel,
      cellClassName: "font-medium",
      render: (row) => row.partyName,
    },
    { key: "reference", header: referenceLabel, render: (row) => row.reference },
    {
      key: "total",
      header: "Total",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (row) => formatCurrency(row.total),
    },
    {
      key: "balance",
      header: "Saldo",
      headerClassName: "text-right",
      cellClassName: "text-right font-semibold",
      render: (row) => formatCurrency(row.balance),
    },
    { key: "status", header: "Estado", render: (row) => <StatusBadge row={row} /> },
    {
      key: "actions",
      header: "Acciones",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: renderActions,
    },
  ]

  return (
    <>
      {isLoading ? <MobileListState message="Cargando cuentas..." /> : null}
      {!isLoading && rows.length === 0 ? <MobileListState message={emptyMessage} /> : null}
      {!isLoading && rows.length > 0 ? (
        <MobileList>
          {rows.map((row) => (
            <MobileListCard key={row.id}>
              <MobileListHeader
                title={row.partyName}
                subtitle={`${referenceLabel}: ${row.reference}`}
                trailing={<StatusBadge row={row} />}
              />
              <MobileListGrid>
                <MobileListField label="Total" value={formatCurrency(row.total)} />
                <MobileListField
                  label="Saldo"
                  value={<span className="text-base font-bold">{formatCurrency(row.balance)}</span>}
                />
              </MobileListGrid>
              <MobileListActions>{renderActions(row)}</MobileListActions>
            </MobileListCard>
          ))}
        </MobileList>
      ) : null}
      {!mobileOnly ? (
        <DataTable
          caption={caption}
          columns={columns}
          rows={rows}
          isLoading={isLoading}
          emptyMessage={emptyMessage}
          minWidth="min-w-[920px]"
        />
      ) : null}
    </>
  )
}
