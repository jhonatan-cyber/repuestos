"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Eye, Package } from "lucide-react"
import { formatDate } from "@/lib/format-utils"
import {
  MobileList,
  MobileListActions,
  MobileListCard,
  MobileListField,
  MobileListGrid,
  MobileListHeader,
  MobileListState,
} from "@/components/ui/mobile-list-card"

interface ProductInfo {
  id: string
  code: string
  name: string
  description: string | null
  image: string | null
  quantity: number
}

interface SupplierRequestRow {
  id: string
  quotationId: string
  supplierId: string
  supplierName: string
  status: string
  sentAt: string
  respondedAt: string | null
  notes: string | null
  response: string | null
  products: ProductInfo[]
  quotation: {
    date: string
    clientName: string
    total: number
    status: string
  }
}

interface SupplierRequestsTableProps {
  requests: SupplierRequestRow[]
  isLoading: boolean
  onViewDetails: (request: SupplierRequestRow) => void
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pendiente: { label: "Pendiente", className: "bg-yellow-100 text-yellow-700" },
  enviado: { label: "Enviado", className: "bg-blue-100 text-blue-700" },
  recibido: { label: "Recibido", className: "bg-purple-100 text-purple-700" },
  respondido: { label: "Respondido", className: "bg-green-100 text-green-700" },
}

export function SupplierRequestsTable({
  requests,
  isLoading,
  onViewDetails,
}: SupplierRequestsTableProps) {
  if (isLoading) {
    return (
      <>
        <MobileListState message="Cargando solicitudes..." />
        <div className="module-table hidden md:block">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cotización</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(6)].map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    )
  }

  if (requests.length === 0) {
    return (
      <div
        className="module-empty flex flex-col items-center justify-center gap-3 text-center"
        role="status"
      >
        <div className="rounded-full bg-muted p-4">
          <Eye className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">Sin solicitudes a proveedores</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Todavía no se enviaron solicitudes de cotización a proveedores. Usá el botón "Nueva
          solicitud" para empezar.
        </p>
      </div>
    )
  }

  return (
    <>
      <MobileList>
        {requests.map((request) => (
          <MobileListCard key={request.id}>
            <MobileListHeader
              title={request.supplierName}
              subtitle={formatDate(request.sentAt)}
              trailing={
                <Badge variant="outline">
                  {statusConfig[request.status]?.label ?? request.status}
                </Badge>
              }
            />
            <MobileListGrid>
              <MobileListField
                label="Productos"
                value={`${request.products.length} ${request.products.length === 1 ? "producto" : "productos"}`}
              />
              <MobileListField
                label="Estado"
                value={statusConfig[request.status]?.label ?? request.status}
              />
              <MobileListField label="Notas" value={request.notes || "—"} className="col-span-2" />
            </MobileListGrid>
            <MobileListActions>
              <Button variant="outline" size="sm" onClick={() => onViewDetails(request)}>
                <Eye className="mr-1 h-4 w-4" /> Ver detalle
              </Button>
            </MobileListActions>
          </MobileListCard>
        ))}
      </MobileList>
      <div className="module-table hidden md:block">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-[120px]">Fecha</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Notas</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((req) => (
              <TableRow key={req.id} className="transition-colors hover:bg-muted/20">
                <TableCell className="font-medium text-slate-600 dark:text-slate-400">
                  {formatDate(req.sentAt)}
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {req.supplierName}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {req.products.length} {req.products.length === 1 ? "producto" : "productos"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig[req.status]?.className ?? "bg-gray-100 text-gray-700"}`}
                  >
                    {statusConfig[req.status]?.label ?? req.status}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="max-w-[200px] truncate block text-sm text-muted-foreground">
                    {req.notes || "—"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onViewDetails(req)}
                          className="h-8 w-8 rounded-full text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ver detalle</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
