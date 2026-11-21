import { logger } from "@/lib/logger"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/api-utils"
import { getApiActor, hasAnyPermission } from "@/lib/api-security"
import { RATE_LIMITS, checkRateLimit, getClientKey } from "@/lib/rate-limit"
import { isElectronRuntime } from "@/lib/runtime-env"
import { COLUMN_MAP, EXTENDED_PRODUCT_SCHEMA, mapRowToProduct } from "@/lib/import-products"
import ExcelJS from "exceljs"
import type { Prisma } from "@prisma/client"

function cellToPrimitive(value: ExcelJS.CellValue): string | number | boolean | null {
  if (value === null || value === undefined) return null
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value
  }
  if (typeof value === "object") {
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((t) => t.text).join("")
    }
    if ("text" in value) return String((value as { text: unknown }).text ?? "")
    if ("result" in value) {
      const r = (value as { result: unknown }).result
      if (typeof r === "string" || typeof r === "number" || typeof r === "boolean") return r
    }
    if (value instanceof Date) return value.toISOString()
  }
  return String(value)
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getApiActor(request)
    if (!actor) return createErrorResponse("No autenticado", 401)
    if (!hasAnyPermission(actor, ["products.create", "products.all", "products"])) {
      return createErrorResponse("Sin permisos para importar productos", 403)
    }
    const rl = checkRateLimit(
      `import:${getClientKey(request)}`,
      RATE_LIMITS.sensitive.limit,
      RATE_LIMITS.sensitive.windowMs,
    )
    if (!rl.allowed) return createErrorResponse("Demasiadas importaciones, intentá más tarde", 429)
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const categoryIdRaw = formData.get("categoryId") as string | null

    if (!file) {
      return createErrorResponse("Debés subir un archivo Excel", 400)
    }

    const categoryId = categoryIdRaw?.trim() ?? ""
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith(".xlsx")) {
      return createErrorResponse("El archivo debe ser .xlsx", 400)
    }

    const bytes = await file.arrayBuffer()
    const workbook = new ExcelJS.Workbook()

    // exceljs acepta ArrayBuffer/Uint8Array en runtime (jszip); el cast evita el
    // desajuste de tipos de Buffer entre @types/node v25 y los tipos internos de
    // exceljs.
    //
    // IMPORTANTE: hay que conservar el `this`. load() es un método de la instancia
    // de exceljs y usa `this.parseRels(...)`; si se deja suelto (`const load =
    // workbook.xlsx.load`) el `this` queda undefined y exceljs revienta con
    // "Cannot read properties of undefined (reading 'parseRels')".
    const loadXlsx = workbook.xlsx.load.bind(workbook.xlsx) as unknown as (
      data: ArrayBuffer,
    ) => Promise<ExcelJS.Workbook>
    await loadXlsx(bytes)
    const sheet = workbook.worksheets[0]
    if (!sheet) {
      return createErrorResponse("El archivo Excel está vacío", 400)
    }

    const headers: string[] = []
    sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, col) => {
      headers[col - 1] = String(cellToPrimitive(cell.value) ?? "").trim()
    })
    const rawRows: Record<string, unknown>[] = []
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return
      const obj: Record<string, unknown> = {}
      row.eachCell({ includeEmpty: true }, (cell, col) => {
        const header = headers[col - 1]
        if (header) obj[header] = cellToPrimitive(cell.value)
      })
      if (Object.values(obj).some((v) => v !== null && String(v).trim() !== "")) {
        rawRows.push(obj)
      }
    })
    if (rawRows.length === 0) {
      return createErrorResponse("El archivo Excel no contiene datos", 400)
    }

    const hasBrandCol = await getProductColumns()
    const results = { created: 0, errors: [] as { row: number; reason: string }[] }
    const productsToCreate: { row: number; data: Prisma.ProductCreateManyInput }[] = []

    // build category name→id map for Excel rows that specify category by name
    const allCategories = await prisma.category.findMany({ select: { id: true, name: true } })
    const categoryByName: Record<string, string> = {}
    for (const cat of allCategories) {
      const key = cat.name.toLowerCase().trim()
      categoryByName[key] = String(cat.id)
    }

    // fallback: primera categoría existente si el cliente no mandó una
    let defaultCategoryId = categoryId
    if (!defaultCategoryId && allCategories.length > 0) {
      defaultCategoryId = String(allCategories[0].id)
    }

    // Pre-create unknown categories found in Excel
    const categoryColKeys = Object.entries(COLUMN_MAP)
      .filter(([, field]) => field === "categoryName")
      .map(([col]) => col)
    const unknownCategories = new Map<string, string>() // lowercase → original name
    for (const row of rawRows) {
      for (const col of categoryColKeys) {
        const raw = row[col] ?? row[col.toLowerCase()] ?? row[col.toUpperCase()]
        if (!raw) continue
        const name = String(raw).trim()
        if (!name) continue
        const key = name.toLowerCase()
        if (!categoryByName[key]) unknownCategories.set(key, name)
      }
    }
    if (unknownCategories.size > 0) {
      for (const [key, originalName] of unknownCategories) {
        const created = await prisma.category.create({
          data: { name: originalName, color: "#64748b", type: "product" },
          select: { id: true },
        })
        categoryByName[key] = created.id
      }
    }

    for (let i = 0; i < rawRows.length; i++) {
      const rowNum = i + 2 // 1-indexed + header row
      const { mapped, error: mapError } = mapRowToProduct(
        rawRows[i],
        defaultCategoryId,
        categoryByName,
      )
      if (mapError) {
        results.errors.push({ row: rowNum, reason: mapError })
        continue
      }

      if (!mapped.categoryId) {
        results.errors.push({
          row: rowNum,
          reason:
            "No se pudo determinar la categoría: incluí una columna 'categoría' en el Excel o creá una categoría antes",
        })
        continue
      }

      const parsed = EXTENDED_PRODUCT_SCHEMA.safeParse(mapped)
      if (!parsed.success) {
        const issues = parsed.error.issues
          .map((iss) => `${iss.path.join(".")}: ${iss.message}`)
          .join("; ")
        results.errors.push({ row: rowNum, reason: issues })
        continue
      }

      const data: Prisma.ProductCreateManyInput = {
        code: parsed.data.code,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        categoryId: String(parsed.data.categoryId),
        purchasePrice: parsed.data.purchasePrice,
        salePrice: parsed.data.salePrice,
        stock: parsed.data.stock,
        minimumStock: parsed.data.minimumStock,
        unit: parsed.data.unit,
        supplierId: parsed.data.supplierId != null ? String(parsed.data.supplierId) : null,
        image: null,
        brand: "",
        model: "",
        isDeleted: false,
      }
      if (hasBrandCol) data.brand = parsed.data.brand || "Sin marca"
      if (hasBrandCol) data.model = parsed.data.model || "Sin modelo"

      productsToCreate.push({ row: rowNum, data })
    }

    // Códigos que ya existen en la DB o que se repiten dentro del mismo archivo.
    // Antes un solo duplicado hacía fallar TODO el archivo con 409 y no se
    // importaba ninguna fila; ahora cada problema se reporta por fila.
    const existingCodes = await findExistingCodes(productsToCreate.map((p) => p.data.code))
    const seenCodes = new Set<string>()
    const rowsToCreate: Prisma.ProductCreateManyInput[] = []

    for (const { row, data } of productsToCreate) {
      if (existingCodes.has(data.code)) {
        results.errors.push({
          row,
          reason: `El código "${data.code}" ya existe en el sistema`,
        })
        continue
      }
      if (seenCodes.has(data.code)) {
        results.errors.push({
          row,
          reason: `El código "${data.code}" está duplicado en el archivo`,
        })
        continue
      }
      seenCodes.add(data.code)
      rowsToCreate.push(data)
    }

    if (rowsToCreate.length > 0) {
      await prisma.product.createMany({ data: rowsToCreate })
      results.created = rowsToCreate.length
    }

    return createSuccessResponse(results)
  } catch (error) {
    logger.error("Error al importar productos", {
      error: error instanceof Error ? error.message : String(error),
    })
    return handleApiError(error, "Error al importar productos")
  }
}

/** Devuelve el set de códigos que ya existen en la tabla de productos. */
async function findExistingCodes(codes: string[]): Promise<Set<string>> {
  const existing = new Set<string>()
  const unique = [...new Set(codes)]
  const CHUNK = 500
  for (let i = 0; i < unique.length; i += CHUNK) {
    const found = await prisma.product.findMany({
      where: { code: { in: unique.slice(i, i + CHUNK) } },
      select: { code: true },
    })
    for (const p of found) existing.add(p.code)
  }
  return existing
}

async function getProductColumns(): Promise<boolean> {
  try {
    if (isElectronRuntime()) {
      const cols = await prisma.$queryRawUnsafe<Array<{ name: string }>>(
        `PRAGMA table_info("products")`,
      )
      return cols.some((c) => c.name === "brand")
    }
    const cols = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(
      `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='products'`,
    )
    return cols.some((c) => c.column_name === "brand")
  } catch {
    return true
  }
}
