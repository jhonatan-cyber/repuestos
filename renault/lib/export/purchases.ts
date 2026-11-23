"use client"

import type { Purchase } from "@/lib/types"
import { formatCurrency } from "@/lib/format-utils"
import { toast } from "@/lib/toast"
import { COMPANY_INFO, getDateString, htmlDocumentToPdf } from "./shared"

// ============================================
// EXPORTAR RECEIPT DE COMPRA
// ============================================
export async function exportPurchaseReceiptPDF(purchase: Purchase): Promise<void> {
  const purchaseCode = purchase.id.toString().slice(0, 8).toUpperCase()
  const paymentLabels: Record<string, string> = {
    efectivo: "Efectivo",
    transferencia: "Transferencia",
    qr: "QR",
  }

  const itemsRows = (purchase.items || [])
    .map(
      (item) => `
    <tr>
      <td style="padding:9px 8px;text-align:left;border-bottom:1px solid #ddd;">${item.productName || "-"}</td>
      <td style="padding:9px 8px;text-align:center;border-bottom:1px solid #ddd;">${item.quantity}</td>
      <td style="padding:9px 8px;text-align:right;border-bottom:1px solid #ddd;">${formatCurrency(item.price)}</td>
      <td style="padding:9px 8px;text-align:right;border-bottom:1px solid #ddd;font-weight:600;">${formatCurrency(item.quantity * item.price)}</td>
    </tr>
  `,
    )
    .join("")

  const html = `<!doctype html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Compra #${purchaseCode}</title>
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
        table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
        th { border-bottom: 2px solid #111; padding: 10px 8px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.03em; }
        th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: right; }
        td:nth-child(2), td:nth-child(3), td:nth-child(4) { text-align: right; }
        .summary-section { display: flex; justify-content: flex-end; margin-bottom: 20px; }
        .totals { width: 78mm; border: 1px solid #d9d9d9; padding: 12px; }
        .totals .row { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 6px; }
        .totals .row.total { margin-top: 8px; padding-top: 8px; border-top: 2px solid #111; font-size: 16px; font-weight: 700; }
        .footer { border-top: 1px solid #bbb; padding-top: 10px; text-align: center; font-size: 12px; color: #444; margin-top: 18px; }
        .footer p { margin: 4px 0; }
        @media print { @page { size: Letter portrait; margin: 12mm; } }
      </style>
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
          <p class="label">Comprobante de compra</p>
          <p class="code">#${purchaseCode}</p>
        </div>
      </div>

      <div class="info-grid">
        <div>
          <p><strong>Fecha:</strong> ${purchase.date}</p>
          <p><strong>Proveedor:</strong> ${purchase.supplierName || "—"}</p>
          <p><strong>Código:</strong> #${purchaseCode}</p>
        </div>
        <div style="text-align:right">
          <p><strong>Comprador:</strong> ${purchase.buyerName || "—"}</p>
          <p><strong>Estado:</strong> ${purchase.status}</p>
          <p><strong>Método de pago:</strong> ${paymentLabels[purchase.paymentMethod] || purchase.paymentMethod}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cant.</th>
            <th>P. Unitario</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div class="summary-section">
        <div class="totals">
          <div class="row">
            <span>Subtotal</span>
            <span>${formatCurrency(purchase.subtotal)}</span>
          </div>
          ${
            purchase.tax > 0
              ? `
          <div class="row">
            <span>Impuestos</span>
            <span>${formatCurrency(purchase.tax)}</span>
          </div>
          `
              : ""
          }
          <div class="row total">
            <span>Total</span>
            <span>${formatCurrency(purchase.total)}</span>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>Documento de registro de compra — ${COMPANY_INFO.name}</p>
        <p>Este comprobante certifica la adquisición de mercadería registrada en el sistema.</p>
      </div>
    </body>
    </html>`
  void htmlDocumentToPdf(html, `compra-${purchaseCode}.pdf`, "portrait")
    .then(() => toast.success("Recibo de compra exportado correctamente"))
    .catch((error) => {
      toast.error(
        `Error al exportar recibo: ${error instanceof Error ? error.message : "Error desconocido"}`,
      )
    })
}

// ============================================
// REPORTE PDF DE COMPRAS
// ============================================
export function exportPurchasesPDF(purchases: Purchase[], filename?: string): void {
  void generatePurchasesReportPdf(purchases, filename)
}

async function generatePurchasesReportPdf(purchases: Purchase[], filename?: string): Promise<void> {
  if (purchases.length === 0) {
    toast.error("No hay compras para exportar")
    return
  }

  const totalAmount = purchases.reduce((sum, purchase) => sum + purchase.total, 0)
  const totalSubtotal = purchases.reduce((sum, purchase) => sum + purchase.subtotal, 0)
  const totalTax = purchases.reduce((sum, purchase) => sum + purchase.tax, 0)

  const statusCounts = {
    recibida: purchases.filter((purchase) => purchase.status === "recibida").length,
    pendiente: purchases.filter((purchase) => purchase.status === "pendiente").length,
    cancelada: purchases.filter((purchase) => purchase.status === "cancelada").length,
  }

  const paymentLabels: Record<string, string> = {
    efectivo: "Efectivo",
    transferencia: "Transferencia",
    credito: "Crédito",
    qr: "QR",
  }

  const { generatePdfTable } = await import("./pdf-table")

  await generatePdfTable({
    title: "Reporte de Compras",
    subtitle: "Listado de compras registradas",
    filename: filename || `compras-${getDateString()}.pdf`,
    columns: [
      { label: "Código", width: 20, align: "center" },
      { label: "Fecha", width: 22, align: "center" },
      { label: "Proveedor", width: 65, align: "left" },
      { label: "Comprador", width: 42, align: "left" },
      { label: "Subtotal", width: 25, align: "right" },
      { label: "Impuesto", width: 25, align: "right" },
      { label: "Total", width: 25, align: "right" },
      { label: "Método", width: 28, align: "center" },
      { label: "Estado", width: 26, align: "center" },
    ],
    rows: purchases.map((purchase) => [
      purchase.id.toString().slice(0, 8).toUpperCase(),
      purchase.date.split("T")[0],
      purchase.supplierName || "Proveedor no registrado",
      purchase.buyerName || "-",
      formatCurrency(purchase.subtotal),
      formatCurrency(purchase.tax),
      formatCurrency(purchase.total),
      paymentLabels[purchase.paymentMethod] || purchase.paymentMethod,
      purchase.status,
    ]),
    kpis: [
      { label: "Total compras", value: formatCurrency(totalAmount) },
      { label: "Subtotal", value: formatCurrency(totalSubtotal) },
      { label: "Impuestos", value: formatCurrency(totalTax) },
      { label: "Recibidas", value: String(statusCounts.recibida) },
      { label: "Pendientes", value: String(statusCounts.pendiente) },
      { label: "Canceladas", value: String(statusCounts.cancelada) },
    ],
    footerText: `Total de compras: ${formatCurrency(totalAmount)} | Generado el ${new Date().toLocaleString("es-BO")}`,
  })
  toast.success("Reporte de compras exportado correctamente")
}
