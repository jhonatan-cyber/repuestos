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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { MobileListState } from "@/components/ui/mobile-list-card"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataTable } from "@/components/data-table"
import { AlertTriangle, Eye, MoreHorizontal, Pencil, Power, PowerOff, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/format-utils"
import type { Product } from "@/lib/types"
import { ProductsCardsView } from "./products-cards-view"

interface ProductsTableProps {
  products: Product[]
  isLoading: boolean
  search: string
  onViewDetails: (product: Product) => void
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  onToggleStatus: (product: Product) => void
}

export function ProductsTable({
  products,
  isLoading,
  search,
  onViewDetails,
  onEdit,
  onDelete,
  onToggleStatus,
}: ProductsTableProps) {
  const emptyMessage = search
    ? "No se encontraron productos"
    : "No hay productos registrados en esta categoría"
  const DEFAULT_PRODUCT_IMAGE = "/img/products/product-default.png"

  return (
    <>
      {isLoading ? <MobileListState message="Cargando productos..." /> : null}
      {!isLoading && products.length === 0 ? <MobileListState message={emptyMessage} /> : null}
      {!isLoading && products.length > 0 ? (
        <ProductsCardsView
          products={products}
          onViewDetails={onViewDetails}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleStatus={onToggleStatus}
        />
      ) : null}

      <div className="module-table hidden md:block">
        <div className="overflow-x-auto">
          <DataTable
            caption="Listado de productos"
            minWidth="min-w-[1120px]"
            isEmpty={!isLoading && products.length === 0}
            emptyMessage={emptyMessage}
          >
            <TableHeader>
              <TableRow>
                <TableHead>Imagen</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Precio Compra</TableHead>
                <TableHead>Precio Venta</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="h-10 w-10 animate-pulse rounded bg-muted" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 animate-pulse rounded bg-muted" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 animate-pulse rounded bg-muted" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 animate-pulse rounded bg-muted" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                    </TableCell>
                    <TableCell>
                      <div className="ml-auto h-4 w-8 animate-pulse rounded bg-muted" />
                    </TableCell>
                  </TableRow>
                ))
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.image ? (
                        <button
                          type="button"
                          onClick={() => onViewDetails(product)}
                          className="cursor-pointer rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <img
                            src={product.image || DEFAULT_PRODUCT_IMAGE}
                            alt={product.name}
                            className="h-10 w-10 cursor-pointer rounded-md object-cover border"
                            onError={(e) => {
                              const target = e.currentTarget
                              if (!target.src.endsWith(DEFAULT_PRODUCT_IMAGE)) {
                                target.src = DEFAULT_PRODUCT_IMAGE
                              }
                            }}
                          />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onViewDetails(product)}
                          className="cursor-pointer rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <img
                            src={DEFAULT_PRODUCT_IMAGE}
                            alt={product.name}
                            className="h-10 w-10 cursor-pointer rounded-md object-cover border"
                          />
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {product.code}
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-sm">{product.brand || "Sin marca"}</TableCell>
                    <TableCell className="text-sm">{product.model || "Sin modelo"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            (product.stock || 0) <= (product.minimumStock || 0)
                              ? "font-medium text-orange-600"
                              : ""
                          }
                        >
                          {product.stock || 0} {product.unit}
                        </span>
                        {(product.stock || 0) <= (product.minimumStock || 0) ? (
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                        ) : null}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Mín: {product.minimumStock || 0}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(product.purchasePrice)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(product.salePrice)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.status === "active" ? "default" : "secondary"}>
                        {product.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Abrir menú</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => onViewDetails(product)}
                                  className="text-indigo-600 focus:text-indigo-700"
                                >
                                  <Eye className="mr-2 h-4 w-4 text-indigo-600" /> Ver detalles
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => onEdit(product)}
                                  className="text-blue-600 focus:text-blue-700"
                                >
                                  <Pencil className="mr-2 h-4 w-4 text-blue-600" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => onToggleStatus(product)}
                                  className={
                                    product.status === "active"
                                      ? "text-orange-600 focus:text-orange-700"
                                      : "text-green-600 focus:text-green-700"
                                  }
                                >
                                  {product.status === "active" ? (
                                    <>
                                      <PowerOff className="mr-2 h-4 w-4 text-orange-600" />{" "}
                                      Desactivar
                                    </>
                                  ) : (
                                    <>
                                      <Power className="mr-2 h-4 w-4 text-green-600" /> Activar
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => onDelete(product)}
                                  className="text-red-600 focus:text-red-700"
                                >
                                  <Trash2 className="mr-2 h-4 w-4 text-red-600" /> Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Acciones</p>
                          </TooltipContent>
                        </Tooltip>
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
