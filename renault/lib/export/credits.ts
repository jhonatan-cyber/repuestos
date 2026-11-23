"use client"

import { logger } from "@/lib/logger"
import { toast } from "@/lib/toast"
import { loadImageAsDataUrl, COMPANY_INFO, RECEIPT_CSS } from "@/lib/export/shared"
import { formatCurrency, formatDate } from "@/lib/format-utils"
import type { CreditRow } from "@/lib/credits-utils"
import {
  paymentMethodLabel,
  getRegisteredPaymentMethods,
  getCreditInitialDebt,
  getCreditInitialPayment,
} from "@/lib/credits-utils"

export async function printCreditPaymentReceipt({
  row,
  applied,
  remaining,
  paymentMethod,
  paymentDate,
  receiptCode,
  pdfMode,
}: {
  row: CreditRow
  applied: number
  remaining: number
  paymentMethod: string
  paymentDate?: string
  receiptCode?: string
  pdfMode?: boolean
}) {
  const code = String(receiptCode || row.id)
    .slice(0, 8)
    .toUpperCase()
  const now = paymentDate ? new Date(paymentDate) : new Date()
  const previousBalance = Math.max(Number(remaining || 0) + Number(applied || 0), 0)
  const registeredMethods = getRegisteredPaymentMethods(row)
  const htmlContent = buildCreditPaymentReceiptHtml({
    row,
    applied,
    remaining,
    paymentMethod,
    now,
    code,
    previousBalance,
    registeredMethods,
    footerText: "Este documento certifica el abono realizado a la cuenta por cobrar.",
  })

  if (pdfMode) {
    const electronExporter = window.electron?.exportTicketPdf
    if (electronExporter) {
      const result = await electronExporter(htmlContent, `recibo-cobro-${code}.pdf`)
      if (!result.success) {
        if (result.cancelled) return
        toast.error(result.error || "No se pudo exportar el PDF")
        return
      }

      toast.success(`PDF guardado en ${result.path || "Descargas"}`)
      return
    }

    await exportCreditPaymentReceiptPdf({
      row,
      applied,
      remaining,
      paymentMethod,
      paymentDate: now,
      receiptCode: code,
    })
    toast.success("PDF descargado correctamente")
    return
  }

  // Electron print preview via IPC
  if (window.electron?.printTicket) {
    try {
      const result = await window.electron.printTicket(htmlContent, "")
      if (!result.success) {
        toast.error(result.error || "Error al imprimir")
      }
    } catch (error) {
      logger.error("Error al imprimir recibo de cobro en Electron", {
        error: error instanceof Error ? error.message : error,
      })
      toast.error("No se pudo abrir la impresión")
    }
    return
  }

  // Browser fallback: open print preview window
  const printWindow = window.open("", "_blank", "width=820,height=900")
  if (!printWindow) {
    toast.error("El navegador bloqueó la ventana de impresión")
    return
  }

  printWindow.document.write(htmlContent)
  printWindow.document.close()
  printWindow.focus()

  const triggerPrint = () => {
    try {
      printWindow.focus()
      printWindow.print()
    } catch (error) {
      logger.error("Error al imprimir recibo de cobro", {
        error: error instanceof Error ? error.message : error,
      })
      toast.error("No se pudo abrir la impresión")
    }
  }

  if (printWindow.document.readyState === "complete") {
    window.setTimeout(triggerPrint, 100)
  } else {
    printWindow.onload = () => window.setTimeout(triggerPrint, 100)
  }

  printWindow.onafterprint = () => {
    printWindow.close()
  }
}

