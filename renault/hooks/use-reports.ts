"use client"

// Fachada única de reportes: importar siempre desde "@/hooks/use-reports".
// Internos (data/pdf/composed/enhanced) no deben importarse directamente.
export type {
  ReportSale,
  ReportSaleItem,
  ReportPurchase,
  ReportPurchaseItem,
  ReportExpense,
  ExportDataOverride,
} from "@/lib/report-utils"

export { useReportsData } from "./use-reports-data"
export { useReportsPdf } from "./use-reports-pdf"
export { useReports } from "./use-reports-composed"
export { useReportsEnhanced } from "./use-reports-enhanced"
