"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataTable } from "@/components/data-table"
import { formatCurrency, formatDate } from "@/lib/format-utils"
import type { Sale } from "@/lib/types"
import { Ban, Eye, MoreHorizontal, Pencil, Printer } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  crédito: "Crédito",
  credito: "Crédito",
  qr: "QR",
  mixto: "Mixto",
}

const SALE_TYPE_LABELS: Record<string, string> = {
  contado: "Al contado",
  credito: "A crédito",
}

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive"> = {
  completada: "default",
  pendiente: "secondary",
  cancelada: "destructive",
}

// ===== Loading Skeleton =====
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-lg border bg-card p-4 animate-pulse"
        >
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="h-4 w-28 rounded bg-muted" />
          <div className="ml-auto h-4 w-20 rounded bg-muted" />
          <div className="h-4 w-16 rounded bg-muted" />
          <div className="h-4 w-20 rounded bg-muted" />
          <div className="h-5 w-16 rounded-full bg-muted" />
          <div className="h-8 w-24 rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}

// ===== Empty State =====
function EmptyState({ message, onNewSale }: { message: string; onNewSale?: () => void }) {
  return (
    <div
      className="module-empty flex flex-col items-center justify-center text-center"
      role="status"
    >
      <div className="rounded-full bg-muted p-6 mb-4">
        <svg
          className="h-12 w-12 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 3h1.386c.51 0 .955.343 1.174.662l.76 1.69a.5.5 0 00.497.636l1.595.3c.555.082 1.082.385 1.396.978l.07.142c.324.654.884 1.106 1.53 1.33l.07.02c.634.143.995.58 1.119 1.11l.025.064.017.084a2.5 2.5 0 00-.017 1.03l-.025.064-.017.084c-.124.53-.485.967-1.119 1.11l-.07.02c-.646.224-1.206.676-1.53 1.33l-.07.142c-.314.593-.841 1.896-1.396.978l-1.595.3a.5.5 0 00-.497.636l-.76 1.69a1.75 1.75 0 01-1.174.662H2.25"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">Sin ventas registradas</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">{message}</p>
      {onNewSale && (
        <Button onClick={onNewSale} className="rounded-full gap-2">
          <Printer className="h-4 w-4" />
          Registrar primera venta
        </Button>
      )}
    </div>
  )
}

// ===== Row Styling =====
function getRowClasses(sale: Sale): string {
  if (sale.status === "cancelada") {
    return "bg-red-50/50 dark:bg-red-950/20 opacity-75"
  }
  return ""
}

function getClientCell(
  sale: Sale,
  onViewClientHistory?: (clientId: string, clientName: string) => void,
) {
  if (!sale.clientId) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help text-muted-foreground text-sm">
            {sale.clientName || "—"}
          </span>
        </TooltipTrigger>
        <TooltipContent>Cliente no registrado</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="cursor-pointer text-primary hover:underline text-sm text-left font-medium"
          onClick={() => onViewClientHistory?.(String(sale.clientId), sale.clientName || "Cliente")}
        >
          {sale.clientName}
        </button>
      </TooltipTrigger>
      <TooltipContent>Ver historial de compras</TooltipContent>
    </Tooltip>
  )
}

// ===== Main Component =====
interface SalesTableProps {
  sales: Sale[]
  isLoading: boolean
  search: string
  onViewDetails: (sale: Sale) => void
  onPrint: (sale: Sale) => void
  onEdit: (sale: Sale) => void
  onCancel: (sale: Sale) => void
  onViewClientHistory?: (clientId: string, clientName: string) => void
  onNewSale?: () => void
}

