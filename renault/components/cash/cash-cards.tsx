"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { formatCurrency, formatDate } from "@/lib/format-utils"
import type { CashRecord } from "@/lib/types"
import { Eye, Lock, TrendingDown } from "lucide-react"

interface CashCardsProps {
  records: CashRecord[]
  isLoading: boolean
  search: string
  onViewDetails: (record: CashRecord) => void
  onWithdraw: (record: CashRecord) => void
  onClose: (record: CashRecord) => void
}

export function CashCards({
  records,
  isLoading,
  search,
  onViewDetails,
  onWithdraw,
  onClose,
}: CashCardsProps) {
  const emptyMessage = search ? "No se encontraron cajas" : "No hay cajas registradas"
  const renderActions = (record: CashRecord) => (
    <div className="flex flex-wrap justify-end gap-2">
      <Button variant="outline" size="sm" onClick={() => onViewDetails(record)}>
        <Eye className="mr-1 h-4 w-4" /> Detalles
      </Button>
      {record.status === "open" ? (
        <>
          <Button variant="outline" size="sm" onClick={() => onWithdraw(record)}>
            <TrendingDown className="mr-1 h-4 w-4" /> Retiro
          </Button>
          <Button size="sm" onClick={() => onClose(record)}>
            <Lock className="mr-1 h-4 w-4" /> Cerrar
          </Button>
        </>
      ) : null}
    </div>
  )
  const columns: DataTableColumn<CashRecord>[] = [
    {
      key: "date",
      header: "Fecha",
      cellClassName: "font-medium",
      render: (record) => formatDate(record.date),
    },
    { key: "responsible", header: "Responsable", render: (record) => record.userName || "-" },
    {
      key: "opening",
      header: "Saldo inicial",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (record) => formatCurrency(record.openingBalance),
    },
    {
      key: "income",
      header: "Ingresos",
      headerClassName: "text-right",
      cellClassName: "text-right text-green-600",
      render: (record) => formatCurrency(record.cashIncome),
    },
    {
      key: "expenses",
      header: "Egresos",
      headerClassName: "text-right",
      cellClassName: "text-right text-red-600",
      render: (record) => formatCurrency(record.cashExpenses),
    },
    {
      key: "balance",
      header: "Saldo",
      headerClassName: "text-right",
      cellClassName: "text-right font-semibold",
      render: (record) => formatCurrency(record.closingBalance),
    },
    {
      key: "status",
      header: "Estado",
      render: (record) => (
        <Badge variant={record.status === "open" ? "default" : "secondary"}>
          {record.status === "open" ? "Abierta" : "Cerrada"}
        </Badge>
      ),
    },
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
      {isLoading ? <MobileListState message="Cargando cajas..." /> : null}
      {!isLoading && records.length === 0 ? <MobileListState message={emptyMessage} /> : null}
      {!isLoading && records.length > 0 ? (
        <MobileList>
          {records.map((record) => (
            <MobileListCard
              key={String(record.id)}
              className={record.status === "open" ? "border-emerald-500/50" : undefined}
            >
              <MobileListHeader
                title={`Caja ${formatDate(record.date)}`}
                subtitle={record.userName || "Sin responsable"}
                trailing={
                  <Badge variant={record.status === "open" ? "default" : "secondary"}>
                    {record.status === "open" ? "Abierta" : "Cerrada"}
                  </Badge>
                }
              />
              <MobileListGrid>
                <MobileListField
                  label="Saldo inicial"
                  value={formatCurrency(record.openingBalance)}
                />
                <MobileListField
                  label="Saldo"
                  value={
                    <span className="text-base font-bold">
                      {formatCurrency(record.closingBalance)}
                    </span>
                  }
                />
                <MobileListField
                  label="Ingresos"
                  value={
                    <span className="text-green-600">{formatCurrency(record.cashIncome)}</span>
                  }
                />
                <MobileListField
                  label="Egresos"
                  value={
                    <span className="text-red-600">{formatCurrency(record.cashExpenses)}</span>
                  }
                />
              </MobileListGrid>
              <MobileListActions>{renderActions(record)}</MobileListActions>
            </MobileListCard>
          ))}
        </MobileList>
      ) : null}
      <DataTable
        caption="Historial de cajas"
        columns={columns}
        rows={records}
        isLoading={isLoading}
        emptyMessage={emptyMessage}
        minWidth="min-w-[1040px]"
      />
    </>
  )
}
