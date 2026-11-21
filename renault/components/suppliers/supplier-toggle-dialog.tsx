"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Supplier } from "@/lib/types"

interface SupplierToggleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier: Supplier | null
  onConfirm: () => void
}

export function SupplierToggleDialog({
  open,
  onOpenChange,
  supplier,
  onConfirm,
}: SupplierToggleDialogProps) {
  if (!supplier) return null

  const isDeactivating = supplier.status === "active"

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ¿{isDeactivating ? "Desactivar" : "Activar"} proveedor?
          </AlertDialogTitle>
          <AlertDialogDescription>
            El proveedor <strong>{supplier.name}</strong> será{" "}
            <strong>{isDeactivating ? "desactivado" : "activado"}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {isDeactivating ? "Desactivar" : "Activar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
