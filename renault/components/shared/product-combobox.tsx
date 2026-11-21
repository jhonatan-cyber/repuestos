"use client"

import { useState, useMemo } from "react"
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
import type { Product } from "@/lib/types"

interface ProductComboboxProps {
  products: Product[]
  value: string
  onChange: (productId: string, product: Product) => void
  /** IDs to exclude from the list (e.g., already selected in other rows) */
  excludeIds?: string[]
  placeholder?: string
  searchPlaceholder?: string
  loading?: boolean
  loadingText?: string
  emptyText?: string
  disabled?: boolean
  /** When true, items with stock <= 0 are visually disabled and unselectable (use only in sales contexts) */
  disableOutOfStock?: boolean
  className?: string
}

const formatPriceCompact = (value: number) =>
  `Bs ${new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value || 0)}`

export function ProductCombobox({
  products,
  value,
  onChange,
  excludeIds = [],
  placeholder = "Seleccionar producto",
  searchPlaceholder = "Buscar producto...",
  loading = false,
  loadingText = "Cargando productos...",
  emptyText = "Sin resultados.",
  disabled = false,
  disableOutOfStock = false,
  className,
}: ProductComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const selected = useMemo(
    () => products.find((p) => String(p.id) === String(value)),
    [products, value],
  )

  const excludeSet = useMemo(() => new Set(excludeIds.map(String)), [excludeIds])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return products.filter((p) => {
      // Exclude already selected products (unless it's the currently selected one)
      const pid = String(p.id)
      if (excludeSet.has(pid) && pid !== String(value)) return false

      // Search by name or code
      if (!q) return true
      return p.name.toLowerCase().includes(q) || (p.code ?? "").toLowerCase().includes(q)
    })
  }, [products, search, excludeSet, value])

  const triggerLabel = loading ? loadingText : selected ? selected.name : placeholder

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
          className={cn("w-full justify-between font-normal", className)}
          disabled={disabled || loading}
        >
          <span className="truncate text-left">{triggerLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(42rem,95vw)] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="relative">
            <CommandInput
              placeholder={searchPlaceholder}
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
          <CommandList
            className="max-h-72 overflow-y-auto overscroll-contain"
            onWheel={(event) => event.stopPropagation()}
            onTouchMove={(event) => event.stopPropagation()}
          >
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {filtered.map((product) => {
                const pid = String(product.id)
                const outOfStock = disableOutOfStock && (product.stock ?? 0) <= 0
                return (
                  <CommandItem
                    key={pid}
                    value={`${product.name} ${product.code ?? ""}`}
                    disabled={outOfStock}
                    aria-disabled={outOfStock ? "true" : undefined}
                    className={cn(
                      outOfStock && "opacity-50 cursor-not-allowed pointer-events-none",
                    )}
                    onSelect={() => {
                      if (outOfStock) return
                      onChange(pid, product)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        String(value) === pid ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{product.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {product.brand || "Sin marca"} · {product.model || "Sin modelo"} ·{" "}
                        {outOfStock ? (
                          <span className="font-semibold text-destructive">Sin stock</span>
                        ) : (
                          <>
                            Stock: {product.stock ?? 0} {product.unit || ""}
                          </>
                        )}
                      </p>
                    </div>
                    <span className="ml-3 shrink-0 text-xs text-muted-foreground">
                      {formatPriceCompact(product.salePrice)}
                    </span>
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
