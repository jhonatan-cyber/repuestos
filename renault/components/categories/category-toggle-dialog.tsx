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
import type { Category } from "@/lib/types"
import { AlertTriangle } from "lucide-react"

interface CategoryToggleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Category | null
  onConfirm: () => void
}

export function CategoryToggleDialog({
  open,
  onOpenChange,
  category,
  onConfirm,
}: CategoryToggleDialogProps) {
  const isDeactivating = category?.status === "active"
  const actionVerb = isDeactivating ? "desactivar" : "activar"
  const actionPast = isDeactivating ? "desactivada" : "activada"

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            ¿Confirmar {actionVerb}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción cambiará el estado de la categoría <strong>{category?.name}</strong> a{" "}
            <strong>{actionPast}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-2 space-y-2">
          <p className="text-sm">
            La categoría <strong>{category?.name}</strong> será{" "}
            <span className="font-semibold">{actionPast}</span>.
          </p>
          {isDeactivating && (
            <div className="text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg text-sm">
              <strong>Warning:</strong> Los {category?.type === "expense" ? "gastos" : "productos"}{" "}
              asociados también serán <span className="font-semibold">desactivados</span>{" "}
              automáticamente.
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={
              isDeactivating ? "bg-amber-600 hover:bg-amber-700" : "bg-green-600 hover:bg-green-700"
            }
          >
            {isDeactivating ? "Desactivar" : "Activar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
