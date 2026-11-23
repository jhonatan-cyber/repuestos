"use client"

import type { Sale } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/format-utils"
import { toast } from "@/lib/toast"
import { COMPANY_INFO, downloadBlob, getDateString, htmlDocumentToPdf } from "./shared"

// ============================================
// EXPORTAR CSV
// ============================================
export function exportSalesCSV(sales: Sale[], filename?: string): void {
  if (sales.length === 0) {
    toast.error("No hay datos para exportar")
    return
  }

  const headers = [
    "Código",
    "Fecha",
    "Hora",
    "Cliente",
    "Vendedor",
    "Subtotal",
    "Impuesto",
    "Descuento",
    "Total",
    "Método Pago",
    "Estado",
  ]

  const rows = sales.map((sale) => {
    const dateParts = sale.date.split("T")
    return [
      sale.id.toString().slice(0, 8).toUpperCase(),
      dateParts[0] || sale.date,
      dateParts[1]?.slice(0, 5) || "",
      sale.clientName || "Cliente no registrado",
      sale.sellerName,
      sale.subtotal.toFixed(2),
      sale.tax.toFixed(2),
      sale.discount.toFixed(2),
      sale.total.toFixed(2),
      sale.paymentMethod,
      sale.status,
    ]
  })

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n")

  downloadBlob(csvContent, filename || `ventas-${getDateString()}.csv`, "text/csv;charset=utf-8;")
  toast.success(`${sales.length} ventas exportadas en CSV`)
}

// ============================================
// EXPORTAR CSV CON DETALLE DE ITEMS
// ============================================
export function exportSalesCSVWithItems(sales: Sale[], filename?: string): void {
  if (sales.length === 0) {
    toast.error("No hay datos para exportar")
    return
  }

  const headers = [
    "Código Venta",
    "Fecha",
    "Cliente",
    "Vendedor",
    "Producto",
    "Cantidad",
    "Precio Unit.",
    "Subtotal Item",
    "Subtotal Venta",
    "Impuesto",
    "Descuento",
    "Total Venta",
    "Método Pago",
    "Estado",
  ]

  const rows: string[][] = []

  sales.forEach((sale) => {
    const dateStr = sale.date.split("T")[0]

    if (sale.items && sale.items.length > 0) {
      sale.items.forEach((item, index) => {
        rows.push([
          sale.id.toString().slice(0, 8).toUpperCase(),
          dateStr,
          sale.clientName || "Cliente no registrado",
          sale.sellerName || "",
          item.productName || "Producto sin nombre",
          item.quantity.toString(),
          item.price.toFixed(2),
          item.subtotal.toFixed(2),
          index === 0 ? sale.subtotal.toFixed(2) : "",
          index === 0 ? sale.tax.toFixed(2) : "",
          index === 0 ? sale.discount.toFixed(2) : "",
          index === 0 ? sale.total.toFixed(2) : "",
          index === 0 ? sale.paymentMethod : "",
          index === 0 ? sale.status : "",
        ])
      })
    } else {
      rows.push([
        sale.id.toString().slice(0, 8).toUpperCase(),
        dateStr,
        sale.clientName || "Cliente no registrado",
        sale.sellerName || "",
        "Sin items",
        "0",
        "0.00",
        "0.00",
        sale.subtotal.toFixed(2),
        sale.tax.toFixed(2),
        sale.discount.toFixed(2),
        sale.total.toFixed(2),
        sale.paymentMethod,
        sale.status,
      ])
    }
  })

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n")

  downloadBlob(
    csvContent,
    filename || `ventas-detalle-${getDateString()}.csv`,
    "text/csv;charset=utf-8;",
  )
  toast.success(`${sales.length} ventas con detalle exportadas`)
}

// ============================================
// EXPORTAR EXCEL CON HOJAS MÚLTIPLES
// ============================================
export function exportSalesExcel(sales: Sale[], filename?: string): void {
  if (sales.length === 0) {
    toast.error("No hay datos para exportar")
    return
  }

  const html = buildExcelHTML(sales)
  downloadBlob(html, filename || `ventas-${getDateString()}.xls`, "application/vnd.ms-excel")
  toast.success(`${sales.length} ventas exportadas en Excel`)
}

