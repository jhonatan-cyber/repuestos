"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Package, ArrowRight, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { exportProductsPDF } from "@/lib/export"
import type { Category, EntityId, Product } from "@/lib/types"
import { loadList } from "@/lib/api-list"
import { apiClient } from "@/lib/api-client"

// Diálogo de importación bajo demanda (dynamic), no en el bundle inicial
const ProductImportDialog = dynamic(
  () => import("@/components/products/product-import-dialog").then((m) => m.ProductImportDialog),
  { ssr: false },
)

export default function ProductsPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    try {
      setIsLoading(true)
      const data = await apiClient<Category[]>("/api/categories")
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setIsLoading(false)
    }
  }

  function refetch() {
    fetchCategories()
  }

  async function handleExportPdf() {
    try {
      const products = await loadList<Product>("/api/products?limit=10000")
      exportProductsPDF(products)
    } catch {
      // silencio
    }
  }

  function handleCategoryClick(categoryId: EntityId) {
    router.push(`/products/category/${categoryId}`)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Productos</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Selecciona una categoría para gestionar sus productos
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-border/50 overflow-hidden"
            >
              <div className="h-1.5 bg-muted w-full" />
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-muted rounded-lg" />
                  <div className="h-5 bg-muted rounded w-24" />
                </div>
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-2/3" />
                <div className="pt-3 border-t border-border/50">
                  <div className="h-4 bg-muted rounded w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Productos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Selecciona una categoría para gestionar sus productos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportPdf} className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Exportar PDF
          </Button>
          <ProductImportDialog categoryId={categories[0]?.id ?? ""} onImportComplete={refetch} />
        </div>
      </div>

      {categories.length === 0 ? (
        <div
          className="module-empty flex flex-col items-center justify-center text-center"
          role="status"
        >
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No hay categorías disponibles
          </h3>
          <p className="text-sm text-muted-foreground">
            Dirígete al módulo de categorías para crear una
          </p>
        </div>
      ) : (
        <TooltipProvider delayDuration={200}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`group relative bg-card rounded-xl border border-border/50 hover:border-border hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 hover:-translate-y-1 cursor-pointer overflow-hidden ${
                  category.status === "inactive" ? "opacity-60" : ""
                }`}
              >
                {/* Color indicator strip */}
                <div
                  className="h-1.5 w-full"
                  style={{ backgroundColor: category.color || "#64748b" }}
                />

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="p-2 rounded-lg shrink-0"
                        style={{ backgroundColor: `${category.color || "#64748b"}20` }}
                      >
                        <Package
                          className="h-4 w-4"
                          style={{ color: category.color || "#64748b" }}
                        />
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="font-semibold text-lg truncate cursor-help">
                            {category.name}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{category.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Badge
                      variant={category.status === "active" ? "default" : "secondary"}
                      className="shrink-0 ml-2"
                    >
                      {category.status === "active" ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>

                  {/* Description */}
                  {category.description && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 cursor-help">
                          {category.description}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{category.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <span className="text-sm text-muted-foreground">
                      {(category as any).productsCount || 0} productos
                    </span>
                    <div className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-sm font-medium">Ver</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TooltipProvider>
      )}
    </div>
  )
}
