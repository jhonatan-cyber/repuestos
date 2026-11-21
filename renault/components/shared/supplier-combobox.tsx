"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"

type SupplierOption = {
  id: string | number
  name: string
  company?: string | null
}

interface SupplierComboboxProps {
  suppliers: SupplierOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function SupplierCombobox({
  suppliers,
  value,
  onChange,
  placeholder = "Seleccionar proveedor",
  disabled,
}: SupplierComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const selected = suppliers.find((s) => String(s.id) === String(value))
  const selectedLabel = selected
    ? selected.company
      ? `${selected.company} (${selected.name})`
      : selected.name
    : placeholder

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setSearch("")
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between rounded-full font-normal"
          disabled={disabled}
        >
          {selectedLabel}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <div className="relative">
            <CommandInput
              placeholder="Buscar proveedor..."
              value={search}
              onValueChange={setSearch}
              className="pr-8"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <CommandList className="max-h-64 overflow-y-auto">
            <CommandEmpty>Sin resultados.</CommandEmpty>
            <CommandGroup>
              {suppliers.map((supplier) => {
                const id = String(supplier.id)
                const label = supplier.company
                  ? `${supplier.company} (${supplier.name})`
                  : supplier.name
                return (
                  <CommandItem
                    key={id}
                    value={`${label} ${supplier.name} ${supplier.company ?? ""}`}
                    onSelect={() => {
                      onChange(id)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        String(value) === id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {label}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
