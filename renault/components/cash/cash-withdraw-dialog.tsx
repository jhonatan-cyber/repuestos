"use client"

import { Button } from "@/components/ui/button"
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

interface CashWithdrawDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isSubmitting: boolean
  form: { amount: string; reason: string }
  onFormChange: (form: { amount: string; reason: string }) => void
  onSubmit: () => void
}

export function CashWithdrawDialog({
  open,
  onOpenChange,
  isSubmitting,
  form,
  onFormChange,
  onSubmit,
}: CashWithdrawDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden flex flex-col max-h-[85vh]">
        <DialogHeader className="p-6 sm:p-7 pb-4 border-b">
          <DialogTitle>Retiro de Caja</DialogTitle>
          <DialogDescription>
            Este retiro incrementara los egresos de la caja abierta.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-7 py-5">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Monto</Label>
              <Input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => onFormChange({ ...form, amount: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Motivo</Label>
              <Textarea
                value={form.reason}
                onChange={(e) => onFormChange({ ...form, reason: e.target.value })}
                placeholder="Describe el motivo"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="border-t p-4 sm:px-7 sm:py-5">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Registrando..." : "Registrar retiro"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
