"use client"

import type { Product } from "@/lib/types"
import { formatCurrency } from "@/lib/format-utils"
import { toast } from "@/lib/toast"
import { drawReportHeader, getDateString, getImageDataUrl, loadImageAsDataUrl } from "./shared"

// ============================================
// REPORTE PDF DE PRODUCTOS
// ============================================
export function exportProductsPDF(
  products: Product[],
  categoryName?: string,
  filename?: string,
): void {
  void generateProductsReportPdf(products, categoryName, filename)
}

async function generateProductsReportPdf(
  products: Product[],
  categoryName?: string,
  filename?: string,
): Promise<void> {
  if (products.length === 0) {
    toast.error("No hay productos para exportar")
    return
  }

  const { jsPDF } = await import("jspdf")
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
  const logoDataUrl = await loadImageAsDataUrl("/api/settings/logo")
  const totalValue = products.reduce(
    (sum, product) => sum + product.salePrice * (product.stock ?? 0),
    0,
  )
  const totalCost = products.reduce(
    (sum, product) => sum + product.purchasePrice * (product.stock ?? 0),
    0,
  )
  const totalStock = products.reduce((sum, product) => sum + (product.stock ?? 0), 0)
  const activeCount = products.filter((product) => product.status === "active").length
  const lowStockCount = products.filter(
    (product) => (product.stock ?? 0) <= (product.minimumStock ?? 0),
  ).length

  const startY = drawReportHeader(pdf, {
    title: "Inventario de Productos",
    subtitle: categoryName ? `Categoría: ${categoryName}` : "Inventario general",
    logoDataUrl,
    metaLines: [
      `Fecha: ${new Date().toLocaleDateString("es-BO")}`,
      `${products.length} productos registrados`,
    ],
    kpis: [
      { label: "Valor total", value: formatCurrency(totalValue) },
      { label: "Costo total", value: formatCurrency(totalCost) },
      { label: "Stock total", value: String(totalStock) },
      { label: "Activos", value: String(activeCount) },
      { label: "Stock bajo", value: String(lowStockCount) },
      { label: "Productos", value: String(products.length) },
    ],
  })

  const columns = [
    { label: "Img.", width: 14, align: "center" as const },
    { label: "Código", width: 18, align: "center" as const },
    { label: "Producto", width: 54, align: "left" as const },
    { label: "Marca", width: 22, align: "center" as const },
    { label: "Modelo", width: 22, align: "center" as const },
    { label: "Costo", width: 20, align: "right" as const },
    { label: "Precio", width: 20, align: "right" as const },
    { label: "Stock", width: 14, align: "center" as const },
    { label: "Min.", width: 14, align: "center" as const },
    { label: "Unidad", width: 14, align: "center" as const },
    { label: "Valor", width: 22, align: "right" as const },
    { label: "Estado", width: 23, align: "center" as const },
  ]

  const imageUrls = await Promise.all(
    products.map((product) => getImageDataUrl(product.image || null)),
  )

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 10
  const headerHeight = 8
  const lineHeight = 4
  let y = startY

  const drawHeader = () => {
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

  drawHeader()

  products.forEach((product, index) => {
    const row = [
      "",
      product.code,
      product.name,
      product.brand || "-",
      product.model || "-",
      formatCurrency(product.purchasePrice),
      formatCurrency(product.salePrice),
      String(product.stock ?? 0),
      String(product.minimumStock ?? 0),
      product.unit,
      formatCurrency(product.salePrice * (product.stock ?? 0)),
      product.status === "active" ? "Activo" : "Inactivo",
    ]

    const rowHeight = Math.max(
      12,
      ...row.map((value, cellIndex) => {
        if (cellIndex === 0) return 12
        return (
          Math.max(1, pdf.splitTextToSize(String(value), columns[cellIndex].width - 3).length) *
            lineHeight +
          1
        )
      }),
    )

    if (y + rowHeight > pageHeight - margin - 12) {
      pdf.addPage()
      y = drawReportHeader(pdf, {
        title: "Inventario de Productos",
        subtitle: categoryName ? `Categoría: ${categoryName}` : "Inventario general",
        logoDataUrl,
        compact: true,
        metaLines: [
          `Fecha: ${new Date().toLocaleDateString("es-BO")}`,
          `${products.length} productos registrados`,
        ],
      })
      drawHeader()
    }

    let x = margin
    pdf.setDrawColor(210, 210, 210)
    columns.forEach((col, cellIndex) => {
      pdf.rect(x, y, col.width, rowHeight)
      if (cellIndex === 0) {
        const imageUrl = imageUrls[index]
        if (imageUrl) {
          try {
            pdf.addImage(imageUrl, "PNG", x + 1.5, y + 1.5, 10, 10)
          } catch {
            pdf.setFont("helvetica", "normal")
            pdf.setFontSize(8)
            pdf.text("-", x + col.width / 2, y + 8, { align: "center" })
          }
        } else {
          pdf.setFont("helvetica", "normal")
          pdf.setFontSize(8)
          pdf.text("-", x + col.width / 2, y + 8, { align: "center" })
        }
      } else {
        const value = String(row[cellIndex])
        const lines = pdf.splitTextToSize(value, col.width - 3)
        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(8)
        const textY = y + 4
        if (col.align === "center") {
          pdf.text(lines, x + col.width / 2, textY, { align: "center" })
        } else if (col.align === "right") {
          pdf.text(lines, x + col.width - 1.5, textY, { align: "right" })
        } else {
          pdf.text(lines, x + 1.5, textY)
        }
      }
      x += col.width
    })

    y += rowHeight
  })

  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(9)
  pdf.setTextColor(90, 90, 90)
  pdf.text(
    `Generado el ${new Date().toLocaleString("es-BO")} | ${products.length} productos`,
    148.5,
    Math.min(y + 8, 202),
    { align: "center" },
  )

  pdf.save(filename || `productos-${getDateString()}.pdf`)
  toast.success("Inventario exportado correctamente")
}
