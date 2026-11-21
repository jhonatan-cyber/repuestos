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
import type { Expense } from "@/lib/types"

interface ExpenseDeleteDialogProps {
  expense: Expense | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function ExpenseDeleteDialog({
  expense,
  open,
  onOpenChange,
  onConfirm,
}: ExpenseDeleteDialogProps) {
  if (!expense) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Se eliminará permanentemente el gasto:</p>
            <div className="bg-muted p-3 rounded-lg">
              <p className="font-medium">{expense.description}</p>
              <p className="text-sm text-muted-foreground">
                Categoría: {expense.category} • Monto: {formatCurrency(expense.amount)}
              </p>
            </div>
            <p className="text-sm">Esta acción no se puede deshacer.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