export function SalesTable({
  sales,
  isLoading,
  search,
  onViewDetails,
  onPrint,
  onEdit,
  onCancel,
  onViewClientHistory,
  onNewSale,
}: SalesTableProps) {
  const emptyMessage = search
    ? "No se encontraron ventas con esos filtros"
    : "Aún no hay ventas registradas. Empezá registrando tu primera venta."

  if (isLoading) return <TableSkeleton />
  if (sales.length === 0) return <EmptyState message={emptyMessage} onNewSale={onNewSale} />

  return (
    <div className="space-y-4">
      {/* Mobile cards view */}
      <div className="grid gap-4 md:hidden">
        {sales.map((sale) => (
          <div
            key={sale.id}
            className={`rounded-xl border bg-card p-4 shadow-sm ${sale.status === "cancelada" ? "border-red-200 bg-red-50/30 dark:border-red-900/30 dark:bg-red-950/10" : ""}`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="font-medium text-sm">{sale.clientName || "Cliente no registrado"}</p>
                <p className="text-xs text-muted-foreground">{formatDate(sale.date)}</p>
              </div>
              <Badge variant={STATUS_COLORS[sale.status] || "default"}>
                {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <span className="text-muted-foreground">Vendedor</span>
              <span className="font-medium">{sale.sellerName}</span>
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold">{formatCurrency(sale.total)}</span>
              <span className="text-muted-foreground">Tipo</span>
              <Badge variant="secondary" className="w-fit text-xs">
                {SALE_TYPE_LABELS[sale.saleType || "contado"] || "Al contado"}
              </Badge>
              <span className="text-muted-foreground">Método</span>
              <Badge variant="outline" className="w-fit text-xs">
                {PAYMENT_METHOD_LABELS[sale.paymentMethod] || sale.paymentMethod}
              </Badge>
            </div>
            {sale.status === "cancelada" && (
              <p className="text-xs text-red-600 font-medium mb-2">Venta anulada</p>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onViewDetails(sale)}
                className="flex-1 text-xs"
              >
                <Eye className="h-3 w-3 mr-1" /> Ver
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onPrint(sale)}
                className="flex-1 text-xs"
              >
                <Printer className="h-3 w-3 mr-1" /> Imprimir
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(sale)}
                disabled={sale.status === "cancelada"}
                className="flex-1 text-xs"
              >
                <Pencil className="h-3 w-3 mr-1" /> Editar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onCancel(sale)}
                disabled={sale.status === "cancelada"}
                className="flex-1 text-xs text-red-600"
              >
                <Ban className="h-3 w-3 mr-1" /> Anular
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="module-table hidden md:block">
        <div className="overflow-x-auto">
          <DataTable caption="Listado de ventas" minWidth="min-w-[1080px]">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-[120px] whitespace-nowrap">Fecha</TableHead>
                <TableHead className="min-w-[220px]">Cliente</TableHead>
                <TableHead className="w-[120px] whitespace-nowrap text-right">Subtotal</TableHead>
                <TableHead className="w-[110px] whitespace-nowrap text-right">Descuento</TableHead>
                <TableHead className="w-[130px] whitespace-nowrap text-right">Total</TableHead>
                <TableHead className="w-[130px] whitespace-nowrap">Tipo</TableHead>
                <TableHead className="w-[120px] whitespace-nowrap">Método</TableHead>
                <TableHead className="w-[120px] whitespace-nowrap">Estado</TableHead>
                <TableHead className="w-[90px] whitespace-nowrap text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id} className={getRowClasses(sale)}>
                  <TableCell className="whitespace-nowrap py-3 font-mono text-sm">
                    {formatDate(sale.date)}
                  </TableCell>
                  <TableCell className="py-3">{getClientCell(sale, onViewClientHistory)}</TableCell>
                  <TableCell className="whitespace-nowrap py-3 text-right text-sm">
                    {formatCurrency(sale.subtotal)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap py-3 text-right text-sm text-orange-600">
                    {sale.discount > 0 ? `-${formatCurrency(sale.discount)}` : "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap py-3 text-right font-semibold">
                    {formatCurrency(sale.total)}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="secondary" className="whitespace-nowrap text-xs">
                      {SALE_TYPE_LABELS[sale.saleType || "contado"] || "Al contado"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className="whitespace-nowrap text-xs">
                      {PAYMENT_METHOD_LABELS[sale.paymentMethod] || sale.paymentMethod}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge
                      variant={STATUS_COLORS[sale.status] || "default"}
                      className="whitespace-nowrap text-xs"
                    >
                      {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onViewDetails(sale)}
                          className="text-indigo-600 focus:text-indigo-700"
                        >
                          <Eye className="mr-2 h-4 w-4 text-indigo-600" /> Ver detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onPrint(sale)}
                          className="text-violet-600 focus:text-violet-700"
                        >
                          <Printer className="mr-2 h-4 w-4 text-violet-600" /> Imprimir recibo
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onEdit(sale)}
                          disabled={sale.status === "cancelada"}
                          className="text-blue-600 focus:text-blue-700"
                        >
                          <Pencil className="mr-2 h-4 w-4 text-blue-600" /> Editar venta
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onCancel(sale)}
                          disabled={sale.status === "cancelada"}
                          className="text-red-600 focus:text-red-700"
                        >
                          <Ban className="mr-2 h-4 w-4 text-red-600" />{" "}
                          {sale.status === "cancelada" ? "Ya anulada" : "Anular venta"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
        </div>
      </div>
    </div>
  )
}
