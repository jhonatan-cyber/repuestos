"use client"

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building, User, Phone, MapPin, Calendar, DollarSign } from "lucide-react"
import type { Supplier } from "@/lib/types"
import { formatDate } from "@/lib/format-utils"

interface SupplierDetailsDialogProps {
  supplier: Supplier | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SupplierDetailsDialog({
  supplier,
  open,
  onOpenChange,
}: SupplierDetailsDialogProps) {
  if (!supplier) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="border-b">
          <DialogTitle className="text-xl">Detalles del Proveedor</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-6">
            {/* Información General */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Información General</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ID</p>
                  <p className="font-medium">#{supplier.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{supplier.name}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Empresa</p>
                  <div className="flex items-center gap-2">
                    {supplier.company ? (
                      <>
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline">{supplier.company}</Badge>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Registro</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">
                      {supplier.createdAt ? formatDate(supplier.createdAt) : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Información de Contacto */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Información de Contacto</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{supplier.phone}</p>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                  </div>
                </div>

                {supplier.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{supplier.address}</p>
                      <p className="text-sm text-muted-foreground">Dirección</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Información Comercial */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Información Comercial</h3>
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(supplier.totalPurchases ?? 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total en compras</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Resumen */}
            <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {supplier.company ? (
                    <Building className="h-5 w-5 text-primary" />
                  ) : (
                    <User className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{supplier.name}</p>
                  {supplier.company && (
                    <p className="text-sm text-muted-foreground">{supplier.company}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    Proveedor registrado desde{" "}
                    {supplier.createdAt ? formatDate(supplier.createdAt) : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogBody>
        <DialogFooter className="border-t flex justify-center gap-3 sm:justify-center">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