function buildExcelHTML(sales: Sale[]): string {
  const totalAmount = sales.reduce((sum, s) => sum + s.total, 0)
  const totalSubtotal = sales.reduce((sum, s) => sum + s.subtotal, 0)
  const totalTax = sales.reduce((sum, s) => sum + s.tax, 0)
  const totalDiscount = sales.reduce((sum, s) => sum + s.discount, 0)

  const summaryRows = sales
    .map((sale) => {
      const dateStr = sale.date.split("T")[0]
      return `
      <tr>
        <td>${sale.id.toString().slice(0, 8).toUpperCase()}</td>
        <td>${dateStr}</td>
        <td>${sale.clientName || "Cliente no registrado"}</td>
        <td>${sale.sellerName}</td>
        <td style="text-align:right">${sale.subtotal.toFixed(2)}</td>
        <td style="text-align:right">${sale.tax.toFixed(2)}</td>
        <td style="text-align:right">${sale.discount.toFixed(2)}</td>
        <td style="text-align:right;font-weight:bold">${sale.total.toFixed(2)}</td>
        <td>${sale.paymentMethod}</td>
        <td>${sale.status}</td>
      </tr>
    `
    })
    .join("")

  // Items detallado
  const itemsRows = sales
    .flatMap((sale) => {
      const dateStr = sale.date.split("T")[0]
      return (sale.items || []).map(
        (item, idx) => `
      <tr>
        ${idx === 0 ? `<td rowspan="${sale.items?.length || 1}">${sale.id.toString().slice(0, 8).toUpperCase()}</td>` : ""}
        ${idx === 0 ? `<td rowspan="${sale.items?.length || 1}">${dateStr}</td>` : ""}
        ${idx === 0 ? `<td rowspan="${sale.items?.length || 1}">${sale.clientName || "Cliente no registrado"}</td>` : ""}
        <td>${item.productName || "Sin nombre"}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">${item.price.toFixed(2)}</td>
        <td style="text-align:right">${item.subtotal.toFixed(2)}</td>
      </tr>
    `,
      )
    })
    .join("")

  return `
    <?xml version="1.0" encoding="UTF-8"?>
    <?mso-application progid="Excel.Sheet"?>
    <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet">
      <Styles>
        <Style ss:ID="Header">
          <Font ss:Bold="1" />
          <Interior ss:Color="#E0E0E0" ss:Pattern="Solid" />
        </Style>
        <Style ss:ID="Title">
          <Font ss:Bold="1" ss:Size="16" />
        </Style>
        <Style ss:ID="Total">
          <Font ss:Bold="1" />
          <Interior ss:Color="#F0F0F0" ss:Pattern="Solid" />
        </Style>
      </Styles>
      <Worksheet ss:Name="Resumen">
        <Table>
          <Row>
            <Cell><Data ss:Type="String">${COMPANY_INFO.name}</Data></Cell>
          </Row>
          <Row>
            <Cell><Data ss:Type="String">Reporte de Ventas - ${getDateString()}</Data></Cell>
          </Row>
          <Row>
            <Cell><Data ss:Type="String">${COMPANY_INFO.address}</Data></Cell>
          </Row>
          <Row>
            <Cell><Data ss:Type="String">${COMPANY_INFO.city}</Data></Cell>
          </Row>
          <Row><Cell></Cell></Row>
          <Row class="Header">
            <Cell><Data ss:Type="String">Código</Data></Cell>
            <Cell><Data ss:Type="String">Fecha</Data></Cell>
            <Cell><Data ss:Type="String">Cliente</Data></Cell>
            <Cell><Data ss:Type="String">Vendedor</Data></Cell>
            <Cell><Data ss:Type="String">Subtotal</Data></Cell>
            <Cell><Data ss:Type="String">Impuesto</Data></Cell>
            <Cell><Data ss:Type="String">Descuento</Data></Cell>
            <Cell><Data ss:Type="String">Total</Data></Cell>
            <Cell><Data ss:Type="String">Método</Data></Cell>
            <Cell><Data ss:Type="String">Estado</Data></Cell>
          </Row>
          ${summaryRows}
          <Row class="Total">
            <Cell><Data ss:Type="String">TOTALES</Data></Cell>
            <Cell></Cell>
            <Cell></Cell>
            <Cell></Cell>
            <Cell ss:StyleID="Total"><Data ss:Type="Number">${totalSubtotal.toFixed(2)}</Data></Cell>
            <Cell ss:StyleID="Total"><Data ss:Type="Number">${totalTax.toFixed(2)}</Data></Cell>
            <Cell ss:StyleID="Total"><Data ss:Type="Number">${totalDiscount.toFixed(2)}</Data></Cell>
            <Cell ss:StyleID="Total"><Data ss:Type="Number">${totalAmount.toFixed(2)}</Data></Cell>
            <Cell></Cell>
            <Cell></Cell>
          </Row>
        </Table>
      </Worksheet>
      <Worksheet ss:Name="Detalle de Items">
        <Table>
          <Row>
            <Cell><Data ss:Type="String">Código Venta</Data></Cell>
            <Cell><Data ss:Type="String">Fecha</Data></Cell>
            <Cell><Data ss:Type="String">Cliente</Data></Cell>
            <Cell><Data ss:Type="String">Producto</Data></Cell>
            <Cell><Data ss:Type="String">Cantidad</Data></Cell>
            <Cell><Data ss:Type="String">Precio</Data></Cell>
            <Cell><Data ss:Type="String">Subtotal</Data></Cell>
          </Row>
          ${itemsRows || "<tr><td colspan='7'>Sin items registrados</td></tr>"}
        </Table>
      </Worksheet>
    </Workbook>
  `
}

