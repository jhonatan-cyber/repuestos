"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Calendar, DollarSign, FileText, Hash, Receipt, Tags } from "lucide-react"
import type { Expense } from "@/lib/types"
import { formatDate } from "@/lib/format-utils"

interface ExpenseDetailsDialogProps {
  expense: Expense | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExpenseDetailsDialog({ expense, open, onOpenChange }: ExpenseDetailsDialogProps) {
  if (!expense) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[calc(100%-1rem)] overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b bg-muted/30 px-5 py-5 sm:px-7 sm:py-6">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <Receipt className="h-5 w-5" />
            Detalle del gasto
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Revisá la información completa del movimiento registrado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          <div className="rounded-2xl border bg-muted/20 p-4 sm:p-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">Monto total</p>
              {expense.category ? (
                <Badge variant="outline" className="text-xs">
                  {expense.category}
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  Sin categoría
                </Badge>
              )}
            </div>
            <p className="text-3xl font-bold tracking-tight text-emerald-600">
              {formatCurrency(expense.amount)}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-background p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Receipt className="h-3.5 w-3.5" />
                Nombre
              </div>
              <p className="text-base font-semibold">{expense.name}</p>
            </div>

            <div className="rounded-xl border bg-background p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5" />
                Monto
              </div>
              <p className="text-base font-semibold">{formatCurrency(expense.amount)}</p>
            </div>

            <div className="rounded-xl border bg-background p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Fecha
              </div>
              <p className="text-base font-medium">
                {formatDate(
                  typeof expense.date === "string" ? expense.date : expense.date.toISOString(),
                )}
              </p>
            </div>

            <div className="rounded-xl border bg-background p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Tags className="h-3.5 w-3.5" />
                Categoría
              </div>
              {expense.category ? (
                <Badge variant="outline" className="text-sm">
                  {expense.category}
                </Badge>
              ) : (
                <p className="text-sm text-muted-foreground">Sin categoría</p>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <FileText className="h-4 w-4" />
              Descripción
            </div>
            <p className="rounded-xl border bg-muted/40 p-4 text-sm leading-relaxed">
              {expense.description}
            </p>
          </div>

          <Separator />

          <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
            <p className="flex items-center gap-2">
              <Hash className="h-3.5 w-3.5" />
              ID: {expense.id}
            </p>
            <p className="flex items-center gap-2 sm:justify-end">
              <Calendar className="h-3.5 w-3.5" />
              Creado: {formatDate(expense.createdAt)}
            </p>
          </div>
        </div>

        <DialogFooter className="border-t bg-background px-5 py-4 sm:justify-center sm:px-7 sm:py-5">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
