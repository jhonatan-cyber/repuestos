"use client"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, Calendar, X, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface QuotationsFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  status: string
  onStatusChange: (value: string) => void
  startDate: string
  onStartDateChange: (value: string) => void
  endDate: string
  onEndDateChange: (value: string) => void
  pageSize: number
  onPageSizeChange: (value: number) => void
  onExport: () => void
  activeTab: string
  onTabChange: (tab: string) => void
}

export function QuotationsFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  pageSize,
  onPageSizeChange,
  onExport,
  activeTab,
  onTabChange,
}: QuotationsFiltersProps) {
  const clearFilters = () => {
    onSearchChange("")
    onStatusChange("all")
    onStartDateChange("")
    onEndDateChange("")
  }

  return (
    <div className="module-filters space-y-4">
      {/* Tabs switched */}
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsList className="rounded-full">
            <TabsTrigger
              value="clientes"
              className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              A clientes
            </TabsTrigger>
            <TabsTrigger
              value="proveedores"
              className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              A proveedores
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Búsqueda */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={
              activeTab === "proveedores"
                ? "Buscar por proveedor, notas o ID..."
                : "Buscar por cliente, vendedor o ID..."
            }
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 rounded-full bg-muted/50 border-none focus-visible:ring-primary"
          />
        </div>

        {/* Estado */}
        <div className="w-full lg:w-48">
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger className="rounded-full bg-muted/50 border-none">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Estado" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              {activeTab === "proveedores" ? (
                <>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="recibido">Recibido</SelectItem>
                  <SelectItem value="respondido">Respondido</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="aprobada">Aprobada</SelectItem>
                  <SelectItem value="rechazada">Rechazada</SelectItem>
                  <SelectItem value="convertida">Convertida</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Fechas */}
        <div className="flex gap-2 items-center flex-1">
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="pl-8 rounded-full bg-muted/50 border-none text-xs"
            />
          </div>
          <span className="text-muted-foreground">-</span>
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="pl-8 rounded-full bg-muted/50 border-none text-xs"
            />
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={clearFilters}
            className="rounded-full hover:bg-destructive/10 hover:text-destructive"
            title="Limpiar filtros"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button variant="secondary" onClick={onExport} className="rounded-full gap-2 px-6">
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Mostrar</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(val) => onPageSizeChange(parseInt(val))}
          >
            <SelectTrigger className="h-7 w-[70px] bg-transparent border-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span>por página</span>
        </div>
      </div>
    </div>
  )
}
