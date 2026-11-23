"use client"

import type { Quotation } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/format-utils"
import { toast } from "@/lib/toast"
import { COMPANY_INFO, getDateString, loadImageAsDataUrl } from "./shared"

// ============================================
// EXPORTAR PDF DE COTIZACIÓN INDIVIDUAL
// ============================================
export function exportQuotationPDF(quotation: Quotation, filename?: string): void {
  void generateQuotationPdf(quotation, filename)
}

async function generateQuotationPdf(quotation: Quotation, filename?: string): Promise<void> {
  const { jsPDF } = await import("jspdf")
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
  })
  const logoDataUrl = await loadImageAsDataUrl("/api/settings/logo")
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 12
  const contentWidth = pageWidth - margin * 2
  const quotationCode = String(quotation.id).slice(0, 8).toUpperCase()
  const clientLabel =
    quotation.clientName || quotation.externalClientName || "Sin cliente registrado"
  const taxToUse = quotation.tax || 0
  let y = margin

  pdf.setDrawColor(17, 17, 17)
  pdf.setTextColor(17, 17, 17)

  if (logoDataUrl) {
    pdf.addImage(logoDataUrl, "PNG", margin, y, 34, 34)
  }

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(18)
  pdf.text(COMPANY_INFO.name, margin + 40, y + 9)
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(10)
  pdf.text(COMPANY_INFO.slogan, margin + 40, y + 15)
  pdf.text(COMPANY_INFO.address, margin + 40, y + 20)
  pdf.text(COMPANY_INFO.city, margin + 40, y + 24.5)
  pdf.text(`Tel: ${COMPANY_INFO.phone} | NIT: ${COMPANY_INFO.nit}`, margin + 40, y + 29)

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(11)
  pdf.text("Cotizacion comercial", pageWidth - margin, y + 10, {
    align: "right",
  })
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(18)
  pdf.text(`#${quotationCode}`, pageWidth - margin, y + 18, { align: "right" })

  y += 40
  pdf.setLineWidth(0.6)
  pdf.line(margin, y, pageWidth - margin, y)
  y += 6

  pdf.setFillColor(247, 247, 247)
  pdf.setDrawColor(217, 217, 217)
  pdf.roundedRect(margin, y, contentWidth, 26, 1.5, 1.5, "FD")

  const leftInfoX = margin + 4
  const rightInfoX = pageWidth / 2 + 2
  const infoY = y + 6
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(10)
  pdf.text(`Fecha: ${formatDate(quotation.date)}`, leftInfoX, infoY)
  pdf.text(`Valida hasta: ${formatDate(quotation.validUntil)}`, leftInfoX, infoY + 5)
  pdf.text(`Cliente: ${clientLabel}`, leftInfoX, infoY + 10)
  pdf.text(`Vendedor: ${quotation.sellerName || "Sin vendedor asignado"}`, rightInfoX, infoY)
  pdf.text(`Estado: ${quotation.status}`, rightInfoX, infoY + 5)
  pdf.text(`Codigo: #${quotationCode}`, rightInfoX, infoY + 10)

  y += 34

  const columns = [
    { label: "Producto", width: 88, align: "left" as const },
    { label: "Cant.", width: 24, align: "center" as const },
    { label: "Precio", width: 38, align: "right" as const },
    { label: "Subtotal", width: 40, align: "right" as const },
  ]
  const headerHeight = 8
  const lineHeight = 4
  const tableBottomMargin = 64

  const drawHeader = () => {
    let x = margin
    pdf.setDrawColor(175, 175, 175)
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(8.5)
    columns.forEach((column) => {
      pdf.rect(x, y, column.width, headerHeight, "S")
      pdf.text(column.label, x + column.width / 2, y + 5.2, {
        align: "center",
      })
      x += column.width
    })
    y += headerHeight
  }

  drawHeader()
  pdf.setFont("helvetica", "normal")

  quotation.items.forEach((item) => {
    const row = [
      item.productName || "Producto sin nombre",
      String(item.quantity),
      formatCurrency(item.price),
      formatCurrency(item.subtotal),
    ]

    const rowHeight = Math.max(
      8,
      ...row.map(
        (value, index) =>
          Math.max(1, pdf.splitTextToSize(String(value), columns[index].width - 3).length) *
            lineHeight +
          1,
      ),
    )

    if (y + rowHeight > pageHeight - tableBottomMargin) {
      pdf.addPage()
      y = margin
      if (logoDataUrl) {
        pdf.addImage(logoDataUrl, "PNG", margin, y, 20, 20)
      }
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(14)
      pdf.text(`Cotizacion #${quotationCode}`, pageWidth - margin, y + 7, {
        align: "right",
      })
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(10)
      pdf.text(clientLabel, pageWidth - margin, y + 12, { align: "right" })
      y += 24
      drawHeader()
      pdf.setFont("helvetica", "normal")
    }

    let x = margin
    pdf.setDrawColor(210, 210, 210)
    row.forEach((value, index) => {
      const column = columns[index]
      const lines = pdf.splitTextToSize(String(value), column.width - 3)
      pdf.rect(x, y, column.width, rowHeight)
      if (column.align === "center") {
        pdf.text(lines, x + column.width / 2, y + 4, { align: "center" })
      } else if (column.align === "right") {
        pdf.text(lines, x + column.width - 1.5, y + 4, { align: "right" })
      } else {
        pdf.text(lines, x + 1.5, y + 4)
      }
      x += column.width
    })
    y += rowHeight
  })

  y += 6
  if (y + 44 > pageHeight - 22) {
    pdf.addPage()
    y = margin
  }

  const termsWidth = 82
  const totalsWidth = contentWidth - termsWidth - 8
  pdf.setDrawColor(217, 217, 217)
  pdf.roundedRect(margin, y, termsWidth, 44, 1.5, 1.5, "S")
  pdf.roundedRect(margin + termsWidth + 8, y, totalsWidth, 44, 1.5, 1.5, "S")

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(9)
  pdf.text("Terminos y condiciones", margin + 4, y + 6)
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(8.5)
  const terms = [
    `Precios validos hasta ${formatDate(quotation.validUntil)}`,
    "Los precios no incluyen instalacion",
    "Sujeto a disponibilidad de stock",
    "Formas de pago: Efectivo, Transferencia y QR",
  ]
  let termsY = y + 12
  terms.forEach((term) => {
    pdf.text(`- ${term}`, margin + 4, termsY)
    termsY += 5
  })

  const totalsX = margin + termsWidth + 12
  let totalsY = y + 11
  const drawTotal = (
    label: string,
    value: string,
    emphasize = false,
    color?: [number, number, number],
  ) => {
    pdf.setFont("helvetica", emphasize ? "bold" : "normal")
    pdf.setFontSize(emphasize ? 12 : 9)
    if (color) pdf.setTextColor(color[0], color[1], color[2])
    pdf.text(label, totalsX, totalsY)
    pdf.text(value, totalsX + totalsWidth - 4, totalsY, { align: "right" })
    pdf.setTextColor(17, 17, 17)
    totalsY += emphasize ? 8 : 6.5
  }

  drawTotal("Subtotal", formatCurrency(quotation.subtotal))
  drawTotal("Impuesto", formatCurrency(taxToUse))
  if (quotation.discount > 0) {
    drawTotal("Descuento", `-${formatCurrency(quotation.discount)}`, false, [198, 40, 40])
  }
  drawTotal("Total", formatCurrency(quotation.total), true)

  y += 52
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(9)
  pdf.setTextColor(80, 80, 80)
  pdf.text("Gracias por su preferencia en Renault Reluz.", pageWidth / 2, y, {
    align: "center",
  })
  pdf.text("Esta cotizacion no representa un compromiso de compra.", pageWidth / 2, y + 4, {
    align: "center",
  })

  y += 14
  pdf.setTextColor(17, 17, 17)
  pdf.line(margin + 10, y + 8, margin + 72, y + 8)
  pdf.line(pageWidth - margin - 72, y + 8, pageWidth - margin - 10, y + 8)
  pdf.setFontSize(8.5)
  pdf.text("Firma asesor comercial", margin + 41, y + 12, { align: "center" })
  pdf.text("Aprobacion del cliente", pageWidth - margin - 41, y + 12, {
    align: "center",
  })

  pdf.save(filename || `cotizacion-${quotationCode}.pdf`)
  toast.success("Cotizacion exportada correctamente")
}

