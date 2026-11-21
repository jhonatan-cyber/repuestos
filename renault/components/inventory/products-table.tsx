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
import { formatCurrency } from "@/lib/format-utils"
import type { Product } from "@/lib/types"
import { Pencil, Trash2 } from "lucide-react"

interface ProductsTableProps {
  products: Product[]
  isLoading: boolean
  search: string
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

export function ProductsTable({
  products,
  isLoading,
  search,
  onEdit,
  onDelete,
}: ProductsTableProps) {
  const getStockStatus = (stock: number, minimumStock: number) => {
    const percentage = minimumStock > 0 ? (stock / minimumStock) * 100 : stock > 0 ? 101 : 0

    if (percentage <= 0) return { label: "Sin stock", variant: "destructive" as const }
    if (percentage <= 50) return { label: "Crítico", variant: "destructive" as const }
    if (percentage <= 100) return { label: "Bajo", variant: "secondary" as const }
    return { label: "Normal", variant: "default" as const }
  }

  const emptyMessage = search
    ? "No se encontraron productos para la búsqueda actual"
    : "No se encontraron productos"
  const columns: DataTableColumn<Product>[] = [
    {
      key: "name",
      header: "Nombre",
      cellClassName: "font-medium",
      render: (product) => product.name,
    },
    {
      key: "category",
      header: "Categoría",
      render: (product) => <Badge variant="outline">{product.category}</Badge>,
    },
    {
      key: "supplier",
      header: "Proveedor",
      cellClassName: "text-sm text-muted-foreground",
      render: (product) => product.supplierName,
    },
    {
      key: "purchasePrice",
      header: "Precio Compra",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (product) => formatCurrency(product.purchasePrice),
    },
    {
      key: "salePrice",
      header: "Precio Venta",
      headerClassName: "text-right",
      cellClassName: "text-right font-semibold",
      render: (product) => formatCurrency(product.salePrice),
    },
    {
      key: "stock",
      header: "Stock",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (product) => `${product.stock} ${product.unit}`,
    },
    {
      key: "status",
      header: "Estado",
      render: (product) => {
        const status = getStockStatus(product.stock || 0, product.minimumStock || 0)
        return <Badge variant={status.variant}>{status.label}</Badge>
      },
    },
    {
      key: "actions",
      header: "Acciones",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (product) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            aria-label={`Editar ${product.name}`}
            onClick={() => onEdit(product)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(product)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      {isLoading ? <MobileListState message="Cargando productos..." /> : null}
      {!isLoading && products.length === 0 ? <MobileListState message={emptyMessage} /> : null}
      {!isLoading && products.length > 0 ? (
        <MobileList>
          {products.map((product) => {
            const status = getStockStatus(product.stock || 0, product.minimumStock || 0)

            return (
              <MobileListCard key={product.id}>
                <MobileListHeader
                  title={product.name}
                  trailing={<Badge variant={status.variant}>{status.label}</Badge>}
                />
                <MobileListGrid>
                  <MobileListField
                    label="Categoría"
                    value={<Badge variant="outline">{product.category}</Badge>}
                  />
                  <MobileListField label="Proveedor" value={product.supplierName} />
                  <MobileListField label="Compra" value={formatCurrency(product.purchasePrice)} />
                  <MobileListField
                    label="Venta"
                    value={
                      <span className="text-base font-semibold">
                        {formatCurrency(product.salePrice)}
                      </span>
                    }
                  />
                  <MobileListField
                    label="Stock"
                    value={`${product.stock} ${product.unit}`}
                    className="col-span-2"
                  />
                </MobileListGrid>
                <MobileListActions>
                  <Button size="sm" variant="outline" onClick={() => onEdit(product)}>
                    <Pencil className="mr-2 h-4 w-4" /> Editar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onDelete(product)}>
                    <Trash2 className="mr-2 h-4 w-4 text-red-600" /> Eliminar
                  </Button>
                </MobileListActions>
              </MobileListCard>
            )
          })}
        </MobileList>
      ) : null}

      <DataTable
        caption="Inventario de productos"
        columns={columns}
        rows={products}
        isLoading={isLoading}
        emptyMessage={emptyMessage}
        minWidth="min-w-[1080px]"
      />
    </>
  )
}
