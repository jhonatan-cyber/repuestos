"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  MobileListActions,
  MobileListCard,
  MobileListField,
  MobileListGrid,
  MobileListHeader,
} from "@/components/ui/mobile-list-card"
import { Eye, Pencil, Power, PowerOff, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/format-utils"
import type { Product } from "@/lib/types"

interface ProductsCardsViewProps {
  products: Product[]
  onViewDetails: (product: Product) => void
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  onToggleStatus: (product: Product) => void
}

export function ProductsCardsView({
  products,
  onViewDetails,
  onEdit,
  onDelete,
  onToggleStatus,
}: ProductsCardsViewProps) {
  const DEFAULT_PRODUCT_IMAGE = "/img/products/product-default.png"

  return (
    <div className="grid grid-cols-1 gap-3 md:hidden">
      {products.map((product) => (
        <MobileListCard key={product.id}>
          <div className="mb-3">
            <img
              src={product.image || DEFAULT_PRODUCT_IMAGE}
              alt={product.name}
              className="h-40 w-full rounded-xl border object-cover"
              onClick={() => onViewDetails(product)}
              onError={(e) => {
                const target = e.currentTarget
                if (!target.src.endsWith(DEFAULT_PRODUCT_IMAGE)) {
                  target.src = DEFAULT_PRODUCT_IMAGE
                }
              }}
            />
          </div>

          <MobileListHeader
            title={product.name}
            subtitle={product.code}
            trailing={
              <Badge variant={product.status === "active" ? "default" : "secondary"}>
                {product.status === "active" ? "Activo" : "Inactivo"}
              </Badge>
            }
          />
          <MobileListGrid>
            <MobileListField label="Marca" value={product.brand || "Sin marca"} />
            <MobileListField label="Modelo" value={product.model || "Sin modelo"} />
            <MobileListField label="Stock" value={`${product.stock || 0} ${product.unit}`} />
            <MobileListField label="Mínimo" value={product.minimumStock || 0} />
            <MobileListField label="Compra" value={formatCurrency(product.purchasePrice)} />
            <MobileListField
              label="Venta"
              value={
                <span className="text-base font-bold">{formatCurrency(product.salePrice)}</span>
              }
            />
          </MobileListGrid>
          <MobileListActions>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon-sm"
                    variant="outline"
                    onClick={() => onViewDetails(product)}
                    className="text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-300"
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
                    size="icon-sm"
                    variant="outline"
                    onClick={() => onEdit(product)}
                    className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Editar</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon-sm"
                    variant="outline"
                    onClick={() => onToggleStatus(product)}
                    className={
                      product.status === "active"
                        ? "text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/30 dark:hover:text-orange-300"
                        : "text-green-600 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-950/30 dark:hover:text-green-300"
                    }
                  >
                    {product.status === "active" ? (
                      <PowerOff className="h-4 w-4" />
                    ) : (
                      <Power className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{product.status === "active" ? "Desactivar" : "Activar"}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon-sm"
                    variant="outline"
                    onClick={() => onDelete(product)}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Eliminar</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </MobileListActions>
        </MobileListCard>
      ))}
    </div>
  )
}
