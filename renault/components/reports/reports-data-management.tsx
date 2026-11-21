"use client"

import { Database, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ReportsDataManagementProps {
  onBackup: () => Promise<void>
}

export function ReportsDataManagement({ onBackup }: ReportsDataManagementProps) {
  return (
    <Card className="border-[#e7d39d] bg-[#fff8e1]">
      <CardHeader>
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <CardTitle className="text-base sm:text-lg">Administracion de Datos</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Como aplicacion local, los datos se guardan unicamente en este equipo. Recomendamos
          realizar un respaldo periodico en una unidad externa o carpeta en la nube.
        </p>
        <Button onClick={onBackup} className="w-full sm:w-auto hover-glow">
          <Database className="mr-2 h-4 w-4" />
          Crear Respaldo de Seguridad
        </Button>
      </CardContent>
    </Card>
  )
}
