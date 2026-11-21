"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CalendarDays, RefreshCw } from "lucide-react"
import type { ReactNode } from "react"

interface ReportsFiltersProps {
  dateFrom: string
  onDateFromChange: (value: string) => void
  dateTo: string
  onDateToChange: (value: string) => void
  isLoading: boolean
  onRefresh: () => void
  onPreset: (preset: "today" | "week" | "month" | "year" | "all") => void
  children?: ReactNode
}

export function ReportsFilters({
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  isLoading,
  onRefresh,
  onPreset,
  children,
}: ReportsFiltersProps) {
  return (
    <Card className="module-filters">
      <CardContent className="space-y-4 p-0">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            className="flex-1 sm:flex-none"
            variant="outline"
            onClick={() => onPreset("today")}
          >
            Hoy
          </Button>
          <Button
            size="sm"
            className="flex-1 sm:flex-none"
            variant="outline"
            onClick={() => onPreset("week")}
          >
            Esta semana
          </Button>
          <Button
            size="sm"
            className="flex-1 sm:flex-none"
            variant="outline"
            onClick={() => onPreset("month")}
          >
            Este mes
          </Button>
          <Button
            size="sm"
            className="flex-1 sm:flex-none"
            variant="outline"
            onClick={() => onPreset("year")}
          >
            Este año
          </Button>
          <Button
            size="sm"
            className="flex-1 sm:flex-none"
            variant="outline"
            onClick={() => onPreset("all")}
          >
            Todos
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <Label htmlFor="report-date-from">Fecha desde</Label>
            <Input
              id="report-date-from"
              type="date"
              value={dateFrom}
              onChange={(event) => onDateFromChange(event.target.value)}
            />
          </div>
          <div className="min-w-0">
            <Label htmlFor="report-date-to">Fecha hasta</Label>
            <Input
              id="report-date-to"
              type="date"
              value={dateTo}
              onChange={(event) => onDateToChange(event.target.value)}
            />
          </div>
          <Button className="w-full lg:w-auto" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {isLoading ? "Actualizando..." : "Actualizar"}
          </Button>
        </div>

        <div className="flex flex-col gap-1 rounded-lg border bg-muted px-3 py-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span>Rango activo:</span>
          </div>
          <span className="break-words font-medium text-foreground">
            {dateFrom || dateTo
              ? `${dateFrom || "Inicio"} → ${dateTo || "Hoy"}`
              : "Todos los registros"}
          </span>
        </div>

        {children ? <div className="overflow-x-auto">{children}</div> : null}
      </CardContent>
    </Card>
  )
}