// ============================================
// REPORTE PDF DE COTIZACIONES
// ============================================
export function exportQuotationsPDF(
  quotations: Quotation[],
  options?: {
    search?: string
    status?: string
    startDate?: string
    endDate?: string
  },
  filename?: string,
): void {
  void generateQuotationsReportPdf(quotations, options, filename)
}

async function generateQuotationsReportPdf(
  quotations: Quotation[],
  options?: {
    search?: string
    status?: string
    startDate?: string
    endDate?: string
  },
  filename?: string,
): Promise<void> {
  if (quotations.length === 0) {
    toast.error("No hay cotizaciones para exportar")
    return
  }

  const totalAmount = quotations.reduce((sum, quotation) => sum + quotation.total, 0)
  const totalSubtotal = quotations.reduce((sum, quotation) => sum + quotation.subtotal, 0)
  const totalTax = quotations.reduce((sum, quotation) => sum + quotation.tax, 0)
  const totalDiscount = quotations.reduce((sum, quotation) => sum + quotation.discount, 0)
  const pendingCount = quotations.filter((q) => q.status === "pendiente").length
  const approvedCount = quotations.filter((q) => q.status === "aprobada").length
  const convertedCount = quotations.filter((q) => q.status === "convertida").length
  const rejectedCount = quotations.filter((q) => q.status === "rechazada").length

  const metaLines = [
    options?.startDate || options?.endDate
      ? `Rango: ${options?.startDate || "inicio"} - ${options?.endDate || "hoy"}`
      : "Sin filtro de fechas",
    options?.status && options.status !== "all" ? `Estado: ${options.status}` : "Todos los estados",
    options?.search ? `Filtro de texto: ${options.search}` : "Todas las cotizaciones registradas",
  ]

  const { generatePdfTable } = await import("./pdf-table")

  await generatePdfTable({
    title: "Reporte de Cotizaciones",
    subtitle: "Listado de cotizaciones filtradas",
    filename: filename || `cotizaciones-${getDateString()}.pdf`,
    metaLines,
    columns: [
      { label: "Codigo", width: 20, align: "center" },
      { label: "Fecha", width: 22, align: "center" },
      { label: "Cliente", width: 58, align: "left" },
      { label: "Vendedor", width: 42, align: "left" },
      { label: "Total", width: 24, align: "right" },
      { label: "Valida hasta", width: 24, align: "center" },
      { label: "Estado", width: 24, align: "center" },
    ],
    rows: quotations.map((quotation) => [
      quotation.id.toString().slice(0, 8).toUpperCase(),
      formatDate(quotation.date),
      quotation.clientName || quotation.externalClientName || "Cliente no registrado",
      quotation.sellerName || "-",
      formatCurrency(quotation.total),
      formatDate(quotation.validUntil),
      quotation.status,
    ]),
    kpis: [
      { label: "Total cotizado", value: formatCurrency(totalAmount) },
      { label: "Subtotal", value: formatCurrency(totalSubtotal) },
      { label: "Impuestos", value: formatCurrency(totalTax) },
      { label: "Descuentos", value: formatCurrency(totalDiscount) },
      { label: "Pendientes", value: String(pendingCount) },
      { label: "Aprobadas", value: String(approvedCount) },
      { label: "Convertidas", value: String(convertedCount) },
      { label: "Rechazadas", value: String(rejectedCount) },
    ],
    compactKpis: [
      { label: "Total cotizado", value: formatCurrency(totalAmount) },
      { label: "Pendientes", value: String(pendingCount) },
      { label: "Aprobadas", value: String(approvedCount) },
      { label: "Convertidas", value: String(convertedCount) },
    ],
    footerText: `Total cotizado: ${formatCurrency(totalAmount)} | Generado el ${new Date().toLocaleString("es-BO")}`,
  })
  toast.success("Reporte de cotizaciones exportado correctamente")
}
