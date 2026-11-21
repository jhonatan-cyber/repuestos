"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search } from "lucide-react"

interface PermissionsFiltersProps {
  search: string
  onSearchChange: (search: string) => void
  status: "all" | "active" | "inactive"
  onStatusChange: (status: "all" | "active" | "inactive") => void
  category: string
  onCategoryChange: (category: string) => void
  pageSize: number
  onPageSizeChange: (pageSize: number) => void
}

const CATEGORIES = [
  { id: "all", label: "Todas las Categorías", color: "default" },
  { id: "core", label: "Core", color: "blue" },
  { id: "sales", label: "Ventas", color: "green" },
  { id: "inventory", label: "Inventario", color: "purple" },
  { id: "finance", label: "Finanzas", color: "orange" },
  { id: "admin", label: "Administración", color: "red" },
]

export function PermissionsFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  category,
  onCategoryChange,
  pageSize,
  onPageSizeChange,
}: PermissionsFiltersProps) {
  return (
    <div className="module-filters space-y-4">
      {/* Filtros de categoría */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.id}
            variant={category === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryChange(cat.id)}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar permisos por nombre, módulo o descripción..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 rounded-full"
          />
        </div>

        <div className="flex gap-2">
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger className="w-[140px] rounded-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="w-[100px] rounded-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
