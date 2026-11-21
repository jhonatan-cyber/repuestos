/**
 * Pure utility functions for sales operations.
 * Extracted from API routes for testability.
 */

export { parseDateStartLocal, parseDateEndLocal, formatDateLocal } from "./dates"

export function normalizePaymentMethod(method: unknown): string {
  return String(method || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

export function normalizeSaleType(value: unknown): "contado" | "credito" {
  const key = String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
  return key === "credito" ? "credito" : "contado"
}

export function safeInitialPayment(initialPayment: unknown, total: number): number {
  const amount = Math.max(0, Number(initialPayment || 0))
  if (amount > total) return total
  return amount
}

export function validateSalePayload(body: Record<string, unknown>): string | null {
  if (!body.date || !body.sellerUserId) return "Fecha y vendedor requeridos"
  if (!body.items || !Array.isArray(body.items) || body.items.length === 0)
    return "La venta debe tener al menos un producto"
  const isCreditSale = normalizeSaleType(body.saleType || body.paymentMethod) === "credito"
  if (isCreditSale && (!body.clientId || String(body.clientId).trim() === ""))
    return "Para ventas a crédito debés seleccionar un cliente"
  return null
}
