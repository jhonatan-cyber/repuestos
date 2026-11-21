"use client"

import { useReportsData } from "./use-reports-data"
import { useReportsPdf } from "./use-reports-pdf"

export function useReports() {
  const data = useReportsData()
  const pdf = useReportsPdf(
    data.salesData,
    data.purchasesData,
    data.expensesData,
    data.dateFrom,
    data.dateTo,
  )

  return {
    ...data,
    ...pdf,
  }
}
