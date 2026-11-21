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
import { AlertTriangle } from "lucide-react"
import type { Quotation } from "@/lib/types"

interface QuotationDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quotation: Quotation | null
  onConfirm: () => void
}

export function QuotationDeleteDialog({
  open,
  onOpenChange,
  quotation,
  onConfirm,
}: QuotationDeleteDialogProps) {
  if (!quotation) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
        <AlertDialogHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/30 mb-4">
            <AlertTriangle className="h-8 w-8 text-rose-600 dark:text-rose-400" />
          </div>
          <AlertDialogTitle className="text-center text-xl">
            ¿Estás absolutamente seguro?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Esta acción eliminará la cotización para{" "}
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {quotation.clientName}
            </span>{" "}
            de forma permanente. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center gap-2 mt-2">
          <AlertDialogCancel className="rounded-full px-8">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="rounded-full px-8 bg-rose-600 hover:bg-rose-700 text-white border-none"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