// ============================================
// EXPORTAR PDF INDIVIDUAL (RECEIPT)
// ============================================
export async function exportSaleReceiptPDF(sale: Sale): Promise<void> {
  try {
    const saleCode = sale.id.toString().slice(0, 8).toUpperCase()
    const taxToUse = sale.tax || 0

    const itemsRows = (sale.items || [])
      .map(
        (item) => `
      <tr>
        <td style="padding:9px 8px;text-align:left;border-bottom:1px solid #ddd;">${item.productName || "-"}</td>
        <td style="padding:9px 8px;text-align:center;border-bottom:1px solid #ddd;">${item.quantity}</td>
        <td style="padding:9px 8px;text-align:right;border-bottom:1px solid #ddd;">${formatCurrency(item.price)}</td>
        <td style="padding:9px 8px;text-align:right;border-bottom:1px solid #ddd;font-weight:600;">${formatCurrency(item.subtotal)}</td>
      </tr>
    `,
      )
      .join("")

    const html = `<!doctype html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Venta #${saleCode}</title>
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
          .summary-section { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 20px; }
          .terms { flex: 1; border: 1px solid #d9d9d9; padding: 12px; font-size: 12px; color: #444; }
          .terms h4 { color: #111; margin-bottom: 6px; font-weight: 700; }
          .totals { width: 78mm; border: 1px solid #d9d9d9; padding: 12px; }
          .totals .row { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 6px; }
          .totals .row.total { margin-top: 8px; padding-top: 8px; border-top: 2px solid #111; font-size: 16px; font-weight: 700; }
          .footer { border-top: 1px solid #bbb; padding-top: 10px; text-align: center; font-size: 12px; color: #444; margin-top: 18px; }
          .footer p { margin: 4px 0; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 36px; }
          .signature { text-align: center; }
          .signature-line { border-top: 1px solid #555; padding-top: 8px; font-size: 12px; margin-top: 8px; }
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
            <p class="label">Comprobante de venta</p>
            <p class="code">#${saleCode}</p>
          </div>
        </div>

        <div class="info-grid">
          <div>
            <p><strong>Fecha:</strong> ${sale.date.split("T")[0]}</p>
            <p><strong>Cliente:</strong> ${sale.clientName || "Cliente no registrado"}</p>
            <p><strong>Código:</strong> #${saleCode}</p>
          </div>
          <div style="text-align:right">
            <p><strong>Vendedor:</strong> ${sale.sellerName}</p>
            <p><strong>Estado:</strong> ${sale.status}</p>
            <p><strong>Método de pago:</strong> ${sale.paymentMethod}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Cant.</th>
              <th>Precio</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div class="summary-section">
          <div class="terms">
            <h4>Términos y condiciones</h4>
            <p>• Revise su mercadería al momento de recibirla</p>
            <p>• Cambios sujetos a políticas internas de la empresa</p>
            <p>• Conserve este comprobante para cualquier consulta</p>
            <p>• Formas de pago: Efectivo, Transferencia y QR</p>
          </div>
          <div class="totals">
            <div class="row">
              <span>Subtotal</span>
              <span>${formatCurrency(sale.subtotal)}</span>
            </div>
            <div class="row">
              <span>Impuesto</span>
              <span>${formatCurrency(taxToUse)}</span>
            </div>
            ${
              sale.discount > 0
                ? `
            <div class="row" style="color:#c62828">
              <span>Descuento</span>
              <span>-${formatCurrency(sale.discount)}</span>
            </div>
            `
                : ""
            }
            <div class="row total">
              <span>Total</span>
              <span>${formatCurrency(sale.total)}</span>
            </div>
          </div>
        </div>

        ${
          sale.paymentMethod === "mixto" || (sale.paymentSplits && sale.paymentSplits.length > 0)
            ? `
        <div style="margin-bottom:18px;padding:12px;background:#fff8e1;border:1px solid #ffc107;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#111;">Detalle de pago mixto</p>
          ${(sale.paymentSplits || [])
            .map(
              (split) => `
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:12px;">
              <span style="color:#555;">${split.method}</span>
              <span style="font-weight:600;">${formatCurrency(split.amount)}</span>
            </div>
          `,
            )
            .join("")}
        </div>
        `
            : ""
        }

        ${
          sale.notes && sale.notes.trim()
            ? `
        <div style="margin-bottom:18px;padding:12px;background:#e3f2fd;border:1px solid #2196f3;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#111;">Observaciones</p>
          <p style="margin:0;font-size:12px;color:#555;white-space:pre-wrap;">${sale.notes}</p>
        </div>
        `
            : ""
        }

        <div class="footer">
          <p>Gracias por su compra en ${COMPANY_INFO.name}.</p>
          <p>Este documento certifica la operación comercial realizada.</p>
        </div>

        <div class="signatures">
          <div class="signature">
            <div class="signature-line">Firma asesor comercial</div>
          </div>
          <div class="signature">
            <div class="signature-line">Recibí conforme</div>
          </div>
        </div>
      </body>
      </html>`
    void htmlDocumentToPdf(html, `venta-${saleCode}.pdf`, "portrait")
      .then(() => toast.success("Recibo de venta exportado correctamente"))
      .catch((error) => {
        toast.error(
          `Error al exportar recibo: ${error instanceof Error ? error.message : "Error desconocido"}`,
        )
      })
  } catch (error) {
    toast.error(
      `Error al exportar recibo: ${error instanceof Error ? error.message : "Error desconocido"}`,
    )
  }
}

