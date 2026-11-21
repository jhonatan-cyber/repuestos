"use client"

export interface PurchaseCreditRow {
  id: string
  total: number
  balance: number
  status: string
  dueDate: string
  supplier?: { name?: string | null }
  purchase?: {
    id: string
    date?: string
    createdAt?: string
    subtotal?: number
    tax?: number
    total?: number
    paymentMethod?: string
    status?: string
    buyer?: { firstName?: string | null; lastName?: string | null }
    items?: Array<{
      quantity: number
      price: number
      product?: { name?: string | null; brand?: string | null; model?: string | null } | null
    }>
  }
  payments?: Array<{
    id: string
    amount: number
    date?: string
    paymentMethod?: string
    reference?: string | null
    notes?: string | null
  }>
}

export type PurchasePaymentTimelineItem = {
  id: string
  amount: number
  date?: string
  paymentMethod?: string
  reference?: string | null
  notes?: string | null
  balanceBefore: number
  balanceAfter: number
}

export function isOverdue(row: PurchaseCreditRow): boolean {
  if ((row.balance || 0) <= 0) return false
  return new Date(row.dueDate).getTime() < Date.now()
}

// ponytail: shared with credits-utils, duplicated to avoid cross-module dependency
export function formatMoneyInput(raw: string): string {
  const cleaned = raw
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
  const parsed = Number(cleaned)
  if (!Number.isFinite(parsed)) return ""
  return new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(parsed)
}

// ponytail: shared with credits-utils, duplicated to avoid cross-module dependency
export function parseMoneyInput(raw: string): number {
  const cleaned = raw.replace(/\s/g, "").replace(/\./g, "").replace(",", ".")
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

// ponytail: shared with credits-utils, duplicated to avoid cross-module dependency
export function paymentMethodLabel(value?: string) {
  const key = String(value || "").toLowerCase()
  if (key === "mixto") return "Mixto"
  if (key === "transferencia") return "Transferencia"
  if (key === "qr") return "QR"
  if (key === "credito" || key === "crédito") return "Crédito"
  return "Efectivo"
}

export function getRegisteredPaymentMethods(row: PurchaseCreditRow): string[] {
  const methods = new Set<string>()
  const baseMethod = String(row.purchase?.paymentMethod || "").trim()
  if (
    baseMethod &&
    baseMethod.toLowerCase() !== "credito" &&
    baseMethod.toLowerCase() !== "crédito"
  ) {
    methods.add(paymentMethodLabel(baseMethod))
  }
  for (const payment of row.payments || []) {
    const method = String(payment.paymentMethod || "").trim()
    if (!method) continue
    methods.add(paymentMethodLabel(method))
  }
  return Array.from(methods)
}

export function getPurchaseInitialDebt(row: PurchaseCreditRow): number {
  return Number(row.total || 0)
}

export function getPurchaseInitialPayment(row: PurchaseCreditRow): number {
  const purchaseTotal = Number(row.purchase?.total ?? 0)
  const initialDebt = getPurchaseInitialDebt(row)
  return Math.max(purchaseTotal - initialDebt, 0)
}

export function buildPurchasePaymentTimeline(
  row: PurchaseCreditRow,
): PurchasePaymentTimelineItem[] {
  const total = getPurchaseInitialDebt(row)
  const sorted = [...(row.payments || [])].sort(
    (a, b) => new Date(a.date || "").getTime() - new Date(b.date || "").getTime(),
  )
  let running = total
  return sorted
    .map((payment) => {
      const amount = Number(payment.amount || 0)
      const before = running
      const after = Math.max(before - amount, 0)
      running = after
      return { ...payment, balanceBefore: before, balanceAfter: after }
    })
    .reverse()
}
