"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api-client"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, formatDate } from "@/lib/format-utils"
import { PrintPreviewDialog } from "@/components/sales/print-preview-dialog"
import { toast } from "@/lib/toast"
import {
  Calendar,
  CreditCard,
  Eye,
  FileDown,
  Printer,
  Receipt,
  ShoppingBag,
  User,
  UserCheck,
  Search,
  X,
} from "lucide-react"
import type { PurchaseCreditRow } from "@/lib/purchase-credits-utils"
import {
  isOverdue,
  formatMoneyInput,
  parseMoneyInput,
  paymentMethodLabel,
  getRegisteredPaymentMethods,
  getPurchaseInitialDebt,
  getPurchaseInitialPayment,
  buildPurchasePaymentTimeline,
} from "@/lib/purchase-credits-utils"
import {
  printPurchasePaymentReceipt,
  buildPurchasePaymentReceiptHtml,
} from "@/lib/export/purchase-credits"
import { CreditAccountsList } from "@/components/credits/credit-accounts-list"
import { ModulePagination } from "@/components/ui/module-pagination"

export default function PurchaseCreditsPage() {
  const [rows, setRows] = useState<PurchaseCreditRow[]>([])
  const [loading, setLoading] = useState(true)
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [methods, setMethods] = useState<Record<string, string>>({})
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"todos" | "pendientes" | "vencidos" | "pagados">("todos")
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRow, setSelectedRow] = useState<PurchaseCreditRow | null>(null)
  const [previewData, setPreviewData] = useState<{ html: string; exportPdf: () => void } | null>(
    null,
  )

  const handlePrintReceipt = useCallback(
    (params: {
      row: PurchaseCreditRow
      applied: number
      remaining: number
      paymentMethod: string
      paymentDate?: string
      receiptCode?: string
    }) => {
      const code = String(params.receiptCode || params.row.id)
        .slice(0, 8)
        .toUpperCase()
      const now = params.paymentDate ? new Date(params.paymentDate) : new Date()
      const previousBalance = Math.max(
        Number(params.remaining || 0) + Number(params.applied || 0),
        0,
      )
      const registeredMethods = getRegisteredPaymentMethods(params.row)

      setPreviewData({
        html: buildPurchasePaymentReceiptHtml({
          row: params.row,
          applied: params.applied,
          remaining: params.remaining,
          paymentMethod: params.paymentMethod,
          now,
          code,
          previousBalance,
          registeredMethods,
          footerText: "Este documento certifica el abono realizado a la cuenta por pagar.",
        }),
        exportPdf: () => {
          printPurchasePaymentReceipt({ ...params, pdfMode: true })
        },
      })
    },
    [],
  )

  async function load() {
    try {
      setLoading(true)
      const data = await apiClient<PurchaseCreditRow[]>("/api/purchase-credits", {
        useCache: false,
      })
      setRows(Array.isArray(data) ? data : [])
    } catch {
      toast.error("No se pudo cargar deudas de compras")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const summary = useMemo(() => {
    const pending = rows.filter((r) => r.balance > 0 && !isOverdue(r))
    const overdue = rows.filter((r) => r.balance > 0 && isOverdue(r))
    const paid = rows.filter((r) => r.balance <= 0)
    return {
      totalDebt: rows.reduce((s, r) => s + (r.balance || 0), 0),
      pendingDebt: pending.reduce((s, r) => s + (r.balance || 0), 0),
      overdueDebt: overdue.reduce((s, r) => s + (r.balance || 0), 0),
      pendingCount: pending.length,
      overdueCount: overdue.length,
      paidCount: paid.length,
    }
  }, [rows])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows
      .filter((r) => {
        if (filter === "pendientes") return r.balance > 0 && !isOverdue(r)
        if (filter === "vencidos") return r.balance > 0 && isOverdue(r)
        if (filter === "pagados") return r.balance <= 0
        return true
      })
      .filter((r) => {
        if (!q) return true
        return (
          String(r.supplier?.name || "")
            .toLowerCase()
            .includes(q) ||
          String(r.purchase?.id || "")
            .toLowerCase()
            .includes(q)
        )
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  }, [rows, filter, search])

  useEffect(() => setCurrentPage(1), [search, filter, pageSize])
  const paginatedRows = useMemo(
    () => filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredRows, currentPage, pageSize],
  )

  async function pay(id: string) {
    const row = rows.find((r) => r.id === id)
    if (!row) return toast.error("No se encontró la cuenta seleccionada")
    const amount = parseMoneyInput(amounts[id] || "")
    const paymentMethod = methods[id] || "efectivo"
    if (amount <= 0) return toast.error("Monto inválido")

    try {
      await apiClient(`/api/purchase-credits/${id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, paymentMethod }),
      })
    } catch (error) {
      return toast.error(error instanceof Error ? error.message : "No se pudo registrar pago")
    }

    toast.success("Pago registrado")
    setAmounts((prev) => ({ ...prev, [id]: "" }))
    await load()
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Cuentas por pagar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestiona las compras a crédito y sus pagos
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
          <p className="text-xs font-medium text-muted-foreground">Saldo total</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(summary.totalDebt)}
          </p>
        </div>
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950/20">
          <p className="text-xs font-medium text-muted-foreground">Pendiente</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {formatCurrency(summary.pendingDebt)} · {summary.pendingCount} cuentas
          </p>
        </div>
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/20">
          <p className="text-xs font-medium text-muted-foreground">Vencido</p>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
            {formatCurrency(summary.overdueDebt)} · {summary.overdueCount} cuentas
          </p>
        </div>
      </div>

      <div className="module-filters flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1 space-y-2">
          <Label htmlFor="purchase-credit-search">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="purchase-credit-search"
              className="pl-10 pr-10"
              placeholder="Buscar por proveedor o ID de compra..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search ? (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="purchase-credit-status">Estado</Label>
          <Select
            value={filter}
            onValueChange={(v: "todos" | "pendientes" | "vencidos" | "pagados") => setFilter(v)}
          >
            <SelectTrigger id="purchase-credit-status" className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendientes">Pendientes</SelectItem>
              <SelectItem value="vencidos">Vencidos</SelectItem>
              <SelectItem value="pagados">Pagados</SelectItem>
              <SelectItem value="todos">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="purchase-credit-page-size">Mostrar</Label>
          <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
            <SelectTrigger id="purchase-credit-page-size" className="w-full sm:w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 por página</SelectItem>
              <SelectItem value="25">25 por página</SelectItem>
              <SelectItem value="50">50 por página</SelectItem>
              <SelectItem value="100">100 por página</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {!loading && filteredRows.length === 0 ? (
        <div role="status" className="module-empty hidden items-center justify-center md:flex">
          Sin deudas
        </div>
      ) : null}
      <CreditAccountsList
        rows={paginatedRows.map((row) => ({
          id: row.id,
          partyName: row.supplier?.name || "Proveedor",
          reference: row.purchase?.id?.slice(0, 8) || "-",
          total: row.purchase?.total ?? row.total ?? 0,
          balance: row.balance || 0,
          overdue: isOverdue(row),
          record: row,
        }))}
        isLoading={loading}
        partyLabel="Proveedor"
        referenceLabel="Compra"
        emptyMessage="Sin deudas"
        caption="Créditos de proveedores"
        mobileOnly
        renderActions={({ record }) => (
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={() => setSelectedRow(record)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
      />
      <div
        className={
          !loading && filteredRows.length === 0
            ? "hidden"
            : "module-table hidden overflow-x-auto md:block"
        }
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 pr-4 text-left">Proveedor</th>
              <th className="py-2 pr-4 text-left">Compra</th>
              <th className="py-2 pr-4 text-right">Total</th>
              <th className="py-2 pr-4 text-right">Saldo</th>
              <th className="py-2 pr-4 text-left">Estado</th>
              <th className="py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="py-4" colSpan={6}>
                  Cargando...
                </td>
              </tr>
            ) : (
              paginatedRows.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="py-2">{r.supplier?.name || "Proveedor"}</td>
                  <td className="py-2">{r.purchase?.id?.slice(0, 8) || "-"}</td>
                  <td className="py-2 text-right">
                    {formatCurrency(r.purchase?.total ?? r.total ?? 0)}
                  </td>
                  <td className="py-2 pr-4 text-right font-semibold">
                    {formatCurrency(r.balance || 0)}
                  </td>
                  <td className="py-2 pr-4">
                    <Badge
                      variant={
                        r.balance <= 0 ? "secondary" : isOverdue(r) ? "destructive" : "outline"
                      }
                    >
                      {r.balance <= 0 ? "Pagado" : isOverdue(r) ? "Vencido" : "Pendiente"}
                    </Badge>
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setSelectedRow(r)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {(r.balance || 0) > 0 && (
                        <>
                          <Select
                            value={methods[r.id] || "efectivo"}
                            onValueChange={(value) =>
                              setMethods((prev) => ({ ...prev, [r.id]: value }))
                            }
                          >
                            <SelectTrigger className="h-8 w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="efectivo">Efectivo</SelectItem>
                              <SelectItem value="transferencia">Transferencia</SelectItem>
                              <SelectItem value="qr">QR</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            className="h-8 w-28"
                            placeholder="Monto"
                            value={amounts[r.id] || ""}
                            onChange={(e) =>
                              setAmounts((prev) => ({
                                ...prev,
                                [r.id]: formatMoneyInput(e.target.value),
                              }))
                            }
                          />
                          <Button
                            size="sm"
                            onClick={() => pay(r.id)}
                            disabled={parseMoneyInput(amounts[r.id] || "") <= 0}
                          >
                            Pagar
                          </Button>
                        </>
                      )}
                    </div>
                    <ModulePagination
                      currentPage={currentPage}
                      totalItems={filteredRows.length}
                      pageSize={pageSize}
                      itemLabel="cuentas"
                      onPageChange={setCurrentPage}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selectedRow} onOpenChange={(open) => !open && setSelectedRow(null)}>
        <DialogContent className="flex h-[92vh] w-[calc(100vw-1rem)] !max-w-[calc(100vw-1rem)] flex-col overflow-hidden p-0 sm:h-[90vh] sm:w-[calc(100vw-2rem)] sm:!max-w-[calc(100vw-2rem)] lg:!max-w-6xl">
          <DialogHeader className="border-b bg-muted/30 px-4 py-3 pr-12 sm:px-6 sm:py-5 sm:pr-14">
            <DialogTitle className="text-lg sm:text-2xl">Detalle de cuenta por pagar</DialogTitle>
          </DialogHeader>
          {selectedRow && (
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:space-y-6 sm:px-6 sm:py-5">
              <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1.9fr)_360px]">
                <div className="space-y-6">
                  <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="rounded-full bg-primary/10 p-2 text-primary">
                        <Receipt className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold">Información general</h3>
                        <p className="text-sm text-muted-foreground">
                          Datos completos de la compra y la deuda.
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <InfoCard
                        icon={<User className="h-4 w-4" />}
                        label="Proveedor"
                        value={selectedRow.supplier?.name || "Proveedor"}
                      />
                      <InfoCard
                        icon={<UserCheck className="h-4 w-4" />}
                        label="Comprador"
                        value={
                          `${selectedRow.purchase?.buyer?.firstName || ""} ${selectedRow.purchase?.buyer?.lastName || ""}`.trim() ||
                          "Sin comprador"
                        }
                      />
                      <InfoCard
                        icon={<Calendar className="h-4 w-4" />}
                        label="Fecha de compra"
                        value={
                          selectedRow.purchase?.date ? formatDate(selectedRow.purchase.date) : "-"
                        }
                      />
                      <InfoCard
                        icon={<Calendar className="h-4 w-4" />}
                        label="Hora de compra"
                        value={
                          selectedRow.purchase?.date
                            ? new Date(selectedRow.purchase.date).toLocaleTimeString("es-BO")
                            : "-"
                        }
                      />
                      <InfoCard
                        icon={<Receipt className="h-4 w-4" />}
                        label="Tipo de compra"
                        value="A crédito"
                      />
                      <InfoCard
                        icon={<CreditCard className="h-4 w-4" />}
                        label="Método de compra"
                        value={paymentMethodLabel(selectedRow.purchase?.paymentMethod)}
                      />
                      <InfoCard
                        icon={<CreditCard className="h-4 w-4" />}
                        label="Medios de pago registrados"
                        value={
                          <PaymentMethodsList methods={getRegisteredPaymentMethods(selectedRow)} />
                        }
                      />
                      <InfoCard
                        icon={<Calendar className="h-4 w-4" />}
                        label="Vencimiento deuda"
                        value={formatDate(selectedRow.dueDate)}
                      />
                    </div>
                  </section>

                  <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="rounded-full bg-primary/10 p-2 text-primary">
                        <ShoppingBag className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold">Productos de la compra</h3>
                        <p className="text-sm text-muted-foreground">
                          Detalle completo de productos comprados.
                        </p>
                      </div>
                    </div>
                    <div className="hidden md:block">
                      <div className="grid min-0 grid-cols-[1fr_96px_140px_160px] gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <span>Producto</span>
                        <span className="text-right">Cant.</span>
                        <span className="text-right">Precio</span>
                        <span className="text-right">Subtotal</span>
                      </div>
                      <div className="divide-y">
                        {(selectedRow.purchase?.items || []).map((item, index) => (
                          <div
                            key={index}
                            className="grid min-0 grid-cols-[1fr_96px_140px_160px] gap-3 px-4 py-4 text-sm"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {item.product?.name || "Producto"}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {item.product?.brand || "-"} · {item.product?.model || "-"}
                              </p>
                            </div>
                            <span className="text-right text-muted-foreground">
                              {item.quantity}
                            </span>
                            <span className="text-right text-muted-foreground">
                              {formatCurrency(item.price || 0)}
                            </span>
                            <span className="text-right font-semibold">
                              {formatCurrency((item.price || 0) * (item.quantity || 0))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
                    <h3 className="mb-3 text-base font-semibold">Historial de pagos</h3>
                    {selectedRow.payments && selectedRow.payments.length > 0 ? (
                      <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border p-3">
                        {buildPurchasePaymentTimeline(selectedRow).map((p) => (
                          <div key={p.id} className="rounded-md border p-3">
                            <p className="font-medium">
                              {formatDate(p.date || "")} · {paymentMethodLabel(p.paymentMethod)} ·{" "}
                              {formatCurrency(p.amount || 0)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Saldo antes: {formatCurrency(p.balanceBefore)} · Saldo después:{" "}
                              {formatCurrency(p.balanceAfter)}
                            </p>
                            {(p.reference || p.notes) && (
                              <p className="text-xs text-muted-foreground">
                                {[p.reference, p.notes].filter(Boolean).join(" · ")}
                              </p>
                            )}
                            <div className="mt-2 flex items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handlePrintReceipt({
                                    row: selectedRow,
                                    applied: p.amount || 0,
                                    remaining: p.balanceAfter,
                                    paymentMethod: p.paymentMethod || "efectivo",
                                    paymentDate: p.date,
                                    receiptCode: p.id,
                                  })
                                }
                              >
                                <Printer className="mr-1 h-3.5 w-3.5" /> Imprimir recibo
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  printPurchasePaymentReceipt({
                                    row: selectedRow,
                                    applied: p.amount || 0,
                                    remaining: p.balanceAfter,
                                    paymentMethod: p.paymentMethod || "efectivo",
                                    paymentDate: p.date,
                                    receiptCode: p.id,
                                    pdfMode: true,
                                  })
                                }
                              >
                                <FileDown className="mr-1 h-3.5 w-3.5" /> Exportar PDF
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Sin pagos registrados</p>
                    )}
                  </section>
                </div>

                <aside className="space-y-6 xl:sticky xl:top-0 xl:self-start">
                  <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="rounded-full bg-primary/10 p-2 text-primary">
                        <Receipt className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold">Resumen comercial</h3>
                        <p className="text-sm text-muted-foreground">
                          Totales de la compra y cuenta.
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm">
                      <SummaryRow
                        label="Monto inicial pagado"
                        value={formatCurrency(getPurchaseInitialPayment(selectedRow))}
                      />
                      <SummaryRow
                        label="Subtotal"
                        value={formatCurrency(selectedRow.purchase?.subtotal ?? 0)}
                      />
                      <SummaryRow
                        label="Impuestos"
                        value={formatCurrency(selectedRow.purchase?.tax ?? 0)}
                      />
                      <SummaryRow
                        label="Deuda inicial"
                        value={formatCurrency(getPurchaseInitialDebt(selectedRow))}
                      />
                      <Separator />
                      <SummaryRow
                        label="Total compra"
                        value={formatCurrency(
                          selectedRow.purchase?.total ?? selectedRow.total ?? 0,
                        )}
                        valueClassName="text-lg font-bold text-primary"
                        labelClassName="font-semibold text-foreground"
                      />
                      <SummaryRow
                        label="Saldo deuda"
                        value={formatCurrency(selectedRow.balance || 0)}
                        valueClassName="text-base font-bold text-foreground"
                        labelClassName="font-semibold text-foreground"
                      />
                    </div>
                  </section>
                </aside>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PrintPreviewDialog
        open={!!previewData}
        onClose={() => setPreviewData(null)}
        htmlContent={previewData?.html}
        onExportPdf={previewData?.exportPdf}
      />
    </div>
  )
}

interface InfoCardProps {
  icon: ReactNode
  label: string
  value: ReactNode
}

function InfoCard({ icon, label, value }: InfoCardProps) {
  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <div className="text-primary">{icon}</div>
        <span className="font-medium">{label}</span>
      </div>
      <div className="font-semibold text-foreground">{value}</div>
    </div>
  )
}

function PaymentMethodsList({ methods }: { methods: string[] }) {
  if (methods.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin pagos registrados</p>
  }
  return (
    <div className="flex flex-wrap gap-2">
      {methods.map((method) => (
        <Badge key={method} variant="secondary" className="font-medium">
          {method}
        </Badge>
      ))}
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
    <div className="flex items-center justify-between gap-3">
      <span className={labelClassName || "text-muted-foreground"}>{label}</span>
      <span className={valueClassName || "font-medium text-foreground"}>{value}</span>
    </div>
  )
}
