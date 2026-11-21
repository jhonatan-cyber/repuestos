"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Pencil, Trash2, Power } from "lucide-react"
import type { Client } from "@/lib/types"

interface ClientActionButtonsProps {
  client: Client
  onEdit: (client: Client) => void
  onDelete: (client: Client) => void
  onToggleStatus: (client: Client) => void
}

export function ClientActionButtons({
  client,
  onEdit,
  onDelete,
  onToggleStatus,
}: ClientActionButtonsProps) {
  const isActive = client.status === "active"

  return (
    <TooltipProvider>
      <div className="flex justify-end gap-2">
        {/* Botón Toggle Status */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onToggleStatus(client)}
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
            <p>{isActive ? "Desactivar cliente" : "Activar cliente"}</p>
          </TooltipContent>
        </Tooltip>

        {/* Botón Editar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(client)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/30"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Editar cliente</p>
          </TooltipContent>
        </Tooltip>

        {/* Botón Eliminar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(client)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Eliminar cliente</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
