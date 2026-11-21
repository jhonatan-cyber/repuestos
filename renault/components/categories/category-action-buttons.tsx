"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Pencil, Trash2, Power } from "lucide-react"
import type { Category } from "@/lib/types"

interface CategoryActionButtonsProps {
  category: Category
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
  onToggleStatus: (category: Category) => void
}

export function CategoryActionButtons({
  category,
  onEdit,
  onDelete,
  onToggleStatus,
}: CategoryActionButtonsProps) {
  const isActive = category.status === "active"

  return (
    <TooltipProvider>
      <div className="flex justify-end gap-2">
        {/* Botón Toggle Status */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onToggleStatus(category)}
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
            <p>{isActive ? "Desactivar categoría" : "Activar categoría"}</p>
          </TooltipContent>
        </Tooltip>

        {/* Botón Editar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(category)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/30"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Editar categoría</p>
          </TooltipContent>
        </Tooltip>

        {/* Botón Eliminar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(category)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Eliminar categoría</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