export async function exportCreditPaymentReceiptPdf({
  row,
  applied,
  remaining,
  paymentMethod,
  paymentDate,
  receiptCode,
}: {
  row: CreditRow
  applied: number
  remaining: number
  paymentMethod: string
  paymentDate: Date
  receiptCode: string
}): Promise<void> {
  const { jsPDF } = await import("jspdf")
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
  })

  const pageWidth = 215.9
  const margin = 12
  const contentWidth = pageWidth - margin * 2
  const code = receiptCode
  const logoDataUrl = await loadImageAsDataUrl("/api/settings/logo")
  const company = COMPANY_INFO

  let y = margin

  pdf.setDrawColor(17, 17, 17)
  pdf.setTextColor(17, 17, 17)

  pdf.setLineWidth(0.8)
  pdf.line(margin, y + 40, pageWidth - margin, y + 40)

  if (logoDataUrl) {
    pdf.addImage(logoDataUrl, "PNG", margin, y + 2, 35, 35)
  }

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(18)
  pdf.text(company.name, margin + 40, y + 10)

  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(10)
  const leftHeaderLines = [
    company.slogan,
    company.address,
    company.city,
    `Tel: ${company.phone} | NIT: ${company.nit}`,
  ]
  pdf.text(leftHeaderLines, margin + 40, y + 16)

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(11)
  pdf.text("Recibo de cobro", pageWidth - margin, y + 8, { align: "right" })
  pdf.setFontSize(14)
  pdf.text(`#${code}`, pageWidth - margin, y + 16, { align: "right" })

  y += 48

  pdf.setFillColor(247, 247, 247)
  pdf.setDrawColor(217, 217, 217)
  pdf.roundedRect(margin, y, contentWidth, 34, 1.5, 1.5, "FD")

  pdf.setFontSize(10)
  pdf.setFont("helvetica", "normal")
  pdf.text(`Cliente: ${row.client?.name || "Cliente"}`, margin + 3, y + 8)
  pdf.text(
    `Venta: #${String(row.sale?.id || "-")
      .slice(0, 8)
      .toUpperCase()}`,
    margin + 3,
    y + 14,
  )
  pdf.text(`Fecha: ${formatDate(paymentDate)}`, margin + 3, y + 20)
  pdf.text(`Hora: ${paymentDate.toLocaleTimeString("es-BO")}`, margin + 3, y + 26)

  const rightX = pageWidth - margin - 3
  pdf.text(`Total de venta: ${formatCurrency(row.sale?.total ?? row.total ?? 0)}`, rightX, y + 8, {
    align: "right",
  })
  pdf.text(
    `Monto inicial abonado: ${formatCurrency(getCreditInitialPayment(row))}`,
    rightX,
    y + 14,
    { align: "right" },
  )
  pdf.text(
    `Saldo anterior: ${formatCurrency(Math.max(Number(remaining || 0) + Number(applied || 0), 0))}`,
    rightX,
    y + 20,
    { align: "right" },
  )
  pdf.text(`Método del cobro: ${paymentMethodLabel(paymentMethod)}`, rightX, y + 26, {
    align: "right",
  })

  y += 43

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(11)
  pdf.text("Detalle del cobro", margin, y)

  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(9.5)
  const detailLines = [
    "Este comprobante registra un abono a una cuenta por cobrar.",
    "Conservá este documento para cualquier consulta o conciliación.",
    `Cliente: ${row.client?.name || "Cliente"}`,
    `Método aplicado: ${paymentMethodLabel(paymentMethod)}`,
  ]
  const wrappedDetails = detailLines.flatMap((line) =>
    pdf.splitTextToSize(`• ${line}`, contentWidth / 2 - 4),
  )
  const registeredMethodLines = getRegisteredPaymentMethods(row).map((method) => `• ${method}`)

  pdf.setDrawColor(217, 217, 217)
  pdf.roundedRect(margin, y + 4, contentWidth / 2 - 2, 42, 1.5, 1.5)
  pdf.roundedRect(margin + contentWidth / 2 + 2, y + 4, contentWidth / 2 - 2, 42, 1.5, 1.5)

  pdf.text(wrappedDetails.slice(0, 5), margin + 3, y + 10)

  pdf.setFont("helvetica", "bold")
  pdf.text("Medios de pago registrados", margin + contentWidth / 2 + 5, y + 10)
  pdf.setFont("helvetica", "normal")
  if (registeredMethodLines.length > 0) {
    pdf.text(registeredMethodLines.slice(0, 5), margin + contentWidth / 2 + 5, y + 16)
  } else {
    pdf.text("Sin pagos registrados", margin + contentWidth / 2 + 5, y + 16)
  }

  y += 52

  pdf.setDrawColor(217, 217, 217)
  pdf.roundedRect(margin, y, contentWidth, 38, 1.5, 1.5)
  const leftX = margin + 3
  const rightColumn = pageWidth - margin - 3
  const summaryRows = [
    ["Deuda inicial", formatCurrency(getCreditInitialDebt(row))],
    ["Monto cobrado", formatCurrency(applied || 0)],
    ["Saldo restante", formatCurrency(remaining || 0)],
    ["Estado", remaining <= 0 ? "Pagado" : "Pendiente"],
  ] as const

  pdf.setFontSize(10)
  summaryRows.forEach((entry, index) => {
    const rowY = y + 8 + index * 7
    pdf.setFont("helvetica", "normal")
    pdf.text(entry[0], leftX, rowY)
    pdf.setFont("helvetica", index === 3 ? "bold" : "normal")
    pdf.text(entry[1], rightColumn, rowY, { align: "right" })
  })

  y += 45

  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(9.5)
  const footerLines = [
    "Este documento certifica el abono realizado a la cuenta por cobrar.",
    "Gracias por su pago en Renault Reluz.",
  ]
  pdf.text(footerLines, pageWidth / 2, y, { align: "center" })

  pdf.setFontSize(9)
  pdf.line(margin + 20, 248, margin + 76, 248)
  pdf.line(pageWidth - margin - 76, 248, pageWidth - margin - 20, 248)
  pdf.text("Firma responsable de caja", margin + 48, 252, { align: "center" })
  pdf.text("Recibí conforme", pageWidth - margin - 48, 252, { align: "center" })

  pdf.save(`recibo-cobro-${code}.pdf`)
}

export function buildCreditPaymentReceiptHtml({
  row,
  applied,
  remaining,
  paymentMethod,
  now,
  code,
  previousBalance,
  registeredMethods,
  footerText,
}: {
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
  return `
    <!doctype html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Recibo de cobro #${code}</title>
      <style>${RECEIPT_CSS}</style>
    </head>
    <body>
      <div class="header">
        <div class="logo-section">
          <img src="${window.location.origin}/api/settings/logo" alt="Logo" class="logo" />
          <div class="company-info">
            <h1>${COMPANY_INFO.name}</h1>
            <p>${COMPANY_INFO.slogan}</p>
            <p>${COMPANY_INFO.address}</p>
            <p>${COMPANY_INFO.city}</p>
            <p>Tel: ${COMPANY_INFO.phone} | NIT: ${COMPANY_INFO.nit}</p>
          </div>
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
