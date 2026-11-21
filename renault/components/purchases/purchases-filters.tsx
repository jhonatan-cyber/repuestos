"use client"

import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PurchasesFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  status: string
  onStatusChange: (value: string) => void
  startDate: string
  endDate: string
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  pageSize: number
  onPageSizeChange: (value: number) => void
  onClearDates: () => void
}

export function PurchasesFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  pageSize,
  onPageSizeChange,
  onClearDates,
}: PurchasesFiltersProps) {
  return (
    <div className="module-filters space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_180px_150px]">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="purchase-search">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="purchase-search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar por proveedor, comprador o producto..."
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
          <Label>Estado</Label>
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger className="w-full rounded-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="recibida">Recibidas</SelectItem>
              <SelectItem value="pendiente">Pendientes</SelectItem>
              <SelectItem value="cancelada">Canceladas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Mostrar</Label>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="w-full rounded-full">
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
      <div className="grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="purchase-start-date">Desde</Label>
          <Input
            id="purchase-start-date"
            type="date"
            value={startDate}
            onChange={(event) => onStartDateChange(event.target.value)}
            className="rounded-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="purchase-end-date">Hasta</Label>
          <Input
            id="purchase-end-date"
            type="date"
            value={endDate}
            onChange={(event) => onEndDateChange(event.target.value)}
            className="rounded-full"
          />
        </div>
        <div className="sm:col-span-2">
          <button
            type="button"
            className="text-left text-sm text-muted-foreground underline hover:text-foreground"
            onClick={onClearDates}
          >
            Limpiar rango de fechas
          </button>
        </div>
      </div>
    </div>
  )
}
