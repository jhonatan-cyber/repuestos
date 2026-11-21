"use client"

import { Badge } from "@/components/ui/badge"

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pendiente: "secondary",
  aprobada: "default",
  rechazada: "destructive",
  convertida: "outline",
  vencida: "destructive",
  solicitado: "outline",
}

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  convertida: "Convertida",
  vencida: "Vencida",
  solicitado: "Solicitado",
}

interface QuotationStatusBadgeProps {
  status: string
}

export function QuotationStatusBadge({ status }: QuotationStatusBadgeProps) {
  const variant = STATUS_COLORS[status] || "default"
  const label = STATUS_LABELS[status] || status

  return (
    <Badge variant={variant} className="capitalize">
      {label}
    </Badge>
  )
}
