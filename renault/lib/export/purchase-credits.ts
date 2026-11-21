"use client"

import { toast } from "@/lib/toast"
import { loadImageAsDataUrl, RECEIPT_CSS, COMPANY_INFO } from "@/lib/export/shared"
import { formatCurrency, formatDate } from "@/lib/format-utils"
import type { PurchaseCreditRow } from "@/lib/purchase-credits-utils"
import {
  paymentMethodLabel,
  getRegisteredPaymentMethods,
  getPurchaseInitialDebt,
  getPurchaseInitialPayment,
} from "@/lib/purchase-credits-utils"

export async function printPurchasePaymentReceipt({
  row,
  applied,
  remaining,
  paymentMethod,
  paymentDate,
  receiptCode,
  pdfMode,
}: {
  row: PurchaseCreditRow
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
  const htmlContent = buildPurchasePaymentReceiptHtml({
    row,
    applied,
    remaining,
    paymentMethod,
    now,
    code,
    previousBalance,
    registeredMethods,
    footerText: "Este documento certifica el abono realizado a la cuenta por pagar.",
  })

  if (pdfMode) {
    const electronExporter = window.electron?.exportTicketPdf
    if (electronExporter) {
      const result = await electronExporter(htmlContent, `recibo-pago-${code}.pdf`)
      if (!result.success) {
        if (result.cancelled) return
        toast.error(result.error || "No se pudo exportar el PDF")
        return
      }
      toast.success(`PDF guardado en ${result.path || "Descargas"}`)
      return
    }

    await exportPurchasePaymentReceiptPdf({
      row,
      applied,
      remaining,
      paymentMethod,
      paymentDate: now,
      receiptCode: code,
    })
    toast.success("PDF descargado correctamente")
  }
}

export async function exportPurchasePaymentReceiptPdf({
  row,
  applied,
  remaining,
  paymentMethod,
  paymentDate,
  receiptCode,
}: {
  row: PurchaseCreditRow
  applied: number
  remaining: number
  paymentMethod: string
  paymentDate: Date
  receiptCode: string
}): Promise<void> {
  const { jsPDF } = await import("jspdf")
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" })
  const pageWidth = 215.9
  const margin = 12
  const contentWidth = pageWidth - margin * 2
  const code = receiptCode
  const logoDataUrl = await loadImageAsDataUrl("/api/settings/logo")
  let y = margin

  pdf.setDrawColor(17, 17, 17)
  pdf.setTextColor(17, 17, 17)
  pdf.setLineWidth(0.8)
  pdf.line(margin, y + 40, pageWidth - margin, y + 40)

  if (logoDataUrl) pdf.addImage(logoDataUrl, "PNG", margin, y + 2, 35, 35)

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(18)
  pdf.text(COMPANY_INFO.name, margin + 40, y + 10)
  const companyNameWidth = pdf.getTextWidth(COMPANY_INFO.name)

  pdf.setFontSize(10)
  pdf.text("JHOSEP", margin + 40 + companyNameWidth / 2, y + 15.5, { align: "center" })

  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(10)
  pdf.text(
    [
      COMPANY_INFO.slogan,
      COMPANY_INFO.address,
      COMPANY_INFO.city,
      `Tel: ${COMPANY_INFO.phone} | NIT: ${COMPANY_INFO.nit}`,
    ],
    margin + 40,
    y + 21,
  )

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(11)
  pdf.text("Recibo de pago", pageWidth - margin, y + 8, { align: "right" })
  pdf.setFontSize(14)
  pdf.text(`#${code}`, pageWidth - margin, y + 16, { align: "right" })

  y += 48

  pdf.setFillColor(247, 247, 247)
  pdf.setDrawColor(217, 217, 217)
  pdf.roundedRect(margin, y, contentWidth, 34, 1.5, 1.5, "FD")

  pdf.setFontSize(10)
  pdf.setFont("helvetica", "normal")
  pdf.text(`Proveedor: ${row.supplier?.name || "Proveedor"}`, margin + 3, y + 8)
  pdf.text(
    `Compra: #${String(row.purchase?.id || "-")
      .slice(0, 8)
      .toUpperCase()}`,
    margin + 3,
    y + 14,
  )
  pdf.text(`Fecha: ${formatDate(paymentDate)}`, margin + 3, y + 20)
  pdf.text(`Hora: ${paymentDate.toLocaleTimeString("es-BO")}`, margin + 3, y + 26)

  const rightX = pageWidth - margin - 3
  pdf.text(
    `Total de compra: ${formatCurrency(row.purchase?.total ?? row.total ?? 0)}`,
    rightX,
    y + 8,
    { align: "right" },
  )
  pdf.text(
    `Monto inicial pagado: ${formatCurrency(getPurchaseInitialPayment(row))}`,
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
  pdf.text(`Método del pago: ${paymentMethodLabel(paymentMethod)}`, rightX, y + 26, {
    align: "right",
  })

  y += 43

  const leftColX = margin + 3
  const rightColX = pageWidth / 2 + 6

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(11)
  pdf.text("Detalle del pago", leftColX, y)
  pdf.text("Resumen", rightColX, y)

  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(9)
  const leftLines = [
    `• Este comprobante registra un abono a una cuenta por pagar.`,
    `• Cliente: ${row.supplier?.name || "Proveedor"}`,
    `• Método aplicado: ${paymentMethodLabel(paymentMethod)}`,
  ]
  pdf.text(leftLines, leftColX, y + 6)

  const registerMethodsList = getRegisteredPaymentMethods(row)
  if (registerMethodsList.length > 0) {
    y += 8 + leftLines.length * 4
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(9)
    pdf.text("Medios de pago registrados:", leftColX, y)
    pdf.setFont("helvetica", "normal")
    registerMethodsList.forEach((m, i) => pdf.text(`• ${m}`, leftColX, y + 5 + i * 4))
  }

  // Right column: totals
  const totalY = y + 16
  const totalLines = [
    { label: "Deuda inicial", value: formatCurrency(getPurchaseInitialDebt(row)) },
    { label: "Monto pagado", value: formatCurrency(applied || 0) },
    { label: "Saldo restante", value: formatCurrency(remaining || 0) },
  ]

  totalLines.forEach((line, i) => {
    pdf.setFont("helvetica", i === 2 ? "bold" : "normal")
    pdf.setFontSize(i === 2 ? 11 : 9)
    pdf.text(line.label, rightColX, totalY + i * 5)
    pdf.text(line.value, pageWidth - margin, totalY + i * 5, { align: "right" })
  })

  // Separator line before state
  const stateY = totalY + totalLines.length * 5 + 2
  pdf.setDrawColor(0, 0, 0)
  pdf.setLineWidth(0.5)
  pdf.line(rightColX, stateY, pageWidth - margin, stateY)

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(12)
  pdf.text("Estado", rightColX, stateY + 6)
  pdf.text(remaining <= 0 ? "Pagado" : "Pendiente", pageWidth - margin, stateY + 6, {
    align: "right",
  })

  // Footer
  const footerY = 252
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(9)
  pdf.setTextColor(100)
  pdf.text(
    "Este documento certifica el abono realizado a la cuenta por pagar.",
    pageWidth / 2,
    footerY - 6,
    { align: "center" },
  )
  pdf.text(`Gracias por su pago en ${COMPANY_INFO.name}.`, pageWidth / 2, footerY, {
    align: "center",
  })

  // Signatures
  pdf.setDrawColor(100)
  pdf.line(margin + 10, footerY + 20, margin + 90, footerY + 20)
  pdf.line(pageWidth - margin - 90, footerY + 20, pageWidth - margin - 10, footerY + 20)
  pdf.setFontSize(9)
  pdf.text("Firma responsable de caja", margin + 48, footerY + 26, { align: "center" })
  pdf.text("Recibí conforme", pageWidth - margin - 48, footerY + 26, { align: "center" })

  pdf.save(`recibo-pago-${code}.pdf`)
}

export function buildPurchasePaymentReceiptHtml(params: {
  row: PurchaseCreditRow
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

  return `
    <!doctype html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Recibo de pago #${code}</title>
      <style>${RECEIPT_CSS}</style>
    </head>
    <body>
      <div class="header">
        <div class="logo-section">
          <img src="${window.location.origin}/api/settings/logo" alt="Logo" class="logo" />
          <div class="company-info">
            <h1>${COMPANY_INFO.name}</h1>
            <p class="owner">JHOSEP</p>
            <p>${COMPANY_INFO.slogan}</p>
            <p>${COMPANY_INFO.address}</p>
            <p>${COMPANY_INFO.city}</p>
            <p>Tel: ${COMPANY_INFO.phone} | NIT: ${COMPANY_INFO.nit}</p>
          </div>
        </div>
        <div class="receipt-info">
          <p class="label">Recibo de pago</p>
          <p class="code">#${code}</p>
        </div>
      </div>

      <div class="info-grid">
        <div>
          <p><strong>Proveedor:</strong> ${row.supplier?.name || "Proveedor"}</p>
          <p><strong>Compra:</strong> #${String(row.purchase?.id || "-")
            .slice(0, 8)
            .toUpperCase()}</p>
          <p><strong>Fecha:</strong> ${now.toLocaleDateString("es-BO")}</p>
          <p><strong>Hora:</strong> ${now.toLocaleTimeString("es-BO")}</p>
          <p><strong>Tipo de compra:</strong> A crédito</p>
        </div>
        <div style="text-align:right">
          <p><strong>Total de compra:</strong> ${formatCurrency(row.purchase?.total ?? row.total ?? 0)}</p>
          <p><strong>Monto inicial pagado:</strong> ${formatCurrency(getPurchaseInitialPayment(row))}</p>
          <p><strong>Saldo anterior:</strong> ${formatCurrency(previousBalance)}</p>
          <p><strong>Método del pago:</strong> ${paymentMethodLabel(paymentMethod)}</p>
        </div>
      </div>

      <div class="summary-section">
        <div class="terms">
          <h4>Detalle del pago</h4>
          <p>• Este comprobante registra un abono a una cuenta por pagar.</p>
          <p>• Conservá este documento para cualquier consulta o conciliación.</p>
          <p>• Proveedor: ${row.supplier?.name || "Proveedor"}</p>
          <p>• Método aplicado: ${paymentMethodLabel(paymentMethod)}</p>
        </div>
        <div class="totals">
          <div class="row"><span>Deuda inicial</span><span>${formatCurrency(getPurchaseInitialDebt(row))}</span></div>
          <div class="row"><span>Monto pagado</span><span>${formatCurrency(applied || 0)}</span></div>
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
        <p>Gracias por su pago en ${COMPANY_INFO.name}.</p>
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
