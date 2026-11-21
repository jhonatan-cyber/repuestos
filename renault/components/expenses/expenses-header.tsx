"use client"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { Download, Plus } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ExpensesHeaderProps {
  onNewExpense: () => void
  onExportPDF?: () => void
  disableNewExpense?: boolean
}

export function ExpensesHeader({
  onNewExpense,
  onExportPDF,
  disableNewExpense = false,
}: ExpensesHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <PageHeader title="Gastos" description="Gestiona y registra los gastos de la empresa" />
      <div className="flex flex-wrap items-center gap-2">
        {onExportPDF && (
          <Button variant="outline" onClick={onExportPDF} className="rounded-full gap-2">
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button onClick={onNewExpense} disabled={disableNewExpense}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Gasto
                </Button>
              </span>
            </TooltipTrigger>
            {disableNewExpense && <TooltipContent>Sin caja abierta</TooltipContent>}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}
