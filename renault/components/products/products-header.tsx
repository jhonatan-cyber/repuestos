"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, ArrowLeft, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Category, EntityId, Product } from "@/lib/types"
import { exportProductsPDF } from "@/lib/export"
interface ProductsHeaderProps {
  onNewProduct: () => void
  category: Category | null
  categoryId: EntityId
  allProducts?: Product[]
}

export function ProductsHeader({
  onNewProduct,
  category,
  categoryId,
  allProducts = [],
}: ProductsHeaderProps) {
  const router = useRouter()

  return (
    <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {category ? category.name : "Productos"}
          </h1>
          {category && (
            <Badge variant={category.status === "active" ? "default" : "secondary"}>
              {category.status === "active" ? "Activa" : "Inactiva"}
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {category
            ? `Gestiona los productos de la categoría ${category.name}`
            : "Gestiona los productos de esta categoría"}
        </p>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
        <Button
          variant="outline"
          onClick={() => exportProductsPDF(allProducts, category?.name)}
          className="flex w-full items-center justify-center gap-2 sm:w-auto"
        >
          <FileText className="h-4 w-4" />
          Exportar PDF
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/products")}
          className="flex w-full items-center justify-center gap-2 sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Categorías
        </Button>
        <Button
          onClick={onNewProduct}
          className="flex w-full items-center justify-center gap-2 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Nuevo Producto
        </Button>
      </div>
    </div>
  )
}
