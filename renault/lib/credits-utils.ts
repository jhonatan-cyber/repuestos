"use client"

export interface CreditRow {
  id: string
  total: number
  balance: number
  status: string
  dueDate: string
  client?: { name?: string | null }
  sale?: {
    id: string
    date?: string
    createdAt?: string
    subtotal?: number
    tax?: number
    discount?: number
    total?: number | null
    paymentMethod?: string
    paymentSplits?: string | null
    notes?: string | null
    status?: string
    seller?: { firstName?: string | null; lastName?: string | null }
    items?: Array<{
      quantity: number
      price: number
      subtotal: number
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

export type CreditPaymentTimelineItem = {
  id: string
  amount: number
  date?: string
  paymentMethod?: string
  reference?: string | null
  notes?: string | null
  balanceBefore: number
  balanceAfter: number
}

export function isOverdue(row: CreditRow): boolean {
  if ((row.balance || 0) <= 0) return false
  return new Date(row.dueDate).getTime() < Date.now()
}

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

export function parseMoneyInput(raw: string): number {
  const cleaned = raw.replace(/\s/g, "").replace(/\./g, "").replace(",", ".")
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

export function paymentMethodLabel(value?: string) {
  const key = String(value || "").toLowerCase()
  if (key === "mixto") return "Mixto"
  if (key === "transferencia") return "Transferencia"
  if (key === "qr") return "QR"
  if (key === "credito" || key === "crédito") return "Crédito"
  return "Efectivo"
}

export function getRegisteredPaymentMethods(row: CreditRow): string[] {
  const methods = new Set<string>()

  const baseMethod = String(row.sale?.paymentMethod || "").trim()
  if (
    baseMethod &&
    baseMethod.toLowerCase() !== "credito" &&
    baseMethod.toLowerCase() !== "crédito"
  ) {
    methods.add(paymentMethodLabel(baseMethod))
  }

  try {
    const splits = JSON.parse(row.sale?.paymentSplits || "[]")
    if (Array.isArray(splits)) {
      for (const split of splits) {
        const method = String(split?.method || "").trim()
        if (!method) continue
        if (method.toLowerCase() === "credito" || method.toLowerCase() === "crédito") continue
        methods.add(paymentMethodLabel(method))
      }
    }
  } catch {
    // Ignorar paymentSplits inválidos
  }

  for (const payment of row.payments || []) {
    const method = String(payment.paymentMethod || "").trim()
    if (!method) continue
    methods.add(paymentMethodLabel(method))
  }

  return Array.from(methods)
}

export function getCreditInitialDebt(row: CreditRow): number {
  return Number(row.total || 0)
}

export function getCreditInitialPayment(row: CreditRow): number {
  const saleTotal = Number(row.sale?.total ?? 0)
  const initialDebt = getCreditInitialDebt(row)
  return Math.max(saleTotal - initialDebt, 0)
}

export function buildCreditPaymentTimeline(row: CreditRow): CreditPaymentTimelineItem[] {
  const total = getCreditInitialDebt(row)
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
      return {
        ...payment,
        balanceBefore: before,
        balanceAfter: after,
      }
    })
    .reverse()
}
