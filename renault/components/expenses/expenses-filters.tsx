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

interface ExpensesFiltersProps {
  search: string
  onSearchChange: (search: string) => void
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onClearDates: () => void
  pageSize: number
  onPageSizeChange: (pageSize: number) => void
}

export function ExpensesFilters({
  search,
  onSearchChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClearDates,
  pageSize,
  onPageSizeChange,
}: ExpensesFiltersProps) {
  return (
    <div className="module-filters flex flex-col gap-4 xl:flex-row xl:items-end">
      <div className="relative flex-1 space-y-2">
        <Label htmlFor="search" className="text-sm font-medium">
          Buscar
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Buscar por nombre, descripción o categoría..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="rounded-full pl-10 pr-10"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2 xl:w-[190px]">
        <Label htmlFor="expense-start-date" className="text-sm font-medium">
          Desde
        </Label>
        <Input
          id="expense-start-date"
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="rounded-full"
        />
      </div>

      <div className="space-y-2 xl:w-[190px]">
        <Label htmlFor="expense-end-date" className="text-sm font-medium">
          Hasta
        </Label>
        <Input
          id="expense-end-date"
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="rounded-full"
        />
      </div>

      <div className="flex items-end xl:pb-[1px]">
        <button
          type="button"
          onClick={onClearDates}
          disabled={!startDate && !endDate}
          className="h-10 rounded-full border px-4 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          Limpiar fechas
        </button>
      </div>

      <div className="space-y-2 xl:w-[160px]">
        <Label htmlFor="pageSize" className="text-sm font-medium">
          Mostrar
        </Label>
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => onPageSizeChange(parseInt(value))}
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
