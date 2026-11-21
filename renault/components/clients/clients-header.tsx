"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface ClientsHeaderProps {
  onNewClient: () => void
}

export function ClientsHeader({ onNewClient }: ClientsHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestiona la información de tus clientes
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={onNewClient} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>
    </div>
  )
}
