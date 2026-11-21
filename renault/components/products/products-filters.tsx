"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, X } from "lucide-react"

interface ProductsFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  status: string
  onStatusChange: (value: string) => void
  pageSize: number
  onPageSizeChange: (value: number) => void
}

export function ProductsFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  pageSize,
  onPageSizeChange,
}: ProductsFiltersProps) {
  return (
    <div className="module-filters flex flex-col gap-4 sm:flex-row">
      <div className="relative flex-1 space-y-2">
        <Label htmlFor="search" className="text-sm font-medium">
          Buscar
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Buscar por nombre o código..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="rounded-full pl-10 pr-10"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status" className="text-sm font-medium">
          Estado
        </Label>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger id="status" className="w-full rounded-full sm:w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
            <SelectItem value="low-stock">Stock bajo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pageSize" className="text-sm font-medium">
          Mostrar
        </Label>
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger id="pageSize" className="w-full rounded-full sm:w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 por página</SelectItem>
            <SelectItem value="25">25 por página</SelectItem>
            <SelectItem value="50">50 por página</SelectItem>
            <SelectItem value="100">100 por página</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
