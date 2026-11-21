"use client"

import { Eye, Printer } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  MobileList,
  MobileListActions,
  MobileListCard,
  MobileListField,
  MobileListGrid,
  MobileListHeader,
  MobileListState,
} from "@/components/ui/mobile-list-card"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataTable } from "@/components/data-table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatCurrency, formatDate } from "@/lib/format-utils"
import type { Purchase } from "@/lib/types"

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive"> = {
  recibida: "default",
  pendiente: "secondary",
  cancelada: "destructive",
}

function paymentMethodLabel(method?: string): string {
  const key = String(method || "").toLowerCase()
  if (key === "transferencia") return "Transferencia"
  if (key === "qr") return "QR"
  return "Efectivo"
}

interface PurchasesTableProps {
  purchases: Purchase[]
  isLoading: boolean
  search: string
  onViewDetails: (purchase: Purchase) => void
  onPrint: (purchase: Purchase) => void
}

export function PurchasesTable({
  purchases,
  isLoading,
  search,
  onViewDetails,
  onPrint,
}: PurchasesTableProps) {
  const emptyMessage = search
    ? "No se encontraron compras para la búsqueda actual"
    : "No hay compras registradas"

  return (
    <>
      {isLoading ? <MobileListState message="Cargando compras..." /> : null}
      {!isLoading && purchases.length === 0 ? <MobileListState message={emptyMessage} /> : null}
      {!isLoading && purchases.length > 0 ? (
        <MobileList>
          {purchases.map((purchase) => (
            <MobileListCard key={purchase.id}>
              {(() => {
                const p = purchase as Purchase & {
                  purchaseType?: "contado" | "credito"
                  initialPayment?: number
                  debtAmount?: number
                }
                const isCredit = p.purchaseType === "credito" || Number(p.debtAmount || 0) > 0
                return (
                  <MobileListHeader
                    title={purchase.supplierName}
                    subtitle={formatDate(purchase.date)}
                    trailing={
                      <Badge variant={STATUS_COLORS[purchase.status] || "default"}>
                        {purchase.status}
                      </Badge>
                    }
                  />
                )
              })()}
              <MobileListGrid>
                <MobileListField
                  label="Tipo compra"
                  value={
                    (purchase as Purchase & { purchaseType?: string; debtAmount?: number })
                      .purchaseType === "credito" ||
                    Number((purchase as Purchase & { debtAmount?: number }).debtAmount || 0) > 0
                      ? "A crédito"
                      : "Al contado"
                  }
                />
                <MobileListField
                  label="Método pago"
                  value={paymentMethodLabel(purchase.paymentMethod)}
                />
                <MobileListField
                  label="Inicial pagado"
                  value={formatCurrency(
                    Number(
                      (purchase as Purchase & { initialPayment?: number }).initialPayment || 0,
                    ),
                  )}
                />
                <MobileListField
                  label="Saldo restante"
                  value={formatCurrency(
                    Number((purchase as Purchase & { debtAmount?: number }).debtAmount || 0),
                  )}
                />
                <MobileListField
                  label="Total"
                  value={
                    <span className="text-base font-bold">{formatCurrency(purchase.total)}</span>
                  }
                />
              </MobileListGrid>
              <MobileListActions>
                <Button size="sm" variant="outline" onClick={() => onViewDetails(purchase)}>
                  <Eye className="mr-2 h-4 w-4" /> Ver detalle
                </Button>
                <Button size="sm" variant="outline" onClick={() => onPrint(purchase)}>
                  <Printer className="mr-2 h-4 w-4" /> Imprimir
                </Button>
              </MobileListActions>
            </MobileListCard>
          ))}
        </MobileList>
      ) : null}

      <div className="module-table hidden md:block">
        <div className="overflow-x-auto">
          <DataTable
            caption="Listado de compras"
            minWidth="min-w-[920px]"
            isEmpty={!isLoading && purchases.length === 0}
            emptyMessage={emptyMessage}
          >
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[100px]">Fecha</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Tipo compra</TableHead>
                <TableHead>Método pago</TableHead>
                <TableHead className="text-right">Inicial pagado</TableHead>
                <TableHead className="text-right">Saldo restante</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : purchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-48 text-center text-muted-foreground">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                purchases.map((purchase) => (
                  <TableRow key={purchase.id} className="transition-colors hover:bg-muted/20">
                    {(() => {
                      const p = purchase as Purchase & {
                        purchaseType?: "contado" | "credito"
                        initialPayment?: number
                        debtAmount?: number
                      }
                      const isCredit = p.purchaseType === "credito" || Number(p.debtAmount || 0) > 0
                      return (
                        <>
                          <TableCell className="font-mono text-sm text-slate-600 dark:text-slate-400">
                            {formatDate(purchase.date)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {purchase.supplierName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{isCredit ? "A crédito" : "Al contado"}</TableCell>
                          <TableCell>{paymentMethodLabel(purchase.paymentMethod)}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(Number(p.initialPayment || 0))}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(Number(p.debtAmount || 0))}
                          </TableCell>
                          <TableCell className="text-right font-bold text-slate-900 dark:text-slate-100">
                            {formatCurrency(purchase.total)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={STATUS_COLORS[purchase.status] || "default"}>
                              {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <TooltipProvider>
                              <div className="flex justify-end gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => onViewDetails(purchase)}
                                      className="h-8 w-8 rounded-full text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Ver detalles</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => onPrint(purchase)}
                                      className="h-8 w-8 rounded-full text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                                    >
                                      <Printer className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Imprimir comprobante</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TooltipProvider>
                          </TableCell>
                        </>
                      )
                    })()}
                  </TableRow>
                ))
              )}
            </TableBody>
          </DataTable>
        </div>
      </div>
    </>
  )
}
