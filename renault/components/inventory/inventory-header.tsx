"use client"

import { Plus } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"

interface InventoryHeaderProps {
  onNewProduct: () => void
}

export function InventoryHeader({ onNewProduct }: InventoryHeaderProps) {
  return (
    <PageHeader
      title="Inventario"
      description="Gestiona los productos y el stock de tu inventario"
      action={
        <Button onClick={onNewProduct}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Producto
        </Button>
      }
    />
  )
}
