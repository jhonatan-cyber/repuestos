"use client"

import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"

export function ReportsHeader() {
  return (
    <PageHeader
      title="Reportes"
      description="Análisis consolidado de ventas, compras y gastos"
      action={<Badge variant="outline">Módulo ejecutivo</Badge>}
    />
  )
}
