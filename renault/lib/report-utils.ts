export interface ReportSaleItem {
  productId: string
  productName: string
  quantity: number
  price: number
  subtotal: number
}

export interface ReportPurchaseItem {
  productId: string
  productName: string
  quantity: number
  price: number
}

export interface ReportSale {
  id: string
  date: string
  clientName: string
  sellerName: string
  subtotal: number
  discount: number
  total: number
  items?: ReportSaleItem[]
  paymentMethod?: string
  status?: string
}

export interface ReportPurchase {
  id: string
  date: string
  supplierName: string
  buyerName: string
  supplierId: string
  buyerUserId: string
  subtotal: number
  tax: number
  total: number
  items: ReportPurchaseItem[]
  status: "pendiente" | "recibida" | "cancelada"
  createdAt: string
}

export interface ReportExpense {
  id: string | number
  date: string
  description: string
  category?: string
  responsibleName?: string
  amount: number
}

export type ExportDataOverride = {
  salesData?: ReportSale[]
  purchasesData?: ReportPurchase[]
  expensesData?: ReportExpense[]
}

export function normalizeDateToMs(value?: string): number {
  if (!value) return 0
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? 0 : time
}

export function dedupeByIdLatest<
  T extends { id: string | number; date?: string; createdAt?: string },
>(rows: T[]): T[] {
  const byId = new Map<string, T>()
  for (const row of rows) {
    const key = String(row.id)
    const existing = byId.get(key)
    if (!existing) {
      byId.set(key, row)
      continue
    }
    const rowTs = normalizeDateToMs(row.date) || normalizeDateToMs(row.createdAt)
    const existingTs = normalizeDateToMs(existing.date) || normalizeDateToMs(existing.createdAt)
    if (rowTs >= existingTs) byId.set(key, row)
  }
  return Array.from(byId.values()).sort((a, b) => {
    const aTs = normalizeDateToMs(a.date) || normalizeDateToMs(a.createdAt)
    const bTs = normalizeDateToMs(b.date) || normalizeDateToMs(b.createdAt)
    return bTs - aTs
  })
}

export function currentMonthStart() {
  const date = new Date()
  date.setDate(1)
  return toYMD(date)
}

export function today() {
  return toYMD(new Date())
}

export function toYMD(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: "BOB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value || 0)
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function downloadTextFile(content: string, filename: string, type: string) {
  downloadBlob(new Blob([content], { type }), filename)
}

export async function collectChartSnapshots(keys: Array<"trend" | "distribution" | "net">) {
  const { default: html2canvas } = await import("html2canvas")
  const chartImages: string[] = []

  for (const key of keys) {
    const containers = document.querySelectorAll<HTMLElement>(`[data-report-chart="${key}"]`)
    let target: HTMLElement | null = null

    for (const container of containers) {
      const rect = container.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        target = container
        break
      }
    }

    if (!target) continue

    const rect = target.getBoundingClientRect()
    const width = Math.max(320, Math.ceil(rect.width || target.clientWidth || 0))
    const height = Math.max(220, Math.ceil(rect.height || target.clientHeight || 0))

    const canvas = await html2canvas(target, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      logging: false,
      width,
      height,
      windowWidth: Math.max(width, window.innerWidth),
      windowHeight: Math.max(height, window.innerHeight),
      onclone: (clonedDocument) => {
        clonedDocument.documentElement.classList.remove("dark")
        clonedDocument.body.classList.remove("dark")
        clonedDocument.documentElement.style.colorScheme = "light"
        clonedDocument.body.style.colorScheme = "light"
      },
    })

    chartImages.push(canvas.toDataURL("image/png"))
  }

  return chartImages
}
