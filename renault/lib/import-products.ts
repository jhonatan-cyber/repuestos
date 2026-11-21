import { ProductSchema } from "@/lib/validations"
import { z } from "zod"

// ============================================
// Columnas de Excel aceptadas y su mapeo a campos del producto
// ============================================
export const COLUMN_MAP: Record<string, string> = {
  codigo: "code",
  código: "code",
  code: "code",
  nombre: "name",
  name: "name",
  producto: "name",
  marca: "brand",
  brand: "brand",
  modelo: "model",
  model: "model",
  precio_compra: "purchasePrice",
  precio_de_compra: "purchasePrice",
  "precio compra": "purchasePrice",
  purchaseprice: "purchasePrice",
  precio_venta: "salePrice",
  precio_de_venta: "salePrice",
  "precio venta": "salePrice",
  saleprice: "salePrice",
  stock: "stock",
  existencia: "stock",
  stock_minimo: "minimumStock",
  stock_mínimo: "minimumStock",
  stock_min: "minimumStock",
  "stock mínimo": "minimumStock",
  minimumstock: "minimumStock",
  unidad: "unit",
  unit: "unit",
  descripcion: "description",
  descripción: "description",
  description: "description",
  categoria: "categoryName",
  categoría: "categoryName",
  category: "categoryName",
  categoryname: "categoryName",
}

/**
 * Normaliza un encabezado de Excel para comparar sin acentos, mayúsculas,
 * espacios, guiones o guiones bajos.
 * "Código", "código", "CODIGO" y "codigo" son la misma columna.
 */
export function normalizeHeader(header: string): string {
  return header
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s_-]+/g, "")
}

// COLUMN_MAP indexado por encabezado normalizado (sin colisiones: 27 claves).
const COLUMN_BY_NORMALIZED: Record<string, string> = (() => {
  const out: Record<string, string> = {}
  for (const [excelCol, field] of Object.entries(COLUMN_MAP)) {
    const key = normalizeHeader(excelCol)
    if (!(key in out)) out[key] = field
  }
  return out
})()

// Schema extendido para importación: marca y modelo opcionales por si la DB no los tiene
export const EXTENDED_PRODUCT_SCHEMA = ProductSchema.extend({
  brand: z.string().optional().default(""),
  model: z.string().optional().default(""),
})

// ============================================
// Funciones
// ============================================

/** Parsea una celda a string limpio. */
export function parseCell(value: unknown): string {
  if (value == null) return ""
  return String(value).trim()
}

/**
 * Parsea una celda a número, soportando:
 * - Formato argentino/sudamericano: 1.250,75 → 1250.75
 * - Formato internacional: 1250.75 → 1250.75
 * - Formato con símbolo monetario: $ 1.500,00 → 1500
 * - Negativos: -50 → -50
 */
export function parseNumber(value: unknown): number {
  if (value == null) return 0
  let str = String(value).trim()

  // Preservar el signo negativo
  const isNegative = str.startsWith("-")
  if (isNegative) str = str.slice(1)

  // Limpiar todo excepto dígitos, punto, coma y signo menos
  str = str.replace(/[^0-9.,]/g, "")

  // Si hay punto Y coma => el punto es separador de miles, la coma es decimal
  if (str.includes(".") && str.includes(",")) {
    str = str.replace(/\./g, "").replace(",", ".")
  } else if (str.includes(",")) {
    // Solo coma => es el separador decimal
    str = str.replace(",", ".")
  }
  // Solo punto => ya es formato decimal estándar, no tocar

  const n = parseFloat(str)
  if (isNaN(n)) return 0
  return isNegative ? -n : n
}

export interface RowMappingResult {
  mapped: Record<string, unknown>
  error?: string
}

/**
 * Mapea una fila del Excel al formato interno del producto.
 * @param row Fila del Excel (key-value)
 * @param defaultCategoryId ID de categoría por defecto
 * @param categoryByName Mapa de nombre de categoría → ID
 */
export function mapRowToProduct(
  row: Record<string, unknown>,
  defaultCategoryId: string,
  categoryByName: Record<string, string>,
): RowMappingResult {
  const mapped: Record<string, unknown> = {}

  // Indexamos la fila por encabezado normalizado para tolerar diferencias de
  // mayúsculas, acentos y separadores ("Precio Compra" == "precio_compra").
  const normalizedRow: Record<string, unknown> = {}
  for (const [header, value] of Object.entries(row)) {
    const key = normalizeHeader(header)
    if (!(key in normalizedRow)) normalizedRow[key] = value
  }

  for (const [excelCol, field] of Object.entries(COLUMN_MAP)) {
    const raw = normalizedRow[normalizeHeader(excelCol)]
    if (raw === undefined) continue

    if (field === "categoryName") {
      const name = parseCell(raw)
      if (!name) continue
      const id = categoryByName[name.toLowerCase()]
      if (!id) return { mapped: {}, error: `Categoría "${name}" no encontrada en el sistema` }
      mapped.categoryId = id
    } else if (["purchasePrice", "salePrice", "stock", "minimumStock"].includes(field)) {
      mapped[field] = parseNumber(raw)
    } else {
      mapped[field] = parseCell(raw)
    }
  }

  if (!mapped.categoryId) mapped.categoryId = defaultCategoryId
  if (!mapped.unit) mapped.unit = "unidad"
  return { mapped }
}
