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

interface ProductDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onConfirm: () => void
}

export function ProductDeleteDialog({
  open,
  onOpenChange,
  product,
  onConfirm,
}: ProductDeleteDialogProps) {
  if (!product) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará permanentemente el producto <strong>"{product.name}"</strong> del
            inventario.
            <div className="mt-2 text-sm">
              <div>
                Código: <span className="font-mono">{product.code}</span>
              </div>
              <div>
                Stock actual:{" "}
                <span className="font-medium">
                  {product.stock} {product.unit}
                </span>
              </div>
            </div>
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm font-medium">
                ⚠️ Esta acción no se puede deshacer y se perderá toda la información del producto.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
