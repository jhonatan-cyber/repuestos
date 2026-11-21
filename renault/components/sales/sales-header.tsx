"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { FileText, Plus } from "lucide-react"

interface SalesHeaderProps {
  onNewSale: () => void
  onExportPDF: () => void
  disableNewSale?: boolean
}

export function SalesHeader({ onNewSale, onExportPDF, disableNewSale = false }: SalesHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Ventas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestiona ventas, revisa detalles y exporta resultados
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onExportPDF} className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Exportar PDF
        </Button>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button
                  onClick={onNewSale}
                  disabled={disableNewSale}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nueva Venta
                </Button>
              </span>
            </TooltipTrigger>
            {disableNewSale && <TooltipContent>Sin caja abierta</TooltipContent>}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}
