"use client"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface QuotationsHeaderProps {
  onNewQuotation: () => void
}

export function QuotationsHeader({ onNewQuotation }: QuotationsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <PageHeader
        title="Cotizaciones"
        description="Gestiona presupuestos y conviértelos en ventas reales."
      />
      <Button
        onClick={onNewQuotation}
        className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300 gap-2 px-6"
      >
        <Plus className="h-4 w-4" />
        Nueva Cotización
      </Button>
    </div>
  )
}
