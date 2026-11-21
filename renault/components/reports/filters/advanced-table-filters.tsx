"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface TableFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  status: string
  onStatusChange: (value: string) => void
  minAmount: number
  maxAmount: number
  onAmountChange: (min: number, max: number) => void
  statuses: string[]
  onClear: () => void
}

export function TableFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  minAmount,
  maxAmount,
  onAmountChange,
  statuses,
  onClear,
}: TableFiltersProps) {
  return (
    <div className="module-filters space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Filtros</p>
        {(search || status !== "all" || minAmount > 0 || maxAmount < 999999) && (
          <Button size="sm" variant="ghost" onClick={onClear} className="h-8">
            <X className="h-4 w-4 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Búsqueda */}
        <div className="space-y-2">
          <Label htmlFor="search" className="text-xs">
            Buscar
          </Label>
          <Input
            id="search"
            placeholder="Cliente, vendedor, proveedor..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Estado */}
        {statuses.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="status" className="text-xs">
              Estado
            </Label>
            <select
              id="status"
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="h-9 px-3 border border-input rounded-md text-sm bg-background"
            >
              <option value="all">Todos</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Monto mínimo */}
        <div className="space-y-2">
          <Label htmlFor="min-amount" className="text-xs">
            Monto mín.
          </Label>
          <Input
            id="min-amount"
            type="number"
            placeholder="0"
            value={minAmount}
            onChange={(e) => onAmountChange(Number(e.target.value), maxAmount)}
            className="h-9"
          />
        </div>

        {/* Monto máximo */}
        <div className="space-y-2">
          <Label htmlFor="max-amount" className="text-xs">
            Monto máx.
          </Label>
          <Input
            id="max-amount"
            type="number"
            placeholder="999999"
            value={maxAmount}
            onChange={(e) => onAmountChange(minAmount, Number(e.target.value))}
            className="h-9"
          />
        </div>
      </div>
    </div>
  )
}
