"use client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  Wallet,
  Calendar,
  User,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  Clock,
} from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/format-utils"
import type { CashRecord } from "@/lib/types"

interface CashDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: CashRecord | null
}

export function CashDetailsDialog({ open, onOpenChange, record }: CashDetailsDialogProps) {
  if (!record) return null

  const isOpen = record.status === "open"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden flex flex-col max-h-[85vh]">
        <DialogHeader className="border-b bg-elevated p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">Caja del {formatDate(record.date)}</DialogTitle>
                <DialogDescription>
                  {isOpen ? "Caja actualmente abierta" : "Caja cerrada"}
                </DialogDescription>
              </div>
            </div>
            <Badge variant={isOpen ? "default" : "secondary"} className="px-3 py-1">
              {isOpen ? "Abierta" : "Cerrada"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
          <div className="space-y-5">
            {/* Info general */}
            <section className="rounded-2xl border bg-elevated p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Receipt className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">Información general</h3>
                  <p className="text-xs text-muted-foreground">Datos del registro de caja.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <InfoItem
                  icon={<User className="h-4 w-4" />}
                  label="Responsable"
                  value={record.userName || "-"}
                />
                <InfoItem
                  icon={<Calendar className="h-4 w-4" />}
                  label="Fecha"
                  value={formatDate(record.date)}
                />
                {record.closedAt && (
                  <InfoItem
                    icon={<Clock className="h-4 w-4" />}
                    label="Cerrada el"
                    value={formatDate(record.closedAt)}
                  />
                )}
              </div>
            </section>

            {/* Resumen financiero */}
            <section className="rounded-2xl border bg-elevated p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <DollarSign className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">Resumen financiero</h3>
                  <p className="text-xs text-muted-foreground">Totales del período.</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <SummaryRow label="Saldo inicial" value={formatCurrency(record.openingBalance)} />
                <SummaryRow
                  label="Ingresos"
                  value={formatCurrency(record.cashIncome)}
                  valueClassName="text-emerald-600"
                />
                <SummaryRow
                  label="Egresos"
                  value={formatCurrency(record.cashExpenses)}
                  valueClassName="text-red-600"
                />
                <Separator />
                <SummaryRow
                  label="Saldo final"
                  value={formatCurrency(record.closingBalance)}
                  labelClassName="font-semibold"
                  valueClassName="text-lg font-bold text-primary"
                />
              </div>
            </section>

            {/* Notas */}
            {record.notes && (
              <section className="rounded-2xl border bg-elevated p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-semibold">Notas</h3>
                </div>
                <p className="whitespace-pre-line text-sm text-muted-foreground">{record.notes}</p>
              </section>
            )}

            {/* Retiros */}
            <section className="rounded-2xl border bg-elevated p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                  <TrendingDown className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">Retiros</h3>
                  <p className="text-xs text-muted-foreground">
                    {record.withdrawals?.length || 0} registrados.
                  </p>
                </div>
              </div>

              {!record.withdrawals || record.withdrawals.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin retiros registrados.</p>
              ) : (
                <div className="space-y-2">
                  {record.withdrawals.map((w) => (
                    <div
                      key={String(w.id)}
                      className="flex items-center justify-between rounded-xl border bg-background px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-red-600">-{formatCurrency(w.amount)}</p>
                        <p className="text-xs text-muted-foreground">{w.reason}</p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{formatDate(w.createdAt)}</p>
                        <p>Por: {w.userName || "-"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>

        <DialogFooter className="border-t p-4 sm:px-7 sm:py-5">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface InfoItemProps {
  icon: React.ReactNode
  label: string
  value: string
}

function InfoItem({ icon, label, value }: InfoItemProps) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="text-primary">{icon}</span>
        <span className="font-medium">{label}</span>
      </div>
      <p className="font-semibold text-foreground">{value}</p>
    </div>
  )
}

interface SummaryRowProps {
  label: string
  value: string
  labelClassName?: string
  valueClassName?: string
}

function SummaryRow({ label, value, labelClassName, valueClassName }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className={labelClassName || "text-muted-foreground"}>{label}</span>
      <span className={valueClassName || "font-medium text-foreground"}>{value}</span>
    </div>
  )
}
