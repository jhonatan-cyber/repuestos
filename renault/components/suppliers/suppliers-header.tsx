"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface SuppliersHeaderProps {
  onNewSupplier: () => void
}

export function SuppliersHeader({ onNewSupplier }: SuppliersHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Proveedores</h1>
        <p className="text-muted-foreground">Gestiona la información de tus proveedores</p>
      </div>
      <Button onClick={onNewSupplier} className="gap-2">
        <Plus size={16} />
        Nuevo Proveedor
      </Button>
    </div>
  )
}
