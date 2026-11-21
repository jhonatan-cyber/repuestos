"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface CashHeaderProps {
  hasOpenCash: boolean
  onOpenCash: () => void
}

export function CashHeader({ hasOpenCash, onOpenCash }: CashHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Cajas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestiona apertura, retiros y cierre de caja diaria
        </p>
      </div>

      <Button onClick={onOpenCash} disabled={hasOpenCash} className="flex items-center gap-2">
        <Plus className="h-4 w-4" />
        {hasOpenCash ? "Caja abierta" : "Abrir Caja"}
      </Button>
    </div>
  )
}
