"use client"

import { Badge } from "@/components/ui/badge"

interface RoleStatusBadgeProps {
  status: "active" | "inactive"
}

export function RoleStatusBadge({ status }: RoleStatusBadgeProps) {
  const isActive = status === "active"

  return (
    <Badge
      variant={isActive ? "default" : "secondary"}
      className={
        isActive
          ? "rounded-full bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700"
          : "rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
      }
    >
      {isActive ? "Activo" : "Inactivo"}
    </Badge>
  )
}
