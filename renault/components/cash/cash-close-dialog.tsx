"use client"

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
import { formatCurrency } from "@/lib/format-utils"
import type { CashRecord } from "@/lib/types"

interface CashCloseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isSubmitting: boolean
  selectedRecord: CashRecord | null
  closeSummary: {
    date: string
    openingBalance: number
    registeredCashIncome: number
    registeredCashExpenses: number
    paymentMethods: {
      efectivo: number
      transferencia: number
      credito: number
      qr: number
      otros: number
    }
    withdrawalsTotal: number
    expectedCashInBox: number
    expectedClosingBalance: number
  } | null
  form: { cashIncome: string; cashExpenses: string; notes: string }
  onFormChange: (form: { cashIncome: string; cashExpenses: string; notes: string }) => void
  onSubmit: () => void
}

export function CashCloseDialog({
  open,
  onOpenChange,
  isSubmitting,
  selectedRecord,
  closeSummary,
  form,
  onFormChange,
  onSubmit,
}: CashCloseDialogProps) {
  const projectedBalance =
    (selectedRecord?.openingBalance || closeSummary?.openingBalance || 0) +
    Number(form.cashIncome || 0) -
    Number(form.cashExpenses || 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden flex flex-col max-h-[85vh]">
        <DialogHeader className="p-6 sm:p-7 pb-4 border-b">
          <DialogTitle>Cerrar Caja</DialogTitle>
          <DialogDescription>
            Confirma ingresos y egresos para cerrar la caja actual.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-7 py-5">
          {closeSummary && (
            <Card className="mb-4 border-blue-200/70 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/20">
              <CardContent className="pt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Fecha de cierre</span>
                  <strong>{closeSummary.date}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Saldo inicial</span>
                  <strong>{formatCurrency(closeSummary.openingBalance)}</strong>
                </div>
                <div className="border-t pt-2">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    Dinero por metodo de pago (ventas del dia)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-center justify-between">
                      <span>Efectivo (entra a caja)</span>
                      <strong>{formatCurrency(closeSummary.paymentMethods.efectivo)}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Transferencia</span>
                      <strong>{formatCurrency(closeSummary.paymentMethods.transferencia)}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Credito</span>
                      <strong>{formatCurrency(closeSummary.paymentMethods.credito)}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>QR</span>
                      <strong>{formatCurrency(closeSummary.paymentMethods.qr)}</strong>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-muted-foreground">Retiros registrados</span>
                  <strong className="text-red-600">
                    -{formatCurrency(closeSummary.withdrawalsTotal)}
                  </strong>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Ingresos</Label>
              <Input
                type="number"
                step="0.01"
                value={form.cashIncome}
                onChange={(e) => onFormChange({ ...form, cashIncome: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Egresos</Label>
              <Input
                type="number"
                step="0.01"
                value={form.cashExpenses}
                onChange={(e) => onFormChange({ ...form, cashExpenses: e.target.value })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Notas de cierre</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => onFormChange({ ...form, notes: e.target.value })}
                placeholder="Detalle final"
              />
            </div>

            <Card className="md:col-span-2">
              <CardContent className="pt-4 text-sm">
                <div className="flex items-center justify-between">
                  <span>Saldo proyectado</span>
                  <strong>{formatCurrency(projectedBalance)}</strong>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Formula: Saldo inicial + Ingreso efectivo - Egresos.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="border-t p-4 sm:px-7 sm:py-5">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Cerrando..." : "Cerrar caja"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
