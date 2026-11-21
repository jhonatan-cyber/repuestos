"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface RolesHeaderProps {
  onNewRole: () => void
}

export function RolesHeader({ onNewRole }: RolesHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Roles y Permisos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestiona los roles del sistema y sus permisos asociados
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={onNewRole} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Rol
        </Button>
      </div>
    </div>
  )
}
