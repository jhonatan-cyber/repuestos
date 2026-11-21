// Utilidades de formateo para el sistema ERP

/**
 * Formatea un número como moneda local (Bolivianos)
 * Formato: 10.560.30
 */
export function formatCurrency(amount: number | string): string {
  const value = typeof amount === "string" ? Number(amount) : amount
  const normalized = Number.isFinite(value) ? value : 0

  return new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(normalized)
}

export function formatDate(date: string | Date): string {
  let d: Date
  if (typeof date === "string") {
    const dateOnlyMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch
      d = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0, 0)
    } else {
      d = new Date(date)
    }
  } else {
    d = date
  }
  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("es-BO").format(num)
}

export function formatCompactNumber(num: number): string {
  return new Intl.NumberFormat("es-BO", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(num)
}

export function formatStatNumber(num: number): string {
  if (Math.abs(num) >= 1000) {
    return formatCompactNumber(num)
  }
  return formatNumber(num)
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 7) {
    return formatDate(d)
  } else if (diffDays > 0) {
    return `hace ${diffDays} ${diffDays === 1 ? "día" : "días"}`
  } else if (diffHours > 0) {
    return `hace ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`
  } else if (diffMins > 0) {
    return `hace ${diffMins} ${diffMins === 1 ? "minuto" : "minutos"}`
  } else {
    return "hace un momento"
  }
}

export function getStockColor(stock: number, minimumStock: number): string {
  const percentage = (stock / minimumStock) * 100

  if (percentage <= 50) return "destructive"
  if (percentage <= 100) return "warning"
  return "success"
}

/** Capitaliza cada palabra (title case) - "frenos de disco" → "Frenos De Disco" */
export function capitalizeWords(text: string): string {
  if (!text) return text
  return text
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

/** Capitaliza la primera letra de cada palabra preservando mayúsculas existentes */
export function capitalizeWordsPreservingCase(text: string): string {
  return text
    .split(" ")
    .map((word) => (word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
    .join(" ")
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}