// ============================================
// REPORTE PDF DE VENTAS
// ============================================
export function exportSalesReportPDF(sales: Sale[], filename?: string): void {
  void generateSalesReportPdf(sales, filename)
}

async function generateSalesReportPdf(sales: Sale[], filename?: string): Promise<void> {
  if (sales.length === 0) {
    toast.error("No hay datos para exportar")
    return
  }

  const totalAmount = sales.reduce((sum, sale) => sum + sale.total, 0)
  const totalSubtotal = sales.reduce((sum, sale) => sum + sale.subtotal, 0)
  const totalTax = sales.reduce((sum, sale) => sum + sale.tax, 0)
  const totalDiscount = sales.reduce((sum, sale) => sum + sale.discount, 0)

  const statusCounts = {
    completada: sales.filter((sale) => sale.status === "completada").length,
    pendiente: sales.filter((sale) => sale.status === "pendiente").length,
    cancelada: sales.filter((sale) => sale.status === "cancelada").length,
  }

  const { generatePdfTable } = await import("./pdf-table")

  await generatePdfTable({
    title: "Reporte de Ventas",
    subtitle: "Listado de ventas registradas",
    filename: filename || `ventas-${getDateString()}.pdf`,
    columns: [
      { label: "Código", width: 20, align: "center" },
      { label: "Fecha", width: 22, align: "center" },
      { label: "Cliente", width: 65, align: "left" },
      { label: "Vendedor", width: 42, align: "left" },
      { label: "Subtotal", width: 25, align: "right" },
      { label: "Desc.", width: 24, align: "right" },
      { label: "Total", width: 25, align: "right" },
      { label: "Método", width: 28, align: "center" },
      { label: "Estado", width: 26, align: "center" },
    ],
    rows: sales.map((sale) => [
      sale.id.toString().slice(0, 8).toUpperCase(),
      sale.date.split("T")[0],
      sale.clientName || "Cliente no registrado",
      sale.sellerName || "-",
      formatCurrency(sale.subtotal),
      formatCurrency(sale.discount),
      formatCurrency(sale.total),
      sale.paymentMethod,
      sale.status,
    ]),
    kpis: [
      { label: "Total ventas", value: formatCurrency(totalAmount) },
      { label: "Subtotal", value: formatCurrency(totalSubtotal) },
      { label: "Impuestos", value: formatCurrency(totalTax) },
      { label: "Descuentos", value: formatCurrency(totalDiscount) },
      { label: "Completadas", value: String(statusCounts.completada) },
      { label: "Pendientes", value: String(statusCounts.pendiente) },
      { label: "Canceladas", value: String(statusCounts.cancelada) },
    ],
    footerText: `Total de ventas: ${formatCurrency(totalAmount)} | Generado el ${new Date().toLocaleString("es-BO")}`,
  })
  toast.success("Reporte de ventas exportado correctamente")
}
