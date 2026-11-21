"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Category, EntityId } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { MoreVertical, Pencil, ToggleLeft, Trash2 } from "lucide-react"
import { useState, useEffect, useRef } from "react"

interface CategoriesCardsProps {
  categories: Category[]
  isLoading: boolean
  search: string
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
  onToggleStatus: (category: Category) => void
}

export function CategoriesCards({
  categories,
  isLoading,
  search,
  onEdit,
  onDelete,
  onToggleStatus,
}: CategoriesCardsProps) {
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(null)
      }
    }

    if (menuOpen) {
      document.addEventListener("click", handleClickOutside)
      return () => document.removeEventListener("click", handleClickOutside)
    }
  }, [menuOpen])

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-6 w-24 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-4 w-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        {search ? "No se encontraron categorías" : "No hay categorías registradas"}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {categories.map((category) => {
        const isMenuOpen = String(category.id) === menuOpen
        return (
          <div
            key={category.id}
            className={`relative cursor-pointer ${
              category.status === "inactive" ? "opacity-60" : ""
            } ${isMenuOpen ? "z-50" : ""}`}
            onClick={() => {
              setMenuOpen(null)
            }}
          >
            <Card className="transition-all hover:shadow-md">
              {/* Color indicator strip */}
              <div
                className="h-1.5 w-full"
                style={{ backgroundColor: category.color || "#64748b" }}
              />

              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-semibold line-clamp-1">
                    {category.name}
                  </CardTitle>
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpen(String(category.id) === menuOpen ? null : String(category.id))
                      }}
                      className={`p-1.5 rounded-md hover:bg-muted transition-colors ${
                        String(category.id) === menuOpen ? "bg-muted" : ""
                      }`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {String(category.id) === menuOpen && (
                      <div className="absolute right-0 top-full mt-1 z-50 min-w-[140px] rounded-md border bg-background shadow-lg py-1 animate-in fade-in zoom-in-95 duration-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onEdit(category)
                            setMenuOpen(null)
                          }}
                          className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-muted transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleStatus(category)
                            setMenuOpen(null)
                          }}
                          className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-muted transition-colors"
                        >
                          <ToggleLeft className="h-3.5 w-3.5" />
                          {category.status === "active" ? "Desactivar" : "Activar"}
                        </button>
                        <hr className="my-1" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDelete(category)
                            setMenuOpen(null)
                          }}
                          className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-red-600 hover:bg-muted transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <Badge
                    variant={category.status === "active" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {category.status === "active" ? "Activo" : "Inactivo"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {(category as any).productsCount || 0} productos
                  </span>
                </div>

                {category.description && (
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                    {category.description}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )
      })}
    </div>
  )
}
