"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Pencil, Trash2, Power, Eye } from "lucide-react"
import type { Role } from "@/lib/types"

interface RoleActionButtonsProps {
  role: Role
  onEdit: (role: Role) => void
  onDelete: (role: Role) => void
  onToggleStatus: (role: Role) => void
  onViewDetails: (role: Role) => void
}

export function RoleActionButtons({
  role,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewDetails,
}: RoleActionButtonsProps) {
  const isActive = role.status === "active"

  return (
    <TooltipProvider>
      <div className="flex justify-end gap-2">
        {/* Botón Ver Detalles */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onViewDetails(role)}
              className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:text-indigo-300 dark:hover:bg-indigo-950/30"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ver detalles</p>
          </TooltipContent>
        </Tooltip>

        {/* Botón Toggle Status */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onToggleStatus(role)}
              className={
                isActive
                  ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:bg-orange-950/30"
                  : "text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-950/30"
              }
            >
              <Power className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isActive ? "Desactivar rol" : "Activar rol"}</p>
          </TooltipContent>
        </Tooltip>

        {/* Botón Editar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(role)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/30"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Editar rol</p>
          </TooltipContent>
        </Tooltip>

        {/* Botón Eliminar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(role)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Eliminar rol</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
