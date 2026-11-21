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
import type { Permission } from "@/lib/types"

interface PermissionDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  permission: Permission | null
  onConfirm: () => void
}

export function PermissionDeleteDialog({
  open,
  onOpenChange,
  permission,
  onConfirm,
}: PermissionDeleteDialogProps) {
  if (!permission) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar permiso?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará permanentemente el permiso <strong>"{permission.name}"</strong>{" "}
            del sistema.
            {permission.rolesCount && permission.rolesCount > 0 && (
              <>
                <br />
                <br />
                <span className="text-red-600 font-medium">
                  Advertencia: Este permiso está asignado a {permission.rolesCount} rol(es).
                  Eliminar este permiso puede afectar el funcionamiento del sistema.
                </span>
              </>
            )}
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
