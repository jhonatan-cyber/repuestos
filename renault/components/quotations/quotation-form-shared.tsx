"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MinusCircle, PlusCircle, Trash2 } from "lucide-react"
import type { ReactNode } from "react"
import type { Product } from "@/lib/types"

export type FormMode = "cliente" | "proveedor"

export interface QuotationItemForm {
  productId: string
  quantity: number
}

export interface ItemDetail {
  item: QuotationItemForm
  product?: Product
  price: number
  subtotal: number
}

interface QuantityStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
}

export function QuantityStepper({ value, onChange, min = 1 }: QuantityStepperProps) {
  return (
    <div className="flex h-11 items-center gap-2 rounded-xl border bg-background px-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        <MinusCircle className="h-4 w-4" />
      </button>
      <Input
        type="number"
        min={min}
        className="w-full border-0 px-0 text-center shadow-none focus-visible:ring-0"
        value={value}
        onChange={(e) => onChange(Math.max(min, Number(e.target.value || min)))}
      />
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        <PlusCircle className="h-4 w-4" />
      </button>
    </div>
  )
}

interface ProductItemCardProps {
  index: number
  subtitle: string
  children: ReactNode
  onRemove: () => void
}

export function ProductItemCard({ index, subtitle, children, onRemove }: ProductItemCardProps) {
  return (
    <div className="rounded-2xl border bg-muted/20 p-4 transition-colors hover:bg-muted/30">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Producto {index + 1}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onRemove}
          className="shrink-0 rounded-full"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {children}
    </div>
  )
}

interface AddProductButtonProps {
  onClick: () => void
}

export function AddProductButton({ onClick }: AddProductButtonProps) {
  return (
    <div className="flex justify-center pt-5">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onClick}
        className="rounded-full px-5"
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Agregar producto
      </Button>
    </div>
  )
}
