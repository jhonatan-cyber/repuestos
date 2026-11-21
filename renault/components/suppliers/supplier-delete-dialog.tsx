"use client"

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Building, User } from "lucide-react"
import type { Supplier } from "@/lib/types"

interface SupplierDeleteDialogProps {
  supplier: Supplier | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function SupplierDeleteDialog({
  supplier,
  open,
  onOpenChange,
  onConfirm,
}: SupplierDeleteDialogProps) {
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
      <DialogContent className="max-w-md">
        <DialogHeader className="border-b">
          <DialogTitle className="text-xl flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Eliminar Proveedor
          </DialogTitle>
          <DialogDescription>Esta acción no se puede deshacer</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm">
                ¿Estás seguro de que deseas eliminar el proveedor{" "}
                <span className="font-semibold">"{supplier.name}"</span>?
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Advertencia:</strong> Al eliminar este proveedor:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Se eliminará permanentemente del sistema</li>
                <li>• Los productos asociados quedarán sin proveedor</li>
                <li>• Se perderá el historial de compras</li>
                <li>• Esta acción no se puede deshacer</li>
              </ul>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                {supplier.company ? (
                  <Building className="h-5 w-5 text-primary" />
                ) : (
                  <User className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">{supplier.name}</p>
                {supplier.company && (
                  <p className="text-sm text-muted-foreground">{supplier.company}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Total compras: {formatCurrency(supplier.totalPurchases || 0)}
                </p>
              </div>
            </div>
          </div>
        </DialogBody>

        <DialogFooter className="border-t flex justify-center gap-3 sm:justify-center">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Eliminar Proveedor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
