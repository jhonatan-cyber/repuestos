"use client"

import { Button } from "@/components/ui/button"
import { LayoutGrid, List } from "lucide-react"

interface ViewModeToggleProps {
  viewMode: "cards" | "table"
  onViewModeChange: (mode: "cards" | "table") => void
}

export function ViewModeToggle({ viewMode, onViewModeChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border p-1">
      <Button
        variant={viewMode === "cards" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange("cards")}
        className={viewMode === "cards" ? "" : "text-muted-foreground"}
      >
        <LayoutGrid className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Cards</span>
      </Button>
      <Button
        variant={viewMode === "table" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange("table")}
        className={viewMode === "table" ? "" : "text-muted-foreground"}
      >
        <List className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Tabla</span>
      </Button>
    </div>
  )
}
