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
import type { Sale } from "@/lib/types"

interface CancelSaleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sale: Sale | null
  isCancelling: boolean
  onConfirm: () => void
}

export function CancelSaleDialog({
  open,
  onOpenChange,
  sale,
  isCancelling,
  onConfirm,
}: CancelSaleDialogProps) {
  const saleLabel = sale ? String(sale.id).slice(0, 8).toUpperCase() : ""

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Anular venta?</AlertDialogTitle>
          <AlertDialogDescription>
            Se anulará la venta <strong>#{saleLabel}</strong> y se devolverá stock al inventario.
            Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isCancelling}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isCancelling}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {isCancelling ? "Anulando..." : "Sí, anular"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
