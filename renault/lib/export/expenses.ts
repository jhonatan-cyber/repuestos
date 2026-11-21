"use client"

import type { Expense } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/format-utils"
import { toast } from "@/lib/toast"
import { getDateString } from "./shared"

// ============================================
// EXPORTAR PDF DE GASTOS (REPORTE)
// ============================================
export function exportExpensesPDF(
  expenses: Expense[],
  options?: {
    startDate?: string
    endDate?: string
    search?: string
  },
  filename?: string,
): void {
  void generateExpensesReportPdf(expenses, options, filename)
}

async function generateExpensesReportPdf(
  expenses: Expense[],
  options?: {
    startDate?: string
    endDate?: string
    search?: string
  },
  filename?: string,
): Promise<void> {
  if (expenses.length === 0) {
    toast.error("No hay gastos para exportar")
    return
  }

  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const avgAmount = totalAmount / expenses.length
  const categoryCount = new Set(expenses.map((expense) => expense.category || "Sin categoria")).size
  const metaLines = [
    options?.startDate || options?.endDate
      ? `Rango: ${options?.startDate || "inicio"} - ${options?.endDate || "hoy"}`
      : "Sin filtro de fechas",
    options?.search ? `Filtro de texto: ${options.search}` : "Todos los gastos registrados",
  ]

  const { generatePdfTable } = await import("./pdf-table")

  await generatePdfTable({
    title: "Reporte de Gastos",
    subtitle: "Gastos filtrados por rango y busqueda",
    filename: filename || `gastos-${getDateString()}.pdf`,
    columns: [
      { label: "Fecha", width: 28, align: "center" },
      { label: "Nombre", width: 42, align: "left" },
      { label: "Categoria", width: 32, align: "left" },
      { label: "Descripcion", width: 104, align: "left" },
      { label: "Monto", width: 28, align: "right" },
    ],
    rows: expenses.map((expense) => [
      formatDate(expense.date),
      expense.name || "-",
      expense.category || "Sin categoria",
      expense.description || "-",
      formatCurrency(expense.amount),
    ]),
    metaLines,
    kpis: [
      { label: "Total gastado", value: formatCurrency(totalAmount) },
      { label: "Cantidad", value: String(expenses.length) },
      { label: "Promedio", value: formatCurrency(avgAmount) },
      { label: "Categorias", value: String(categoryCount) },
    ],
    compactKpis: [
      { label: "Total gastado", value: formatCurrency(totalAmount) },
      { label: "Cantidad", value: String(expenses.length) },
      { label: "Promedio", value: formatCurrency(avgAmount) },
      { label: "Categorias", value: String(categoryCount) },
    ],
    footerText: `Generado el ${new Date().toLocaleString("es-BO")} | ${expenses.length} gastos`,
  })

  toast.success("Reporte de gastos exportado correctamente")
}
