"use client"

import { Search, X } from "lucide-react"
import type { Category, Supplier } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface InventoryFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  categoryFilter: string
  onCategoryFilterChange: (value: string) => void
  supplierFilter: string
  onSupplierFilterChange: (value: string) => void
  stockFilter: string
  onStockFilterChange: (value: string) => void
  pageSize: number
  onPageSizeChange: (value: number) => void
  categories: Category[]
  suppliers: Supplier[]
}

export function InventoryFilters({
  search,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  supplierFilter,
  onSupplierFilterChange,
  stockFilter,
  onStockFilterChange,
  pageSize,
  onPageSizeChange,
  categories,
  suppliers,
}: InventoryFiltersProps) {
  return (
    <div className="module-filters space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="inventory-search">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="inventory-search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar por codigo, producto, categoria o proveedor..."
              className="rounded-full pl-10 pr-10"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
            <SelectTrigger className="rounded-full">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={String(category.id)}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Proveedor</Label>
          <Select value={supplierFilter} onValueChange={onSupplierFilterChange}>
            <SelectTrigger className="rounded-full">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={String(supplier.id)}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Stock</Label>
          <Select value={stockFilter} onValueChange={onStockFilterChange}>
            <SelectTrigger className="rounded-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="low-stock">Stock bajo</SelectItem>
              <SelectItem value="normal-stock">Stock normal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <div className="w-full space-y-2 sm:w-[180px]">
          <Label>Mostrar</Label>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="rounded-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 por pagina</SelectItem>
              <SelectItem value="25">25 por pagina</SelectItem>
              <SelectItem value="50">50 por pagina</SelectItem>
              <SelectItem value="100">100 por pagina</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
