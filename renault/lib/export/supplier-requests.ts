"use client"

import type { SupplierRequestWithProducts } from "@/lib/types"
import { formatDate } from "@/lib/format-utils"
import { toast } from "@/lib/toast"
import { COMPANY_INFO, loadImageAsDataUrl } from "./shared"

const statusLabels: Record<string, string> = {
  pendiente: "Pendiente",
  enviado: "Enviado",
  recibido: "Recibido",
  respondido: "Respondido",
}

export function exportSupplierRequestPDF(
  request: SupplierRequestWithProducts,
  filename?: string,
): void {
  void generateSupplierRequestPdf(request, filename)
}

async function generateSupplierRequestPdf(
  request: SupplierRequestWithProducts,
  filename?: string,
): Promise<void> {
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
  const requestCode = String(request.id).slice(0, 8).toUpperCase()
  let y = margin

  pdf.setDrawColor(17, 17, 17)
  pdf.setTextColor(17, 17, 17)

  // Header with logo
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
  pdf.text("Solicitud de cotización", pageWidth - margin, y + 10, {
    align: "right",
  })
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(18)
  pdf.text(`#${requestCode}`, pageWidth - margin, y + 18, { align: "right" })

  y += 40
  pdf.setLineWidth(0.6)
  pdf.line(margin, y, pageWidth - margin, y)
  y += 6

  // Info box
  pdf.setFillColor(247, 247, 247)
  pdf.setDrawColor(217, 217, 217)
  pdf.roundedRect(margin, y, contentWidth, 20, 1.5, 1.5, "FD")

  const leftInfoX = margin + 4
  const rightInfoX = pageWidth / 2 + 2
  const infoY = y + 6
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(10)
  pdf.text(`Fecha: ${formatDate(request.sentAt)}`, leftInfoX, infoY)
  pdf.text(`Proveedor: ${request.supplierName || "—"}`, leftInfoX, infoY + 5)
  pdf.text(`Estado: ${statusLabels[request.status] ?? request.status}`, rightInfoX, infoY)
  pdf.text(`Productos: ${request.products.length}`, rightInfoX, infoY + 5)

  y += 28

  // Products table
  const columns: Array<{ label: string; width: number; align: "left" | "center" | "right" }> = [
    { label: "Imagen", width: 18, align: "center" },
    { label: "Código", width: 24, align: "left" },
    { label: "Producto", width: 55, align: "left" },
    { label: "Descripción", width: 75, align: "left" },
    { label: "Cant.", width: 20, align: "center" },
  ]
  const headerHeight = 8
  const lineHeight = 4
  const tableBottomMargin = 44

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

  request.products.forEach((product) => {
    const textColumns = columns.slice(1)
    const textValues = [
      product.code,
      product.name,
      product.description || "—",
      String(product.quantity),
    ]

    const rowHeight = Math.max(
      18,
      ...textValues.map(
        (value, i) =>
          Math.max(1, pdf.splitTextToSize(String(value), textColumns[i].width - 3).length) *
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
      pdf.text(`Solicitud #${requestCode}`, pageWidth - margin, y + 7, {
        align: "right",
      })
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(10)
      pdf.text(request.supplierName || "", pageWidth - margin, y + 12, {
        align: "right",
      })
      y += 24
      drawHeader()
      pdf.setFont("helvetica", "normal")
    }

    let x = margin
    pdf.setDrawColor(210, 210, 210)

    // Image column
    pdf.rect(x, y, columns[0].width, rowHeight)
    if (product.image) {
      try {
        pdf.addImage(product.image, "JPEG", x + 1, y + 1, columns[0].width - 2, rowHeight - 2)
      } catch {
        try {
          pdf.addImage(product.image, "PNG", x + 1, y + 1, columns[0].width - 2, rowHeight - 2)
        } catch {
          // ignore image errors
        }
      }
    }
    x += columns[0].width

    // Text columns
    textValues.forEach((value, index) => {
      const column = textColumns[index]
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

  // Notes section
  if (request.notes) {
    y += 6
    if (y + 20 > pageHeight - 14) {
      pdf.addPage()
      y = margin
    }
    pdf.setDrawColor(217, 217, 217)
    pdf.roundedRect(margin, y, contentWidth, 20, 1.5, 1.5, "S")
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(9)
    pdf.text("Notas para el proveedor", margin + 4, y + 6)
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(8.5)
    pdf.text(request.notes, margin + 4, y + 12, { maxWidth: contentWidth - 8 })
    y += 26
  }

  pdf.save(filename || `solicitud-proveedor-${requestCode}.pdf`)
  toast.success("Solicitud exportada correctamente")
}
