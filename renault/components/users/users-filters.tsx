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

interface UsersFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  status: string
  onStatusChange: (value: string) => void
  role: string
  onRoleChange: (value: string) => void
  pageSize: number
  onPageSizeChange: (value: number) => void
}

export function UsersFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  role,
  onRoleChange,
  pageSize,
  onPageSizeChange,
}: UsersFiltersProps) {
  return (
    <div className="module-filters flex flex-col gap-4 sm:flex-row">
      {/* Buscador */}
      <div className="relative flex-1 space-y-2">
        <Label htmlFor="search" className="text-sm font-medium">
          Buscar
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Buscar por nombre, email o rol..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10 rounded-full"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Selector de Estado */}
      <div className="space-y-2">
        <Label htmlFor="status" className="text-sm font-medium">
          Estado
        </Label>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger id="status" className="w-full sm:w-[140px] rounded-full">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Selector de Rol */}
      <div className="space-y-2">
        <Label htmlFor="role" className="text-sm font-medium">
          Rol
        </Label>
        <Select value={role} onValueChange={onRoleChange}>
          <SelectTrigger id="role" className="w-full sm:w-[160px] rounded-full">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="vendedor">Vendedor</SelectItem>
            <SelectItem value="compras">Compras</SelectItem>
            <SelectItem value="supervisor">Supervisor</SelectItem>
            <SelectItem value="invitado">Invitado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Selector de Items por Página */}
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
