"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface PermissionsHeaderProps {
  onNewPermission: () => void
}

export function PermissionsHeader({ onNewPermission }: PermissionsHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Permisos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestiona los permisos del sistema y personalizados
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={onNewPermission} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Permiso
        </Button>
      </div>
    </div>
  )
}
