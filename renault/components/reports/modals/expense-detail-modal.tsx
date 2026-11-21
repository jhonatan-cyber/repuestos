"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { formatCurrency, formatDate } from "@/lib/format-utils"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface Expense {
  id: string | number
  date: string
  description: string
  category?: string
  responsibleName?: string
  amount: number
}

interface ExpenseDetailModalProps {
  expense: Expense | null
  allExpenses?: Expense[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

const COLORS = ["#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#10b981", "#3b82f6"]

function aggregateExpensesByCategory(expenses: Expense[]) {
  const map = new Map<string, number>()
  expenses.forEach((expense) => {
    const key = expense.category?.trim() || "Sin categoría"
    map.set(key, (map.get(key) || 0) + expense.amount)
  })
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export function ExpenseDetailModal({
  expense,
  allExpenses = [],
  open,
  onOpenChange,
}: ExpenseDetailModalProps) {
  if (!expense) return null

  const categoryData = aggregateExpensesByCategory(allExpenses)
  const hasChartData = categoryData.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles de Gasto #{expense.id}</DialogTitle>
          <DialogDescription>{formatDate(expense.date)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Info General */}
          <div className="rounded-lg border bg-muted p-4 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Descripción</p>
              <p className="font-semibold text-base">{expense.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Categoría</p>
                <p className="font-semibold">{expense.category || "Sin categoría"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Responsable</p>
                <p className="font-semibold">{expense.responsibleName || "Sin asignar"}</p>
              </div>
            </div>
          </div>

          {/* Pie Chart de Categorías */}
          {hasChartData && (
            <div className="rounded-lg border bg-muted p-4">
              <p className="text-xs font-semibold mb-3">Distribución por Categoría (Período)</p>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Monto */}
          <div className="rounded-lg border p-4 bg-rose-50 dark:bg-rose-950/30">
            <p className="text-xs text-muted-foreground mb-2">Monto</p>
            <p className="text-3xl font-bold text-rose-600">{formatCurrency(expense.amount)}</p>
          </div>

          {/* Detalles adicionales */}
          <div className="rounded-lg border bg-muted p-4">
            <p className="text-sm font-semibold mb-3">Información</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID:</span>
                <span className="font-mono">{expense.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fecha:</span>
                <span>{formatDate(expense.date)}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
