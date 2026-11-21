"use client"

import { useCallback } from "react"
import { toast } from "@/lib/toast"
import {
  collectChartSnapshots,
  downloadBlob,
  downloadTextFile,
  escapeHtml,
  formatMoney,
  today,
  type ExportDataOverride,
  type ReportExpense,
  type ReportPurchase,
  type ReportSale,
} from "@/lib/report-utils"

export function useReportsPdf(
  salesData: ReportSale[],
  purchasesData: ReportPurchase[],
  expensesData: ReportExpense[],
  dateFrom: string,
  dateTo: string,
) {
  const buildRowsHtml = useCallback((rows: Array<Array<string>>) => {
    return rows
      .map(
        (row) => `<tr>${row.map((cell) => `<td>${escapeHtml(String(cell))}</td>`).join("")}</tr>`,
      )
      .join("")
  }, [])

  async function renderHtmlToPdf(html: string, filename: string) {
    const { default: html2canvas } = await import("html2canvas")
    const { jsPDF } = await import("jspdf")

    const iframe = document.createElement("iframe")
    iframe.setAttribute("aria-hidden", "true")
    iframe.style.position = "fixed"
    iframe.style.left = "-10000px"
    iframe.style.top = "0"
    iframe.style.width = "1500px"
    iframe.style.height = "2000px"
    iframe.style.border = "0"
    document.body.appendChild(iframe)

    try {
      const frameDoc = iframe.contentDocument
      if (!frameDoc) throw new Error("No se pudo inicializar el documento del reporte")

      frameDoc.open()
      frameDoc.write(html)
      frameDoc.close()

      if (document.fonts?.ready) {
        await document.fonts.ready
      }
      await new Promise((resolve) => window.setTimeout(resolve, 150))

      const sheet = frameDoc.querySelector<HTMLElement>(".sheet") ?? frameDoc.body
      const canvas = await html2canvas(sheet, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: sheet.scrollWidth,
        windowHeight: sheet.scrollHeight,
      })

      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
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

      downloadBlob(pdf.output("blob"), filename)
      toast.success("PDF exportado correctamente")
    } finally {
      iframe.remove()
    }
  }

  const REPORT_STYLES = {
    common: `
      :root { --brand:#0f172a; --muted:#64748b; --line:#dbe4df; --head:#e9f9ef; --accent:#138a49; --accent-2:#0e6a38; }
      * { box-sizing: border-box; }
      body { font-family: Arial, sans-serif; margin: 20px; color: var(--brand); background: white; }
      .sheet { border: 1px solid var(--line); border-radius: 12px; overflow: hidden; background: white; }
      .header { display:flex; justify-content:space-between; align-items:center; gap: 16px; padding: 14px 16px; border-bottom: 1px solid var(--line); background: var(--head); }
      .title h1 { margin: 0; font-size: 24px; line-height:1.1; color: var(--accent-2); letter-spacing: .5px; }
      .title p { margin: 6px 0 0; font-size: 12px; color: var(--muted); }
      .logo { height: 58px; object-fit: contain; }
      .meta { margin: 0; font-size: 12px; color: var(--muted); padding: 10px 16px; border-bottom: 1px solid var(--line); }
      .kpis { display:grid; gap:10px; padding: 12px 16px; border-bottom: 1px solid var(--line); background:#f8fffb; }
      .kpi-card { border:1px solid #bfe4cc; border-radius: 10px; padding: 10px 12px; background:white; }
      .kpi-card p { margin: 0 0 4px; font-size: 12px; color: var(--muted); }
      .kpi-card strong { font-size: 18px; color: var(--accent-2); }
      .charts { display:grid; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--line); }
      .chart { border: 1px solid var(--line); border-radius: 10px; padding: 12px; background: white; text-align: center; overflow: hidden; }
      .chart-title { font-size: 12px; font-weight: 700; color: var(--muted); margin-bottom: 8px; }
      .chart img { width: 100%; height: auto; display:block; border-radius: 8px; }
      table { border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid var(--line); padding: 7px 8px; text-align: left; vertical-align: top; }
      th { background: #e8f7ee; color: #0f5132; font-weight: 700; }
      tbody tr:nth-child(even) { background: #fafafa; }
      td:last-child, th:last-child { text-align: right; }
      .footer { display:flex; justify-content:space-between; align-items:center; font-size: 12px; border-top: 1px dashed var(--line); padding-top: 8px; }
      .footer strong { font-size: 14px; color: var(--accent); }
      @media (max-width: 900px) { .charts, .kpis { grid-template-columns: 1fr; } }
    `,
    single: `table { width: calc(100% - 32px); margin: 12px 16px 0; } .kpis { grid-template-columns: repeat(3,minmax(0,1fr)); } .charts { grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); } .footer { margin: 10px 16px 14px; }`,
    general: `
      .kpis { grid-template-columns: repeat(4,minmax(0,1fr)); }
      .charts { grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); }
      .content { padding: 12px 16px 16px; }
      .report-section + .report-section { margin-top: 16px; }
      .section-head { display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px; }
      .section-head h2 { margin: 0; font-size: 18px; color: var(--accent-2); }
      .section-head strong { font-size: 14px; color: var(--accent); }
      table { width: 100%; }
    `,
  }

  const buildSingleReportConfig = (type: "sales" | "purchases" | "expenses") => {
    const configs = {
      sales: {
        title: "Reporte de ventas",
        dashboardTitle: "DASHBOARD INFORME DE VENTAS",
        filename: "reporte-ventas",
        headers: ["Fecha", "Cliente", "Vendedor", "Subtotal", "Descuento", "Total"],
        rows: salesData.map((sale) => [
          sale.date,
          sale.clientName,
          sale.sellerName,
          formatMoney(sale.subtotal),
          formatMoney(sale.discount),
          formatMoney(sale.total),
        ]),
        total: salesData.reduce((sum, sale) => sum + sale.total, 0),
        cards: [
          {
            label: "Subtotal acumulado",
            value: formatMoney(salesData.reduce((sum, sale) => sum + sale.subtotal, 0)),
          },
          {
            label: "Descuentos",
            value: formatMoney(salesData.reduce((sum, sale) => sum + sale.discount, 0)),
          },
          {
            label: "Ventas netas",
            value: formatMoney(salesData.reduce((sum, sale) => sum + sale.total, 0)),
          },
        ],
      },
      purchases: {
        title: "Reporte de compras",
        dashboardTitle: "DASHBOARD INFORME DE COMPRAS",
        filename: "reporte-compras",
        headers: ["Fecha", "Proveedor", "Comprador", "Subtotal", "Impuesto", "Total"],
        rows: purchasesData.map((purchase) => [
          purchase.date,
          purchase.supplierName,
          purchase.buyerName,
          formatMoney(purchase.subtotal),
          formatMoney(purchase.tax),
          formatMoney(purchase.total),
        ]),
        total: purchasesData.reduce((sum, purchase) => sum + purchase.total, 0),
        cards: [
          {
            label: "Subtotal acumulado",
            value: formatMoney(purchasesData.reduce((sum, purchase) => sum + purchase.subtotal, 0)),
          },
          {
            label: "Impuestos",
            value: formatMoney(purchasesData.reduce((sum, purchase) => sum + purchase.tax, 0)),
          },
          {
            label: "Compras totales",
            value: formatMoney(purchasesData.reduce((sum, purchase) => sum + purchase.total, 0)),
          },
        ],
      },
      expenses: {
        title: "Reporte de gastos",
        dashboardTitle: "DASHBOARD INFORME DE GASTOS",
        filename: "reporte-gastos",
        headers: ["Fecha", "Descripcion", "Categoria", "Responsable", "Monto"],
        rows: expensesData.map((expense) => [
          expense.date,
          expense.description,
          expense.category || "-",
          expense.responsibleName || "-",
          formatMoney(expense.amount),
        ]),
        total: expensesData.reduce((sum, expense) => sum + expense.amount, 0),
        cards: [
          {
            label: "Gasto total",
            value: formatMoney(expensesData.reduce((sum, expense) => sum + expense.amount, 0)),
          },
          { label: "Registros", value: String(expensesData.length) },
          {
            label: "Promedio",
            value: formatMoney(
              expensesData.length
                ? expensesData.reduce((sum, expense) => sum + expense.amount, 0) /
                    expensesData.length
                : 0,
            ),
          },
        ],
      },
    }
    return configs[type]
  }

  async function exportPDF(
    type: "sales" | "purchases" | "expenses",
    override: ExportDataOverride = {},
  ) {
    const sales = override.salesData ?? salesData
    const purchases = override.purchasesData ?? purchasesData
    const expenses = override.expensesData ?? expensesData

    const dataMap = { sales, purchases, expenses }
    const rowsSource = dataMap[type]

    if (rowsSource.length === 0) {
      toast.error("No hay datos para exportar")
      return
    }

    const config = buildSingleReportConfig(type)
    const chartKeysByType: Record<string, Array<"trend" | "distribution" | "net">> = {
      sales: ["trend", "distribution"],
      purchases: ["trend", "distribution"],
      expenses: ["trend", "distribution", "net"],
    }

    const chartImages = await collectChartSnapshots(chartKeysByType[type])
    const chartsHtml = chartImages
      .map(
        (src, index) =>
          `<div class="chart"><div class="chart-title">Grafico ${index + 1}</div><img src="${src}" alt="Grafico ${index + 1}" /></div>`,
      )
      .join("")
    const cardsHtml = config.cards
      .map(
        (card) =>
          `<article class="kpi-card"><p>${escapeHtml(card.label)}</p><strong>${escapeHtml(card.value)}</strong></article>`,
      )
      .join("")
    const rowsHtml = buildRowsHtml(config.rows)
    const now = new Date()

    await renderHtmlToPdf(
      `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(config.title)}</title>
  <style>${REPORT_STYLES.common} ${REPORT_STYLES.single}</style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div class="title">
        <h1>${escapeHtml(config.dashboardTitle)}</h1>
        <p>Rango: ${escapeHtml(dateFrom || "Inicio")} - ${escapeHtml(dateTo || "Hoy")}</p>
      </div>
      <img class="logo" src="${window.location.origin}/api/settings/logo" alt="Logo empresa" />
    </div>
    <p class="meta">Generado: ${escapeHtml(now.toLocaleString("es-BO"))} · Registros: ${rowsSource.length}</p>
    <section class="kpis">${cardsHtml}</section>
    <section class="charts">${chartsHtml || "<div class='chart'>Sin graficos disponibles para este rango</div>"}</section>
    <table>
      <thead><tr>${config.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <div class="footer">
      <span>Reporte emitido por Renault ERP</span>
      <strong>Total: ${escapeHtml(formatMoney(config.total))}</strong>
    </div>
  </div>
</body>
</html>`,
      `${config.filename}-${dateFrom || "inicio"}-${dateTo || "hoy"}.pdf`,
    )
  }

  async function exportAllPDF(override: ExportDataOverride = {}) {
    const sales = override.salesData ?? salesData
    const purchases = override.purchasesData ?? purchasesData
    const expenses = override.expensesData ?? expensesData

    if (sales.length === 0 && purchases.length === 0 && expenses.length === 0) {
      toast.error("No hay datos para exportar")
      return
    }

    const chartImages = await collectChartSnapshots(["trend", "distribution", "net"])
    const chartsHtml = chartImages
      .map(
        (src, index) =>
          `<div class="chart"><div class="chart-title">Grafico ${index + 1}</div><img src="${src}" alt="Grafico ${index + 1}" /></div>`,
      )
      .join("")

    const sections = [
      {
        title: "Ventas",
        total: formatMoney(sales.reduce((sum, sale) => sum + sale.total, 0)),
        headers: ["Fecha", "Cliente", "Vendedor", "Subtotal", "Descuento", "Total"],
        rows: sales.map((sale) => [
          sale.date,
          sale.clientName,
          sale.sellerName,
          formatMoney(sale.subtotal),
          formatMoney(sale.discount),
          formatMoney(sale.total),
        ]),
      },
      {
        title: "Compras",
        total: formatMoney(purchases.reduce((sum, purchase) => sum + purchase.total, 0)),
        headers: ["Fecha", "Proveedor", "Comprador", "Subtotal", "Impuesto", "Total"],
        rows: purchases.map((purchase) => [
          purchase.date,
          purchase.supplierName,
          purchase.buyerName,
          formatMoney(purchase.subtotal),
          formatMoney(purchase.tax),
          formatMoney(purchase.total),
        ]),
      },
      {
        title: "Gastos",
        total: formatMoney(expenses.reduce((sum, expense) => sum + expense.amount, 0)),
        headers: ["Fecha", "Descripcion", "Categoria", "Responsable", "Monto"],
        rows: expenses.map((expense) => [
          expense.date,
          expense.description,
          expense.category || "-",
          expense.responsibleName || "-",
          formatMoney(expense.amount),
        ]),
      },
    ]

    const sectionsHtml = sections
      .map(
        (section) => `
          <section class="report-section">
            <div class="section-head">
              <h2>${escapeHtml(section.title)}</h2>
              <strong>Total: ${escapeHtml(section.total)}</strong>
            </div>
            <table>
              <thead><tr>${section.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
              <tbody>${buildRowsHtml(section.rows)}</tbody>
            </table>
          </section>`,
      )
      .join("")

    const net =
      sales.reduce((sum, sale) => sum + sale.total, 0) -
      purchases.reduce((sum, purchase) => sum + purchase.total, 0) -
      expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const now = new Date()

    await renderHtmlToPdf(
      `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Dashboard informe general</title>
  <style>${REPORT_STYLES.common} ${REPORT_STYLES.general}</style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div class="title">
        <h1>DASHBOARD INFORME GENERAL</h1>
        <p>Rango: ${escapeHtml(dateFrom || "Inicio")} - ${escapeHtml(dateTo || "Hoy")}</p>
      </div>
      <img class="logo" src="${window.location.origin}/api/settings/logo" alt="Logo empresa" />
    </div>
    <p class="meta">Generado: ${escapeHtml(now.toLocaleString("es-BO"))}</p>
    <section class="kpis">
      <article class="kpi-card"><p>Ventas</p><strong>${escapeHtml(formatMoney(sales.reduce((sum, sale) => sum + sale.total, 0)))}</strong></article>
      <article class="kpi-card"><p>Compras</p><strong>${escapeHtml(formatMoney(purchases.reduce((sum, purchase) => sum + purchase.total, 0)))}</strong></article>
      <article class="kpi-card"><p>Gastos</p><strong>${escapeHtml(formatMoney(expenses.reduce((sum, expense) => sum + expense.amount, 0)))}</strong></article>
      <article class="kpi-card"><p>Utilidad neta</p><strong>${escapeHtml(formatMoney(net))}</strong></article>
    </section>
    <section class="charts">${chartsHtml || "<div class='chart'>Sin graficos disponibles para este rango</div>"}</section>
    <div class="content">${sectionsHtml}</div>
  </div>
</body>
</html>`,
      `reporte-general-${dateFrom || "inicio"}-${dateTo || "hoy"}.pdf`,
    )
  }

  async function exportAllExcel(override: ExportDataOverride = {}) {
    const sales = override.salesData ?? salesData
    const purchases = override.purchasesData ?? purchasesData
    const expenses = override.expensesData ?? expensesData

    if (sales.length === 0 && purchases.length === 0 && expenses.length === 0) {
      toast.error("No hay datos para exportar")
      return
    }

    const chartImages = await collectChartSnapshots(["trend", "distribution", "net"])
    const chartsHtml = chartImages.length
      ? chartImages
          .map(
            (src, index) =>
              `<div style="margin:12px 0;"><div style="font-size:12px;font-weight:700;color:#475569;margin-bottom:6px;">Grafico ${index + 1}</div><img src="${src}" alt="Grafico ${index + 1}" style="max-width:100%; height:auto; border:1px solid #cbd5e1; border-radius:8px;" /></div>`,
          )
          .join("")
      : "<p>Sin graficos disponibles para este rango.</p>"

    const workbookHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Arial, sans-serif; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; }
    th { background: #dcfce7; color: #14532d; }
    h1, h2 { color: #166534; }
    .kpis td:first-child { font-weight: 700; }
  </style>
</head>
<body>
  <h1>Dashboard informe general</h1>
  <p>Rango: ${escapeHtml(dateFrom || "Inicio")} - ${escapeHtml(dateTo || "Hoy")}</p>
  <table class="kpis">
    <tr><th>Indicador</th><th>Valor</th></tr>
    <tr><td>Ventas</td><td>${escapeHtml(formatMoney(sales.reduce((sum, sale) => sum + sale.total, 0)))}</td></tr>
    <tr><td>Compras</td><td>${escapeHtml(formatMoney(purchases.reduce((sum, purchase) => sum + purchase.total, 0)))}</td></tr>
    <tr><td>Gastos</td><td>${escapeHtml(formatMoney(expenses.reduce((sum, expense) => sum + expense.amount, 0)))}</td></tr>
    <tr><td>Utilidad neta</td><td>${escapeHtml(formatMoney(sales.reduce((sum, sale) => sum + sale.total, 0) - purchases.reduce((sum, purchase) => sum + purchase.total, 0) - expenses.reduce((sum, expense) => sum + expense.amount, 0)))}</td></tr>
  </table>
  <br />
  <h2>Graficos</h2>
  ${chartsHtml}
  <br />
  <h2>Ventas</h2>
  <table>
    <tr><th>Fecha</th><th>Cliente</th><th>Vendedor</th><th>Subtotal</th><th>Descuento</th><th>Total</th></tr>
    ${sales.map((sale) => `<tr><td>${escapeHtml(sale.date)}</td><td>${escapeHtml(sale.clientName)}</td><td>${escapeHtml(sale.sellerName)}</td><td>${escapeHtml(formatMoney(sale.subtotal))}</td><td>${escapeHtml(formatMoney(sale.discount))}</td><td>${escapeHtml(formatMoney(sale.total))}</td></tr>`).join("")}
  </table>
  <br />
  <h2>Compras</h2>
  <table>
    <tr><th>Fecha</th><th>Proveedor</th><th>Comprador</th><th>Subtotal</th><th>Impuesto</th><th>Total</th></tr>
    ${purchases.map((purchase) => `<tr><td>${escapeHtml(purchase.date)}</td><td>${escapeHtml(purchase.supplierName)}</td><td>${escapeHtml(purchase.buyerName)}</td><td>${escapeHtml(formatMoney(purchase.subtotal))}</td><td>${escapeHtml(formatMoney(purchase.tax))}</td><td>${escapeHtml(formatMoney(purchase.total))}</td></tr>`).join("")}
  </table>
  <br />
  <h2>Gastos</h2>
  <table>
    <tr><th>Fecha</th><th>Descripcion</th><th>Categoria</th><th>Responsable</th><th>Monto</th></tr>
    ${expenses.map((expense) => `<tr><td>${escapeHtml(expense.date)}</td><td>${escapeHtml(expense.description)}</td><td>${escapeHtml(expense.category || "-")}</td><td>${escapeHtml(expense.responsibleName || "-")}</td><td>${escapeHtml(formatMoney(expense.amount))}</td></tr>`).join("")}
  </table>
</body>
</html>`

    downloadTextFile(
      workbookHtml,
      `reporte-general-${today()}.xls`,
      "application/vnd.ms-excel;charset=utf-8;",
    )
    toast.success("Reporte general exportado a Excel")
  }

  async function handleBackup() {
    try {
      if (typeof window === "undefined" || !(window as any).electron) {
        toast.error("La funcion de respaldo solo esta disponible en la aplicacion de escritorio")
        return
      }
      const result = await (window as any).electron.saveDatabase()
      if (result.success) toast.success(`Respaldo creado con exito en: ${result.path}`)
      else if (result.cancelled) toast.info("Respaldo cancelado")
      else toast.error(`Error al crear respaldo: ${result.error}`)
    } catch {
      toast.error("Error de comunicacion con el sistema")
    }
  }

  return { exportPDF, exportAllPDF, exportAllExcel, handleBackup }
}
