"use client"

import { apiClient } from "@/lib/api-client"
import type { jsPDF as JsPDFType } from "jspdf"
import { formatDateLocal } from "@/lib/dates"

type JsPDF = JsPDFType

// Tipos de exportación
export type ExportFormat = "csv" | "excel" | "pdf"

// Datos de la empresa para exports
export const RECEIPT_CSS = `
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
`

// ponytail: Proxy pattern — COMPANY_INFO importers need zero changes.
// loadCompanyInfo() must be called once at app init (see SettingsLoader).
const COMPANY_INFO_DEFAULTS = {
  name: "Renault Reluz",
  slogan: "Repuestos automotrices",
  address: "Av. Confital - Av. Blanco Galindo Km 14.5",
  city: "Quillacollo - Cochabamba",
  phone: "+591 63070278",
  nit: "000000",
} as const

let _cachedCompanyInfo: typeof COMPANY_INFO_DEFAULTS | null = null

export async function loadCompanyInfo(): Promise<void> {
  _cachedCompanyInfo = null // reset before fetch to avoid stale cache on error
  try {
    const data = await apiClient<{
      companyName?: string
      companySlogan?: string
      companyAddress?: string
      companyCity?: string
      companyPhone?: string
      companyNit?: string
    }>("/api/settings/company")
    _cachedCompanyInfo = {
      name: (data.companyName ?? COMPANY_INFO_DEFAULTS.name) as typeof COMPANY_INFO_DEFAULTS.name,
      slogan: (data.companySlogan ??
        COMPANY_INFO_DEFAULTS.slogan) as typeof COMPANY_INFO_DEFAULTS.slogan,
      address: (data.companyAddress ??
        COMPANY_INFO_DEFAULTS.address) as typeof COMPANY_INFO_DEFAULTS.address,
      city: (data.companyCity ?? COMPANY_INFO_DEFAULTS.city) as typeof COMPANY_INFO_DEFAULTS.city,
      phone: (data.companyPhone ??
        COMPANY_INFO_DEFAULTS.phone) as typeof COMPANY_INFO_DEFAULTS.phone,
      nit: (data.companyNit ?? COMPANY_INFO_DEFAULTS.nit) as typeof COMPANY_INFO_DEFAULTS.nit,
    }
  } catch {
    /* _cachedCompanyInfo stays null → Proxy falls back to defaults */
  }
}

export const COMPANY_INFO = new Proxy(COMPANY_INFO_DEFAULTS, {
  get(_, prop) {
    return (_cachedCompanyInfo ?? COMPANY_INFO_DEFAULTS)[prop as keyof typeof COMPANY_INFO_DEFAULTS]
  },
})

type PdfAlign = "left" | "center" | "right"

export type PdfColumn = {
  label: string
  width: number
  align?: PdfAlign
}

export function getDateString(): string {
  return formatDateLocal(new Date())
}

export function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function loadImageAsDataUrl(src: string): Promise<string | null> {
  try {
    const response = await fetch(src)
    const blob = await response.blob()
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export async function getImageDataUrl(src: string | null): Promise<string | null> {
  if (!src) return null
  if (src.startsWith("data:image")) return src
  try {
    const resolved = src.startsWith("http") ? src : new URL(src, window.location.origin).toString()
    return await loadImageAsDataUrl(resolved)
  } catch {
    return null
  }
}

export async function htmlDocumentToPdf(
  html: string,
  filename: string,
  orientation: "portrait" | "landscape" = "portrait",
): Promise<void> {
  // Dynamic import: jspdf+html2canvas (~400KB) solo cuando se exporta, no en bundle inicial
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ])
  const iframe = document.createElement("iframe")
  iframe.style.position = "fixed"
  iframe.style.left = "-10000px"
  iframe.style.top = "0"
  iframe.style.width = "1200px"
  iframe.style.height = "1600px"
  iframe.style.border = "0"
  document.body.appendChild(iframe)

  try {
    const doc = iframe.contentDocument
    if (!doc) throw new Error("No se pudo inicializar el documento PDF")

    doc.open()
    doc.write(html)
    doc.close()

    if (doc.fonts?.ready) {
      await doc.fonts.ready
    }
    await new Promise((resolve) => window.setTimeout(resolve, 180))

    const target = doc.body
    const canvas = await html2canvas(target, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: target.scrollWidth,
      windowHeight: target.scrollHeight,
    })

    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format: orientation === "landscape" ? "a4" : "letter",
    })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pageWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    const imgData = canvas.toDataURL("image/png")

    let remainingHeight = imgHeight
    let position = 0

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
    remainingHeight -= pageHeight

    while (remainingHeight > 0) {
      position = remainingHeight - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      remainingHeight -= pageHeight
    }

    pdf.save(filename)
  } finally {
    iframe.remove()
  }
}

