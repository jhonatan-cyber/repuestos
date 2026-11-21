export const QUOTATION_STATUS_VALUES = [
  "pendiente",
  "aprobada",
  "rechazada",
  "convertida",
  "vencida",
  "solicitado",
] as const

export type QuotationStatus = (typeof QUOTATION_STATUS_VALUES)[number]

export function normalizeQuotationStatus(status: unknown): QuotationStatus {
  switch (status) {
    case "aprobada":
    case "rechazada":
    case "convertida":
    case "vencida":
    case "pendiente":
    case "solicitado":
      return status
    case "activa":
    default:
      return "pendiente"
  }
}
