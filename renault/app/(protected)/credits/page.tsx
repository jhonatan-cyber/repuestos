"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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
import type { CreditRow } from "@/lib/credits-utils"
import {
  isOverdue,
  formatMoneyInput,
  parseMoneyInput,
  paymentMethodLabel,
  getRegisteredPaymentMethods,
  buildCreditPaymentTimeline,
  getCreditInitialDebt,
  getCreditInitialPayment,
} from "@/lib/credits-utils"
import { printCreditPaymentReceipt, exportCreditPaymentReceiptPdf } from "@/lib/export/credits"
import { CreditAccountsList } from "@/components/credits/credit-accounts-list"
import { ModulePagination } from "@/components/ui/module-pagination"

export default function CreditsPage() {
  const [rows, setRows] = useState<CreditRow[]>([])
  const [loading, setLoading] = useState(true)
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [methods, setMethods] = useState<Record<string, string>>({})
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"todos" | "pendientes" | "vencidos" | "pagados">("todos")
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRow, setSelectedRow] = useState<CreditRow | null>(null)
  const [previewData, setPreviewData] = useState<{ html: string; exportPdf: () => void } | null>(
    null,
  )

  const handlePrintReceipt = useCallback(
    (params: {
      row: CreditRow
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
        html: buildReceiptHtml({
          row: params.row,
          applied: params.applied,
          remaining: params.remaining,
          paymentMethod: params.paymentMethod,
          now,
          code,
          previousBalance,
          registeredMethods,
          footerText: "Este documento certifica el abono realizado a la cuenta por cobrar.",
        }),
        exportPdf: () => {
          printCreditPaymentReceipt({ ...params, pdfMode: true })
        },
      })
    },
    [],
  )

  async function load() {
    try {
      setLoading(true)
      const data = await apiClient<CreditRow[]>("/api/credits", { useCache: false })
      setRows(Array.isArray(data) ? data : [])
    } catch {
      toast.error("No se pudo cargar créditos")
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
          String(r.client?.name || "")
            .toLowerCase()
            .includes(q) ||
          String(r.sale?.id || "")
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
      await apiClient(`/api/credits/${id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, paymentMethod }),
      })
    } catch (error) {
      return toast.error(error instanceof Error ? error.message : "No se pudo registrar cobro")
    }

    toast.success("Cobro registrado")
    setAmounts((prev) => ({ ...prev, [id]: "" }))
    await load()
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Cuentas por cobrar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestiona las ventas a crédito y sus cobros
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
          <Label htmlFor="credit-search">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="credit-search"
              className="pl-10 pr-10"
              placeholder="Buscar por cliente o ID de venta..."
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
          <Label htmlFor="credit-status">Estado</Label>
          <Select
            value={filter}
            onValueChange={(v: "todos" | "pendientes" | "vencidos" | "pagados") => setFilter(v)}
          >
            <SelectTrigger id="credit-status" className="w-full sm:w-[180px]">
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
          <Label htmlFor="credit-page-size">Mostrar</Label>
          <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
            <SelectTrigger id="credit-page-size" className="w-full sm:w-[140px]">
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
          Sin créditos
        </div>
      ) : null}
      <CreditAccountsList
        rows={paginatedRows.map((row) => ({
          id: row.id,
          partyName: row.client?.name || "Cliente",
          reference: row.sale?.id?.slice(0, 8) || "-",
          total: row.sale?.total ?? row.total ?? 0,
          balance: row.balance || 0,
          overdue: isOverdue(row),
          record: row,
        }))}
        isLoading={loading}
        partyLabel="Cliente"
        referenceLabel="Venta"
        emptyMessage="Sin créditos"
        caption="Créditos de clientes"
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
          <caption className="sr-only">Créditos de clientes</caption>
          <thead>
            <tr className="border-b">
              <th scope="col" className="py-2 pr-4 text-left">
                Cliente
              </th>
              <th scope="col" className="py-2 pr-4 text-left">
                Venta
              </th>
              <th scope="col" className="py-2 pr-4 text-right">
                Total
              </th>
              <th scope="col" className="py-2 pr-4 text-right">
                Saldo
              </th>
              <th scope="col" className="py-2 pr-4 text-left">
                Estado
              </th>
              <th scope="col" className="py-2 text-left">
                Acciones
              </th>
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
                  <td className="py-2">{r.client?.name}</td>
                  <td className="py-2">{r.sale?.id?.slice(0, 8) || "-"}</td>
                  <td className="py-2 text-right">
                    {formatCurrency(r.sale?.total ?? r.total ?? 0)}
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
                            Cobrar
                          </Button>
                        </>
                      )}
                    </div>
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
            <DialogTitle className="text-lg sm:text-2xl">Detalle de cuenta por cobrar</DialogTitle>
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
                      <span className="font-semibold">Información de la venta</span>
                    </div>
                    <Separator className="mb-4" />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">ID de venta</span>
                        <span className="font-mono text-sm font-medium">
                          #
                          {String(selectedRow.sale?.id || "")
                            .slice(0, 8)
                            .toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Fecha de venta</span>
                        <span className="font-medium">
                          {selectedRow.sale?.date ? formatDate(selectedRow.sale.date) : "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Vendedor</span>
                        <span className="font-medium">
                          {selectedRow.sale?.seller?.firstName
                            ? `${selectedRow.sale.seller.firstName} ${selectedRow.sale.seller.lastName || ""}`
                            : "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Método de pago</span>
                        <span className="font-medium">
                          {paymentMethodLabel(selectedRow.sale?.paymentMethod)}
                        </span>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="rounded-full bg-primary/10 p-2 text-primary">
                        <ShoppingBag className="h-4 w-4" />
                      </div>
                      <span className="font-semibold">
                        Productos ({selectedRow.sale?.items?.length || 0})
                      </span>
                    </div>
                    <Separator className="mb-4" />
                    <div className="space-y-2">
                      {selectedRow.sale?.items?.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg border p-2.5 text-sm"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">
                              {item.product?.name || "Producto"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.product?.brand
                                ? `${item.product.brand} ${item.product.model || ""}`
                                : ""}
                            </p>
                          </div>
                          <div className="ml-3 text-right text-xs">
                            <p>
                              {item.quantity} × {formatCurrency(item.price)}
                            </p>
                            <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="rounded-full bg-primary/10 p-2 text-primary">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <span className="font-semibold">Cronología de pagos</span>
                    </div>
                    <Separator className="mb-4" />
                    {buildCreditPaymentTimeline(selectedRow).length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sin pagos registrados</p>
                    ) : (
                      <div className="space-y-3">
                        {buildCreditPaymentTimeline(selectedRow).map((payment, index) => (
                          <div key={payment.id || index} className="rounded-lg border p-3 text-sm">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="font-medium">
                                {paymentMethodLabel(payment.paymentMethod)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {payment.date ? formatDate(payment.date) : "-"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                Saldo anterior: {formatCurrency(payment.balanceBefore)}
                              </span>
                              <span className="font-medium text-green-600">
                                -{formatCurrency(payment.amount)}
                              </span>
                            </div>
                            <div className="mt-1 text-right text-xs text-muted-foreground">
                              Saldo actual: {formatCurrency(payment.balanceAfter)}
                            </div>
                            {payment.notes && (
                              <p className="mt-1 text-xs text-muted-foreground">{payment.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>

                <div className="space-y-4">
                  <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="rounded-full bg-primary/10 p-2 text-primary">
                        <User className="h-4 w-4" />
                      </div>
                      <span className="font-semibold">Cliente</span>
                    </div>
                    <Separator className="mb-4" />
                    <div className="space-y-2">
                      <p className="font-medium text-foreground">
                        {selectedRow.client?.name || "Cliente"}
                      </p>
                    </div>
                  </section>

                  <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="rounded-full bg-primary/10 p-2 text-primary">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <span className="font-semibold">Resumen financiero</span>
                    </div>
                    <Separator className="mb-4" />
                    <div className="space-y-3 text-sm">
                      <SummaryRow
                        label="Total de venta"
                        value={formatCurrency(selectedRow.sale?.total ?? selectedRow.total ?? 0)}
                      />
                      <SummaryRow
                        label="Deuda inicial"
                        value={formatCurrency(getCreditInitialDebt(selectedRow))}
                      />
                      <SummaryRow
                        label="Monto inicial abonado"
                        value={formatCurrency(getCreditInitialPayment(selectedRow))}
                      />
                      <Separator />
                      <SummaryRow
                        label="Total cobrado"
                        value={formatCurrency(
                          selectedRow.payments?.reduce((s, p) => s + (p.amount || 0), 0) || 0,
                        )}
                        valueClassName="font-medium text-green-600"
                      />
                      <Separator />
                      <SummaryRow
                        label="Saldo pendiente"
                        value={
                          selectedRow.balance <= 0
                            ? "Pagado"
                            : formatCurrency(selectedRow.balance || 0)
                        }
                        valueClassName={
                          selectedRow.balance <= 0
                            ? "font-semibold text-green-600"
                            : "font-semibold text-rose-600"
                        }
                      />
                      <SummaryRow
                        label="Fecha de vencimiento"
                        value={selectedRow.dueDate ? formatDate(selectedRow.dueDate) : "-"}
                      />
                      <SummaryRow
                        label="Estado"
                        value={
                          selectedRow.balance <= 0
                            ? "Pagado"
                            : isOverdue(selectedRow)
                              ? "Vencido"
                              : "Pendiente"
                        }
                        valueClassName={
                          selectedRow.balance <= 0
                            ? "text-green-600"
                            : isOverdue(selectedRow)
                              ? "text-rose-600"
                              : ""
                        }
                      />
                    </div>
                  </section>

                  <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="rounded-full bg-primary/10 p-2 text-primary">
                        <UserCheck className="h-4 w-4" />
                      </div>
                      <span className="font-semibold">Medios de pago</span>
                    </div>
                    <Separator className="mb-4" />
                    <PaymentMethodsList methods={getRegisteredPaymentMethods(selectedRow)} />
                  </section>
                </div>
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

function buildReceiptHtml(params: {
  row: CreditRow
  applied: number
  remaining: number
  paymentMethod: string
  now: Date
  code: string
  previousBalance: number
  registeredMethods: string[]
  footerText: string
}): string {
  const {
    row,
    applied,
    remaining,
    paymentMethod,
    now,
    code,
    previousBalance,
    registeredMethods,
    footerText,
  } = params
  const company = {
    name: "Renault Reluz",
    slogan: "Repuestos automotrices",
    address: "Av. Confital - Av. Blanco Galindo Km 14.5",
    city: "Quillacollo - Cochabamba",
    phone: "+591 63070278",
    nit: "000000",
  }

  return `
    <!doctype html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Recibo de cobro #${code}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 12mm; }
        .header { display: flex; justify-content: space-between; border-bottom: 3px solid #111; padding-bottom: 12px; margin-bottom: 18px; gap: 16px; }
        .logo-section { display: flex; align-items: center; gap: 16px; }
        .logo { width: 250px; height: 250px; object-fit: contain; }
        .company-info h1 { font-size: 24px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
        .company-info p { font-size: 13px; color: #444; }
        .receipt-info { text-align: right; }
        .receipt-info .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #555; }
        .receipt-info .code { font-size: 18px; font-weight: 700; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 12px; background: #f7f7f7; border: 1px solid #d9d9d9; margin-bottom: 18px; }
        .info-grid p { margin: 4px 0; }
        .summary-section { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 20px; }
        .terms { flex: 1; border: 1px solid #d9d9d9; padding: 12px; font-size: 12px; color: #444; }
        .terms h4 { color: #111; margin-bottom: 6px; font-weight: 700; }
        .totals { width: 86mm; border: 1px solid #d9d9d9; padding: 12px; }
        .row { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 6px; }
        .row.total { margin-top: 8px; padding-top: 8px; border-top: 2px solid #111; font-size: 16px; font-weight: 700; }
        .payment-list { margin-top: 18px; padding: 12px; background: #fff8e1; border: 1px solid #ffc107; }
        .payment-list p { margin-bottom: 6px; font-size: 12px; }
        .footer { border-top: 1px solid #bbb; padding-top: 10px; text-align: center; font-size: 12px; color: #444; margin-top: 18px; }
        .footer p { margin: 4px 0; }
        .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 36px; }
        .signature { text-align: center; }
        .signature-line { border-top: 1px solid #555; padding-top: 8px; font-size: 12px; margin-top: 8px; }
        @media print { @page { size: Letter portrait; margin: 12mm; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-section">
          <img src="${window.location.origin}/api/settings/logo" alt="Logo" class="logo" />
          <div class="company-info">
            <h1>${company.name}</h1>
            <p>${company.slogan}</p>
            <p>${company.address}</p>
            <p>${company.city}</p>
            <p>Tel: ${company.phone} | NIT: ${company.nit}</p>
          </div>
          <ModulePagination currentPage={currentPage} totalItems={filteredRows.length} pageSize={pageSize} itemLabel="cuentas" onPageChange={setCurrentPage} />
        </div>
        <div class="receipt-info">
          <p class="label">Recibo de cobro</p>
          <p class="code">#${code}</p>
        </div>
      </div>

      <div class="info-grid">
        <div>
          <p><strong>Cliente:</strong> ${row.client?.name || "Cliente"}</p>
          <p><strong>Venta:</strong> #${String(row.sale?.id || "-")
            .slice(0, 8)
            .toUpperCase()}</p>
          <p><strong>Fecha:</strong> ${now.toLocaleDateString("es-BO")}</p>
          <p><strong>Hora:</strong> ${now.toLocaleTimeString("es-BO")}</p>
          <p><strong>Tipo de venta:</strong> A crédito</p>
        </div>
        <div style="text-align:right">
          <p><strong>Total de venta:</strong> ${formatCurrency(row.sale?.total ?? row.total ?? 0)}</p>
          <p><strong>Monto inicial abonado:</strong> ${formatCurrency(getCreditInitialPayment(row))}</p>
          <p><strong>Saldo anterior:</strong> ${formatCurrency(previousBalance)}</p>
          <p><strong>Método del cobro:</strong> ${paymentMethodLabel(paymentMethod)}</p>
        </div>
      </div>

      <div class="summary-section">
        <div class="terms">
          <h4>Detalle del cobro</h4>
          <p>• Este comprobante registra un abono a una cuenta por cobrar.</p>
          <p>• Conservá este documento para cualquier consulta o conciliación.</p>
          <p>• Cliente: ${row.client?.name || "Cliente"}</p>
          <p>• Método aplicado: ${paymentMethodLabel(paymentMethod)}</p>
        </div>
        <div class="totals">
          <div class="row"><span>Deuda inicial</span><span>${formatCurrency(getCreditInitialDebt(row))}</span></div>
          <div class="row"><span>Monto cobrado</span><span>${formatCurrency(applied || 0)}</span></div>
          <div class="row"><span>Saldo restante</span><span>${formatCurrency(remaining || 0)}</span></div>
          <div class="row total"><span>Estado</span><span>${remaining <= 0 ? "Pagado" : "Pendiente"}</span></div>
        </div>
      </div>

      ${
        registeredMethods.length > 0
          ? `
      <div class="payment-list">
        <p><strong>Medios de pago registrados</strong></p>
        ${registeredMethods
          .map(
            (method) => `
          <p>• ${method}</p>
        `,
          )
          .join("")}
      </div>
      `
          : ""
      }

      <div class="footer">
        <p>${footerText}</p>
        <p>Este documento certifica el abono realizado a la cuenta por cobrar.</p>
      </div>

      <div class="signatures">
        <div class="signature">
          <div class="signature-line">Firma responsable de caja</div>
        </div>
        <div class="signature">
          <div class="signature-line">Recibí conforme</div>
        </div>
      </div>
    </body>
    </html>
  `
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

function SummaryRow({
  label,
  value,
  labelClassName,
  valueClassName,
}: {
  label: string
  value: string
  labelClassName?: string
  valueClassName?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={labelClassName || "text-muted-foreground"}>{label}</span>
      <span className={valueClassName || "font-medium text-foreground"}>{value}</span>
    </div>
  )
}
