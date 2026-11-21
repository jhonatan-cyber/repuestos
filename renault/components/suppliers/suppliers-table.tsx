"use client"

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
import { Building, Eye, Pencil, Power, Trash2, User } from "lucide-react"
import type { Supplier } from "@/lib/types"
import { formatDate } from "@/lib/format-utils"

interface SuppliersTableProps {
  suppliers: Supplier[]
  isLoading: boolean
  search: string
  onEdit: (supplier: Supplier) => void
  onDelete: (supplier: Supplier) => void
  onToggleStatus: (supplier: Supplier) => void
  onViewDetails: (supplier: Supplier) => void
}

export function SuppliersTable({
  suppliers,
  isLoading,
  search,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewDetails,
}: SuppliersTableProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 0,
    }).format(amount)

  const emptyMessage = search ? "No se encontraron proveedores" : "No hay proveedores registrados"

  return (
    <>
      {isLoading ? <MobileListState message="Cargando proveedores..." /> : null}
      {!isLoading && suppliers.length === 0 ? <MobileListState message={emptyMessage} /> : null}
      {!isLoading && suppliers.length > 0 ? (
        <MobileList>
          {suppliers.map((supplier) => (
            <MobileListCard key={supplier.id}>
              <MobileListHeader
                title={supplier.name}
                subtitle={supplier.company || "Sin empresa"}
                trailing={
                  <Badge
                    variant={supplier.status === "active" ? "default" : "secondary"}
                    className={
                      supplier.status === "active"
                        ? "rounded-full bg-green-500 text-white hover:bg-green-600"
                        : "rounded-full"
                    }
                  >
                    {supplier.status === "active" ? "Activo" : "Inactivo"}
                  </Badge>
                }
              />
              <MobileListGrid>
                <MobileListField label="Teléfono" value={supplier.phone} />
                <MobileListField label="Dirección" value={supplier.direccion || "Sin dirección"} />
                <MobileListField
                  label="Total compras"
                  value={formatCurrency(supplier.totalPurchases ?? 0)}
                />
                <MobileListField
                  label="Registro"
                  value={supplier.createdAt ? formatDate(supplier.createdAt) : "—"}
                />
              </MobileListGrid>
              <MobileListActions>
                <Button size="sm" variant="outline" onClick={() => onViewDetails(supplier)}>
                  <Eye className="mr-2 h-4 w-4" /> Ver
                </Button>
                <Button size="sm" variant="outline" onClick={() => onToggleStatus(supplier)}>
                  <Power className="mr-2 h-4 w-4" />{" "}
                  {supplier.status === "active" ? "Desactivar" : "Activar"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => onEdit(supplier)}>
                  <Pencil className="mr-2 h-4 w-4" /> Editar
                </Button>
                <Button size="sm" variant="outline" onClick={() => onDelete(supplier)}>
                  <Trash2 className="mr-2 h-4 w-4 text-red-600" /> Eliminar
                </Button>
              </MobileListActions>
            </MobileListCard>
          ))}
        </MobileList>
      ) : null}

      <div className="module-table hidden md:block">
        <div className="overflow-x-auto">
          <DataTable
            caption="Listado de proveedores"
            minWidth="min-w-[980px]"
            isEmpty={!isLoading && suppliers.length === 0}
            emptyMessage={emptyMessage}
          >
            <TableHeader>
              <TableRow>
                <TableHead>Proveedor</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Total Compras</TableHead>
                <TableHead>Fecha Registro</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          {supplier.company ? (
                            <Building className="h-4 w-4 text-primary" />
                          ) : (
                            <User className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{supplier.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {supplier.direccion || "Sin dirección"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{supplier.phone}</p>
                        <p className="text-sm text-muted-foreground">
                          {supplier.company || "Sin empresa"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {supplier.company ? (
                        <Badge variant="outline">{supplier.company}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={supplier.status === "active" ? "default" : "secondary"}
                        className={
                          supplier.status === "active"
                            ? "rounded-full bg-green-500 text-white hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                            : "rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                        }
                      >
                        {supplier.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {formatCurrency(supplier.totalPurchases ?? 0)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {supplier.createdAt ? formatDate(supplier.createdAt) : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <div className="flex justify-end gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onViewDetails(supplier)}
                                className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Ver detalles del proveedor</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onToggleStatus(supplier)}
                                className={
                                  supplier.status === "active"
                                    ? "text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/30 dark:hover:text-orange-300"
                                    : "text-green-600 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-950/30 dark:hover:text-green-300"
                                }
                              >
                                <Power className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {supplier.status === "active" ? "Desactivar" : "Activar"} proveedor
                              </p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onEdit(supplier)}
                                className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Editar proveedor</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onDelete(supplier)}
                                className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Eliminar proveedor</p>
                            </TooltipContent>
                          </Tooltip>
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
