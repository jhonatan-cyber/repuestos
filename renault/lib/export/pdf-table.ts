"use client"

import {
  drawReportHeader,
  drawTextTable,
  getDateString,
  loadImageAsDataUrl,
  type PdfColumn,
} from "./shared"

export type PdfTableConfig = {
  title: string
  subtitle: string
  orientation?: "portrait" | "landscape"
  format?: "a4" | "letter"
  columns: PdfColumn[]
  rows: string[][]
  kpis?: Array<{ label: string; value: string }>
  metaLines?: string[]
  compactKpis?: Array<{ label: string; value: string }>
  footerText?: string
  filename?: string
}

export async function generatePdfTable(config: PdfTableConfig): Promise<void> {
  const { jsPDF } = await import("jspdf")
  const pdf = new jsPDF({
    orientation: config.orientation ?? "landscape",
    unit: "mm",
    format: config.format ?? "a4",
  })
  const logoDataUrl = await loadImageAsDataUrl("/api/settings/logo")

  const startY = drawReportHeader(pdf, {
    title: config.title,
    subtitle: config.subtitle,
    logoDataUrl,
    metaLines: [
      `Fecha: ${new Date().toLocaleDateString("es-BO")}`,
      `${config.rows.length} registros`,
      ...(config.metaLines ?? []),
    ],
    kpis: config.kpis,
  })

  const endY = drawTextTable(pdf, config.columns, config.rows, startY, () =>
    drawReportHeader(pdf, {
      title: config.title,
      subtitle: config.subtitle,
      logoDataUrl,
      compact: true,
      metaLines: [
        `Fecha: ${new Date().toLocaleDateString("es-BO")}`,
        `${config.rows.length} registros`,
        ...(config.metaLines ?? []),
      ],
      kpis: config.compactKpis ?? config.kpis,
    }),
  )

  if (config.footerText) {
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(9)
    pdf.setTextColor(90, 90, 90)
    pdf.text(config.footerText, 148.5, Math.min(endY + 8, 202), { align: "center" })
  }

  pdf.save(config.filename ?? `reporte-${getDateString()}.pdf`)
}