export function drawReportHeader(
  pdf: JsPDF,
  options: {
    title: string
    subtitle: string
    logoDataUrl?: string | null
    metaLines: string[]
    kpis?: Array<{ label: string; value: string }>
    compact?: boolean
  },
): number {
  const pageWidth = pdf.internal.pageSize.getWidth()
  const margin = 10
  let y = margin

  pdf.setDrawColor(17, 17, 17)
  pdf.setTextColor(17, 17, 17)

  if (options.logoDataUrl) {
    const logoSize = options.compact ? 18 : 26
    pdf.addImage(options.logoDataUrl, "PNG", margin, y, logoSize, logoSize)
  }

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(options.compact ? 16 : 18)
  pdf.text(COMPANY_INFO.name, margin + (options.logoDataUrl ? 30 : 0), y + 8)

  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(options.compact ? 9 : 10)
  pdf.text(COMPANY_INFO.slogan, margin + (options.logoDataUrl ? 30 : 0), y + 14)
  pdf.text(COMPANY_INFO.address, margin + (options.logoDataUrl ? 30 : 0), y + 19)
  pdf.text(
    `${COMPANY_INFO.city} | Tel: ${COMPANY_INFO.phone} | NIT: ${COMPANY_INFO.nit}`,
    margin + (options.logoDataUrl ? 30 : 0),
    y + 24,
  )

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(options.compact ? 11 : 12)
  pdf.text(options.title, pageWidth - margin, y + 8, { align: "right" })
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(9)
  pdf.text(options.subtitle, pageWidth - margin, y + 14, { align: "right" })
  options.metaLines.forEach((line, index) => {
    pdf.text(line, pageWidth - margin, y + 20 + index * 4.5, {
      align: "right",
    })
  })

  y += options.compact ? 32 : 36
  pdf.setLineWidth(0.6)
  pdf.line(margin, y, pageWidth - margin, y)
  y += 4

  if (options.kpis && options.kpis.length > 0 && !options.compact) {
    y = drawKpiRow(pdf, y, options.kpis)
  }

  return y + 2
}

function drawKpiRow(pdf: JsPDF, y: number, kpis: Array<{ label: string; value: string }>): number {
  const pageWidth = pdf.internal.pageSize.getWidth()
  const margin = 10
  const gap = 2
  const contentWidth = pageWidth - margin * 2
  const boxWidth = (contentWidth - gap * Math.max(0, kpis.length - 1)) / kpis.length
  const boxHeight = 16

  kpis.forEach((kpi, index) => {
    const x = margin + index * (boxWidth + gap)
    pdf.setDrawColor(217, 217, 217)
    pdf.setFillColor(index === 0 ? 245 : 250, index === 0 ? 245 : 250, index === 0 ? 245 : 250)
    pdf.roundedRect(x, y, boxWidth, boxHeight, 1.5, 1.5, "FD")
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(9)
    pdf.text(kpi.value, x + boxWidth / 2, y + 6.5, { align: "center" })
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(7)
    pdf.setTextColor(100, 100, 100)
    pdf.text(kpi.label.toUpperCase(), x + boxWidth / 2, y + 12.5, {
      align: "center",
    })
    pdf.setTextColor(17, 17, 17)
  })

  return y + boxHeight + 2
}

export function drawTextTable(
  pdf: JsPDF,
  columns: PdfColumn[],
  rows: string[][],
  startY: number,
  onPageBreak: () => number,
): number {
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 10
  const headerHeight = 8
  const lineHeight = 4
  let y = startY

  const drawTableHeader = () => {
    let x = margin
    pdf.setDrawColor(175, 175, 175)
    pdf.setTextColor(17, 17, 17)
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(8.5)
    columns.forEach((col) => {
      pdf.rect(x, y, col.width, headerHeight, "S")
      pdf.text(String(col.label), x + col.width / 2, y + 5.2, {
        align: "center",
      })
      x += col.width
    })
    y += headerHeight
  }

  drawTableHeader()

  rows.forEach((row) => {
    const rowHeight = Math.max(
      8,
      ...row.map(
        (cell, index) =>
          Math.max(1, pdf.splitTextToSize(String(cell), columns[index].width - 3).length) *
            lineHeight +
          1,
      ),
    )

    if (y + rowHeight > pageHeight - margin - 12) {
      pdf.addPage()
      y = onPageBreak()
      drawTableHeader()
    }

    let x = margin
    pdf.setDrawColor(210, 210, 210)
    row.forEach((cell, index) => {
      const col = columns[index]
      const value = String(cell)
      const lines = pdf.splitTextToSize(value, col.width - 3)
      pdf.rect(x, y, col.width, rowHeight)
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(8)

      if (col.align === "center") {
        pdf.text(lines, x + col.width / 2, y + 4, { align: "center" })
      } else if (col.align === "right") {
        pdf.text(lines, x + col.width - 1.5, y + 4, { align: "right" })
      } else {
        pdf.text(lines, x + 1.5, y + 4)
      }

      x += col.width
    })

    y += rowHeight
  })

  return y
}
