"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency, formatDate } from "@/lib/format-utils"
import type { CashRecord } from "@/lib/types"

interface CashOpenDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isSubmitting: boolean
  canSubmit: boolean
  latestClosed: CashRecord | null
  userLabel: string
  openingBalanceValue: number
  form: {
    date: string
    openingBalance: string
    notes: string
  }
  onFormChange: (form: { date: string; openingBalance: string; notes: string }) => void
  onSubmit: () => void
}

export function CashOpenDialog({
  open,
  onOpenChange,
  isSubmitting,
  canSubmit,
  latestClosed,
  userLabel,
  openingBalanceValue,
  form,
  onFormChange,
  onSubmit,
}: CashOpenDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-6 sm:p-7 pb-4 border-b">
          <DialogTitle className="text-xl">Apertura de Caja</DialogTitle>
          <DialogDescription>
            Registra el saldo inicial del turno. Solo puede existir una caja abierta al mismo
            tiempo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-7 py-5 space-y-5">
          <Card className="border-emerald-200 bg-emerald-50/60 dark:border-emerald-800/70 dark:bg-emerald-950/30">
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Ultimo cierre</p>
                  <p className="text-lg font-semibold text-emerald-900 dark:text-emerald-200">
                    {formatCurrency(latestClosed?.closingBalance || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {latestClosed ? formatDate(latestClosed.date) : "Sin cierres previos"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Responsable apertura</p>
                  <p className="text-sm font-medium text-foreground">{userLabel}</p>
                  <Badge
                    className="mt-1 border-emerald-300/80 bg-emerald-100 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200"
                    variant="outline"
                  >
                    Nueva jornada
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Fecha de apertura</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => onFormChange({ ...form, date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              {" "}
              <Label>Saldo inicial</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.openingBalance}
                onChange={(e) => onFormChange({ ...form, openingBalance: e.target.value })}
                onFocus={(e) => {
                  if (e.target.value === "0") {
                    e.target.value = ""
                    onFormChange({ ...form, openingBalance: "" })
                  }
                }}
              />
              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onFormChange({
                      ...form,
                      openingBalance: String(latestClosed?.closingBalance || 0),
                    })
                  }
                >
                  Usar ultimo saldo
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onFormChange({ ...form, openingBalance: "0" })}
                >
                  Iniciar en 0
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Saldo inicial confirmado</span>
              <strong>
                {Number.isNaN(openingBalanceValue) ? "-" : formatCurrency(openingBalanceValue)}
              </strong>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas de apertura</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => onFormChange({ ...form, notes: e.target.value })}
              placeholder="Ejemplo: fondo base validado"
            />
          </div>
        </div>

        <DialogFooter className="border-t p-4 sm:px-7 sm:py-5">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={!canSubmit}>
            {isSubmitting ? "Abriendo..." : "Confirmar apertura"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
