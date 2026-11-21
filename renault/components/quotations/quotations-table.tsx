"use client"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import {
  MobileList,
  MobileListActions,
  MobileListCard,
  MobileListField,
  MobileListGrid,
  MobileListHeader,
  MobileListState,
} from "@/components/ui/mobile-list-card"
import { Skeleton } from "@/components/ui/skeleton"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatCurrency, formatDate } from "@/lib/format-utils"
import type { Quotation } from "@/lib/types"
import { ArrowRight, Edit, Eye, Trash2, Printer } from "lucide-react"
import { QuotationStatusBadge } from "./quotation-status-badge"

interface QuotationsTableProps {
  quotations: Quotation[]
  isLoading: boolean
  onViewDetails: (quotation: Quotation) => void
  onEdit: (quotation: Quotation) => void
  onDelete: (quotation: Quotation) => void
  onConvert: (quotation: Quotation) => void
  onPrint: (quotation: Quotation) => void
}

export function QuotationsTable({
  quotations,
  isLoading,
  onViewDetails,
  onEdit,
  onDelete,
  onConvert,
  onPrint,
}: QuotationsTableProps) {
  if (isLoading) {
    return (
      <>
        <MobileListState message="Cargando cotizaciones..." />
        <div className="module-table hidden md:block">
          <DataTable caption="Cotizaciones en carga" minWidth="w-full">
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[120px]">Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-8 w-24" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
        </div>
      </>
    )
  }

  return (
    <>
      {quotations.length === 0 ? (
        <MobileListState message="No se encontraron cotizaciones" />
      ) : null}
      {quotations.length > 0 ? (
        <MobileList>
          {quotations.map((quotation) => {
            const isExpired = new Date(quotation.validUntil) < new Date(new Date().toDateString())
            const displayStatus =
              isExpired && quotation.status === "pendiente" ? "vencida" : quotation.status

            return (
              <MobileListCard key={quotation.id}>
                <MobileListHeader
                  title={quotation.clientName}
                  subtitle={formatDate(quotation.date)}
                  trailing={<QuotationStatusBadge status={displayStatus} />}
                />
                <MobileListGrid>
                  <MobileListField label="Vendedor" value={quotation.sellerName} />
                  <MobileListField
                    label="Válida hasta"
                    value={
                      <span
                        className={
                          isExpired && quotation.status === "pendiente"
                            ? "font-medium text-amber-600"
                            : undefined
                        }
                      >
                        {formatDate(quotation.validUntil)}
                      </span>
                    }
                  />
                  <MobileListField
                    label="Total"
                    value={
                      <span className="text-base font-bold">{formatCurrency(quotation.total)}</span>
                    }
                  />
                </MobileListGrid>
                <MobileListActions>
                  <Button variant="outline" size="sm" onClick={() => onViewDetails(quotation)}>
                    <Eye className="mr-2 h-4 w-4" /> Ver
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onPrint(quotation)}>
                    <Printer className="mr-2 h-4 w-4" /> Imprimir
                  </Button>
                  {quotation.status === "pendiente" ? (
                    <Button variant="outline" size="sm" onClick={() => onEdit(quotation)}>
                      <Edit className="mr-2 h-4 w-4" /> Editar
                    </Button>
                  ) : null}
                  <Button variant="outline" size="sm" onClick={() => onDelete(quotation)}>
                    <Trash2 className="mr-2 h-4 w-4 text-rose-600" /> Eliminar
                  </Button>
                  {quotation.status === "pendiente" || quotation.status === "aprobada" ? (
                    <Button variant="outline" size="sm" onClick={() => onConvert(quotation)}>
                      <ArrowRight className="mr-2 h-4 w-4 text-green-600" />{" "}
                      {quotation.status === "pendiente" ? "Aprobar" : "Convertir"}
                    </Button>
                  ) : null}
                </MobileListActions>
              </MobileListCard>
            )
          })}
        </MobileList>
      ) : null}

      <div className="module-table hidden transition-all duration-300 md:block">
        <div className="overflow-x-auto">
          <DataTable
            caption="Listado de cotizaciones"
            minWidth="min-w-[980px]"
            isEmpty={quotations.length === 0}
            emptyMessage="No se encontraron cotizaciones"
          >
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[120px]">Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Vendedor</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Válida hasta</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                    No se encontraron cotizaciones
                  </TableCell>
                </TableRow>
              ) : (
                quotations.map((quotation) => (
                  <TableRow key={quotation.id} className="transition-colors hover:bg-muted/20">
                    <TableCell className="font-medium text-slate-600 dark:text-slate-400">
                      {formatDate(quotation.date)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {quotation.clientName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {quotation.sellerName}
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(quotation.total)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          new Date(quotation.validUntil) < new Date(new Date().toDateString()) &&
                          quotation.status === "pendiente"
                            ? "font-medium text-amber-600"
                            : "text-muted-foreground"
                        }
                      >
                        {formatDate(quotation.validUntil)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const isExpired =
                          new Date(quotation.validUntil) < new Date(new Date().toDateString())
                        const displayStatus =
                          isExpired && quotation.status === "pendiente"
                            ? "vencida"
                            : quotation.status
                        return <QuotationStatusBadge status={displayStatus} />
                      })()}
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <div className="flex justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onViewDetails(quotation)}
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
                                onClick={() => onPrint(quotation)}
                                className="h-8 w-8 rounded-full text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Imprimir cotización</p>
                            </TooltipContent>
                          </Tooltip>
                          {quotation.status === "pendiente" ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => onEdit(quotation)}
                                  className="h-8 w-8 rounded-full text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Editar cotización</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : null}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDelete(quotation)}
                                className="h-8 w-8 rounded-full text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Eliminar cotización</p>
                            </TooltipContent>
                          </Tooltip>
                          {quotation.status === "pendiente" || quotation.status === "aprobada" ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => onConvert(quotation)}
                                  className="ml-1 h-8 w-8 rounded-full text-green-600 hover:bg-green-50 hover:text-green-700"
                                >
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {quotation.status === "pendiente"
                                    ? "Aprobar"
                                    : "Convertir a venta"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          ) : null}
                        </div>
                      </TooltipProvider>
                    </TableCell>
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
