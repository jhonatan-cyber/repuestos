"use client"

import {
  MobileList,
  MobileListActions,
  MobileListCard,
  MobileListField,
  MobileListGrid,
  MobileListHeader,
  MobileListState,
} from "@/components/ui/mobile-list-card"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { formatCurrency } from "@/lib/format-utils"
import type { Client } from "@/lib/types"
import { ClientActionButtons } from "./client-action-buttons"
import { ClientStatusBadge } from "./client-status-badge"

interface ClientsTableProps {
  clients: Client[]
  isLoading: boolean
  search: string
  onEdit: (client: Client) => void
  onDelete: (client: Client) => void
  onToggleStatus: (client: Client) => void
}

export function ClientsTable({
  clients,
  isLoading,
  search,
  onEdit,
  onDelete,
  onToggleStatus,
}: ClientsTableProps) {
  const emptyMessage = search ? "No se encontraron clientes" : "No hay clientes registrados"
  const columns: DataTableColumn<Client>[] = [
    {
      key: "name",
      header: "Nombre",
      cellClassName: "font-medium",
      render: (client) => client.name,
    },
    { key: "phone", header: "Teléfono", render: (client) => client.phone },
    {
      key: "status",
      header: "Estado",
      render: (client) => <ClientStatusBadge status={client.status} />,
    },
    {
      key: "total",
      header: "Total Compras",
      headerClassName: "text-right",
      cellClassName: "text-right font-semibold",
      render: (client) => formatCurrency(client.totalPurchases || 0),
    },
    {
      key: "actions",
      header: "Acciones",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (client) => (
        <ClientActionButtons
          client={client}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleStatus={onToggleStatus}
        />
      ),
    },
  ]

  return (
    <>
      {isLoading ? <MobileListState message="Cargando clientes..." /> : null}
      {!isLoading && clients.length === 0 ? <MobileListState message={emptyMessage} /> : null}
      {!isLoading && clients.length > 0 ? (
        <MobileList>
          {clients.map((client) => (
            <MobileListCard
              key={client.id}
              className={client.status === "inactive" ? "opacity-70" : undefined}
            >
              <MobileListHeader
                title={client.name}
                subtitle={client.phone}
                trailing={<ClientStatusBadge status={client.status} />}
              />
              <MobileListGrid>
                <MobileListField label="Teléfono" value={client.phone || "-"} />
                <MobileListField
                  label="Total compras"
                  value={
                    <span className="text-base font-bold">
                      {formatCurrency(client.totalPurchases || 0)}
                    </span>
                  }
                  className="col-span-2"
                />
              </MobileListGrid>
              <MobileListActions>
                <ClientActionButtons
                  client={client}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleStatus={onToggleStatus}
                />
              </MobileListActions>
            </MobileListCard>
          ))}
        </MobileList>
      ) : null}

      <DataTable
        caption="Listado de clientes"
        columns={columns}
        rows={clients}
        isLoading={isLoading}
        emptyMessage={emptyMessage}
        minWidth="min-w-[920px]"
        rowClassName={(client) => (client.status === "inactive" ? "opacity-60" : undefined)}
      />
    </>
  )
}
