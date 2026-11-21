"use client"

import { Button } from "@/components/ui/button"
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

interface SalesFiltersProps {
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

type DatePreset = "today" | "week" | "month" | null

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

function getDatePreset(start: string, end: string): DatePreset {
  if (!start || !end) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const s = parseLocalDate(start)
  const e = parseLocalDate(end)

  const isToday = s.getTime() === today.getTime() && e.getTime() === today.getTime()
  if (isToday) return "today"

  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  const isWeek = s.getTime() === startOfWeek.getTime() && e.getTime() === endOfWeek.getTime()
  if (isWeek) return "week"

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const isMonth = s.getTime() === startOfMonth.getTime() && e.getTime() === endOfMonth.getTime()
  if (isMonth) return "month"

  return null
}

function formatInputDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function SalesFilters({
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
}: SalesFiltersProps) {
  const preset = getDatePreset(startDate, endDate)

  const applyPreset = (p: DatePreset) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (p === "today") {
      const d = formatInputDate(today)
      onStartDateChange(d)
      onEndDateChange(d)
    } else if (p === "week") {
      const start = new Date(today)
      start.setDate(today.getDate() - today.getDay())
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      onStartDateChange(formatInputDate(start))
      onEndDateChange(formatInputDate(end))
    } else if (p === "month") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      onStartDateChange(formatInputDate(start))
      onEndDateChange(formatInputDate(end))
    }
  }

  return (
    <div className="module-filters space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 space-y-2">
          <Label htmlFor="search" className="text-sm font-medium">
            Buscar
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Buscar por cliente, vendedor o metodo..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-10 rounded-full"
            />
            {search && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
            <SelectTrigger id="status" className="w-full sm:w-[180px] rounded-full">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="completada">Completadas</SelectItem>
              <SelectItem value="pendiente">Pendientes</SelectItem>
              <SelectItem value="cancelada">Canceladas</SelectItem>
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
            <SelectTrigger id="pageSize" className="w-full sm:w-[140px] rounded-full">
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

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 rounded-lg border p-4">
        <div className="space-y-2">
          <Label htmlFor="startDate" className="text-sm font-medium">
            Desde
          </Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="rounded-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate" className="text-sm font-medium">
            Hasta
          </Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="rounded-full"
          />
        </div>
        <div className="flex items-end gap-2">
          <Button
            size="sm"
            variant={preset === "today" ? "default" : "outline"}
            onClick={() => applyPreset("today")}
            className="rounded-full px-3 text-xs"
          >
            Hoy
          </Button>
          <Button
            size="sm"
            variant={preset === "week" ? "default" : "outline"}
            onClick={() => applyPreset("week")}
            className="rounded-full px-3 text-xs"
          >
            Semana
          </Button>
          <Button
            size="sm"
            variant={preset === "month" ? "default" : "outline"}
            onClick={() => applyPreset("month")}
            className="rounded-full px-3 text-xs"
          >
            Mes
          </Button>
          {preset && (
            <button
              className="text-sm text-muted-foreground hover:text-foreground underline ml-1"
              onClick={onClearDates}
            >
              Limpiar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
