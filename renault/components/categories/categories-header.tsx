"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface CategoriesHeaderProps {
  onNewCategory: () => void
}

export function CategoriesHeader({ onNewCategory }: CategoriesHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Categorías</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestiona las categorías de tus productos
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={onNewCategory} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nueva Categoría
        </Button>
      </div>
    </div>
  )
}
