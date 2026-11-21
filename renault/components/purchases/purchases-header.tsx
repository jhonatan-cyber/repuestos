"use client"

import { FileText, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface PurchasesHeaderProps {
  onNewPurchase: () => void
  onExportPDF: () => void
  disableNewPurchase?: boolean
}

export function PurchasesHeader({
  onNewPurchase,
  onExportPDF,
  disableNewPurchase = false,
}: PurchasesHeaderProps) {
  return (
    <PageHeader
      title="Compras"
      description="Gestiona las compras a proveedores y revisa sus detalles"
      action={
        <>
          <Button variant="outline" onClick={onExportPDF}>
            <FileText className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button onClick={onNewPurchase} disabled={disableNewPurchase}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Compra
                  </Button>
                </span>
              </TooltipTrigger>
              {disableNewPurchase && <TooltipContent>Sin caja abierta</TooltipContent>}
            </Tooltip>
          </TooltipProvider>
        </>
      }
    />
  )
}
