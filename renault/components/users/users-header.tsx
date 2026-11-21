"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface UsersHeaderProps {
  onNewUser: () => void
}

export function UsersHeader({ onNewUser }: UsersHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Usuarios</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestiona los usuarios del sistema y sus permisos
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={onNewUser} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>
    </div>
  )
}
