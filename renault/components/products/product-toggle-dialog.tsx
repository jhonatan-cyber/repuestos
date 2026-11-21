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
import type { Product } from "@/lib/types"

interface ProductToggleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onConfirm: () => void
}

export function ProductToggleDialog({
  open,
  onOpenChange,
  product,
  onConfirm,
}: ProductToggleDialogProps) {
  if (!product) return null
  const isDeactivating = product.status === "active"

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ¿{isDeactivating ? "Desactivar" : "Activar"} producto?
          </AlertDialogTitle>
          <AlertDialogDescription>
            El producto <strong>{product.name}</strong> ({product.code}) será{" "}
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
