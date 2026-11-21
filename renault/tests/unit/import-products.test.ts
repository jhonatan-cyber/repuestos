import { describe, it, expect } from "vitest"
import {
  parseCell,
  parseNumber,
  mapRowToProduct,
  normalizeHeader,
  COLUMN_MAP,
  EXTENDED_PRODUCT_SCHEMA,
} from "@/lib/import-products"

// ============================================
// parseCell
// ============================================
describe("parseCell", () => {
  it("devuelve string vacío para null", () => {
    expect(parseCell(null)).toBe("")
  })

  it("devuelve string vacío para undefined", () => {
    expect(parseCell(undefined)).toBe("")
  })

  it("convierte número a string", () => {
    expect(parseCell(123)).toBe("123")
  })

  it("convierte número decimal a string", () => {
    expect(parseCell(123.45)).toBe("123.45")
  })

  it("trimmea espacios", () => {
    expect(parseCell("  hola  ")).toBe("hola")
  })

  it("devuelve el string ya limpio", () => {
    expect(parseCell("Filtro de aceite")).toBe("Filtro de aceite")
  })

  it("maneja booleanos", () => {
    expect(parseCell(true)).toBe("true")
  })
})

// ============================================
// parseNumber
// ============================================
describe("parseNumber", () => {
  it("devuelve 0 para null", () => {
    expect(parseNumber(null)).toBe(0)
  })

  it("devuelve 0 para undefined", () => {
    expect(parseNumber(undefined)).toBe(0)
  })

  it("parsea número simple", () => {
    expect(parseNumber(15000)).toBe(15000)
  })

  it("parsea string numérico", () => {
    expect(parseNumber("15000")).toBe(15000)
  })

  it("parsea con coma decimal", () => {
    expect(parseNumber("85,50")).toBe(85.5)
  })

  it("parsea con puntos de miles y coma decimal", () => {
    expect(parseNumber("1.250,75")).toBe(1250.75)
  })

  it("parsea string con espacios", () => {
    expect(parseNumber("  99.99  ")).toBe(99.99)
  })

  it("limpia caracteres no numéricos", () => {
    expect(parseNumber("$ 1.500,00")).toBe(1500)
  })

  it("devuelve 0 para texto no numérico", () => {
    expect(parseNumber("no-es-un-numero")).toBe(0)
  })

  it("devuelve 0 para string vacío", () => {
    expect(parseNumber("")).toBe(0)
  })

  it("parsea negativo", () => {
    expect(parseNumber("-50")).toBe(-50)
  })

  it("parsea cero", () => {
    expect(parseNumber(0)).toBe(0)
  })
})

// ============================================
// COLUMN_MAP — cobertura de mapeo
// ============================================
describe("COLUMN_MAP", () => {
  const fieldNames = [
    "code",
    "name",
    "brand",
    "model",
    "purchasePrice",
    "salePrice",
    "stock",
    "minimumStock",
    "unit",
    "description",
    "categoryName",
  ]

  for (const field of fieldNames) {
    it(`tiene al menos una columna mapeada a "${field}"`, () => {
      const entries = Object.entries(COLUMN_MAP).filter(([, v]) => v === field)
      expect(entries.length).toBeGreaterThanOrEqual(1)
    })
  }

  it("tiene variantes en español para cada campo", () => {
    const spanishVariants = Object.keys(COLUMN_MAP).filter(
      (k) =>
        !/^[a-zA-Z]+$/.test(k) ||
        k === "code" ||
        k === "name" ||
        k === "brand" ||
        k === "model" ||
        k === "unit" ||
        k === "stock" ||
        k === "description" ||
        k === "category",
    )
    expect(spanishVariants.length).toBeGreaterThanOrEqual(10)
  })

  it("ninguna columna contiene espacios al inicio/final", () => {
    for (const key of Object.keys(COLUMN_MAP)) {
      expect(key.trim()).toBe(key)
    }
  })

  it("ningún valor tiene espacios al inicio/final", () => {
    for (const val of Object.values(COLUMN_MAP)) {
      expect(val.trim()).toBe(val)
    }
  })
})

// ============================================
// EXTENDED_PRODUCT_SCHEMA
// ============================================
describe("EXTENDED_PRODUCT_SCHEMA", () => {
  it("acepta datos válidos mínimos", () => {
    const result = EXTENDED_PRODUCT_SCHEMA.safeParse({
      code: "A001",
      name: "Filtro de aceite",
      categoryId: "cat-1",
      purchasePrice: 100,
      salePrice: 150,
      stock: 10,
      minimumStock: 3,
      unit: "unidad",
    })
    expect(result.success).toBe(true)
  })

  it('marca y modelo son opcionales (default "")', () => {
    const result = EXTENDED_PRODUCT_SCHEMA.safeParse({
      code: "A001",
      name: "Producto",
      categoryId: "cat-1",
      purchasePrice: 100,
      salePrice: 150,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.brand).toBe("")
      expect(result.data.model).toBe("")
    }
  })

  it("rechaza código vacío", () => {
    const result = EXTENDED_PRODUCT_SCHEMA.safeParse({
      code: "",
      name: "Producto",
      categoryId: "cat-1",
      purchasePrice: 100,
      salePrice: 150,
    })
    expect(result.success).toBe(false)
  })

  it("rechaza precio de compra negativo", () => {
    const result = EXTENDED_PRODUCT_SCHEMA.safeParse({
      code: "A001",
      name: "Producto",
      categoryId: "cat-1",
      purchasePrice: -10,
      salePrice: 150,
    })
    expect(result.success).toBe(false)
  })

  it("acepta image como string", () => {
    const result = EXTENDED_PRODUCT_SCHEMA.safeParse({
      code: "A001",
      name: "Producto",
      categoryId: "cat-1",
      purchasePrice: 100,
      salePrice: 150,
      image: "https://ejemplo.com/foto.jpg",
    })
    expect(result.success).toBe(true)
  })

  it("acepta image como null", () => {
    const result = EXTENDED_PRODUCT_SCHEMA.safeParse({
      code: "A001",
      name: "Producto",
      categoryId: "cat-1",
      purchasePrice: 100,
      salePrice: 150,
      image: null,
    })
    expect(result.success).toBe(true)
  })

  it("acepta image como undefined", () => {
    const result = EXTENDED_PRODUCT_SCHEMA.safeParse({
      code: "A001",
      name: "Producto",
      categoryId: "cat-1",
      purchasePrice: 100,
      salePrice: 150,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.image).toBeUndefined()
    }
  })
})

// ============================================
// mapRowToProduct
// ============================================
describe("mapRowToProduct", () => {
  const defaultCategoryId = "cat-default"
  const categoryByName = {
    repuestos: "cat-repuestos",
    accesorios: "cat-accesorios",
  }

  it("mapea una fila completa correctamente", () => {
    const row = {
      código: "A001",
      nombre: "Filtro de aceite",
      marca: "Bosch",
      modelo: "W712/8",
      precio_compra: 15000,
      precio_venta: 25000,
      stock: 10,
      stock_mínimo: 3,
      unidad: "unidad",
      descripción: "Filtro original Bosch",
    }

    const result = mapRowToProduct(row, defaultCategoryId, categoryByName)
    expect(result.error).toBeUndefined()
    expect(result.mapped.code).toBe("A001")
    expect(result.mapped.name).toBe("Filtro de aceite")
    expect(result.mapped.brand).toBe("Bosch")
    expect(result.mapped.model).toBe("W712/8")
    expect(result.mapped.purchasePrice).toBe(15000)
    expect(result.mapped.salePrice).toBe(25000)
    expect(result.mapped.stock).toBe(10)
    expect(result.mapped.minimumStock).toBe(3)
    expect(result.mapped.unit).toBe("unidad")
    expect(result.mapped.description).toBe("Filtro original Bosch")
  })

  it("usa categoría por defecto si no se especifica", () => {
    const row = {
      código: "A002",
      nombre: "Bujía",
      precio_compra: 5000,
      precio_venta: 8000,
    }

    const result = mapRowToProduct(row, defaultCategoryId, categoryByName)
    expect(result.mapped.categoryId).toBe(defaultCategoryId)
  })

  it("resuelve categoría por nombre", () => {
    const row = {
      código: "A003",
      nombre: "Kit pastillas de freno",
      categoria: "Repuestos",
      precio_compra: 30000,
      precio_venta: 45000,
    }

    const result = mapRowToProduct(row, defaultCategoryId, categoryByName)
    expect(result.mapped.categoryId).toBe("cat-repuestos")
  })

  it("devuelve error si la categoría no existe", () => {
    const row = {
      código: "A004",
      nombre: "Alfombra",
      categoria: "Inexistente",
      precio_compra: 10000,
      precio_venta: 20000,
    }

    const result = mapRowToProduct(row, defaultCategoryId, categoryByName)
    expect(result.error).toContain("Inexistente")
  })

  it('usa "unidad" por defecto si no se especifica unidad', () => {
    const row = {
      código: "A005",
      nombre: "Lámpara",
      precio_compra: 5000,
      precio_venta: 10000,
    }

    const result = mapRowToProduct(row, defaultCategoryId, categoryByName)
    expect(result.mapped.unit).toBe("unidad")
  })

  it("usa la unidad del Excel si se especifica", () => {
    const row = {
      código: "A006",
      nombre: "Aceite 20W50",
      unidad: "litro",
      precio_compra: 12000,
      precio_venta: 18000,
    }

    const result = mapRowToProduct(row, defaultCategoryId, categoryByName)
    expect(result.mapped.unit).toBe("litro")
  })

  it("mapea columnas en inglés", () => {
    const row = {
      code: "A007",
      name: "Battery",
      brand: "VARTA",
      model: "E11",
      unit: "unit",
      description: "Car battery 12V",
      category: "Repuestos",
      purchasePrice: 50000,
      salePrice: 75000,
      stock: 5,
      minimumStock: 2,
    }

    const result = mapRowToProduct(row, defaultCategoryId, categoryByName)
    expect(result.mapped.code).toBe("A007")
    expect(result.mapped.name).toBe("Battery")
    expect(result.mapped.brand).toBe("VARTA")
    expect(result.mapped.categoryId).toBe("cat-repuestos")
  })

  it("mapea columnas con espacios en el nombre", () => {
    const row = {
      código: "A009",
      nombre: "Radiador",
      "precio compra": 70000,
      "precio venta": 100000,
      "stock mínimo": 2,
    }

    const result = mapRowToProduct(row, defaultCategoryId, categoryByName)
    expect(result.mapped.purchasePrice).toBe(70000)
    expect(result.mapped.salePrice).toBe(100000)
    expect(result.mapped.minimumStock).toBe(2)
  })

  it("mapea columnas con mayúsculas", () => {
    const row = {
      CODIGO: "A010",
      NOMBRE: "Tensor",
      MARCA: "Dayco",
      PRECIO_COMPRA: 25000,
      PRECIO_VENTA: 40000,
    }

    const result = mapRowToProduct(row, defaultCategoryId, categoryByName)
    expect(result.mapped.code).toBe("A010")
    expect(result.mapped.name).toBe("Tensor")
    expect(result.mapped.brand).toBe("Dayco")
  })

  it("maneja fila vacía correctamente", () => {
    const row = {} as Record<string, unknown>

    const result = mapRowToProduct(row, defaultCategoryId, categoryByName)
    // No debería explotar, debería devolver defaults
    expect(result.error).toBeUndefined()
    expect(result.mapped.categoryId).toBe(defaultCategoryId)
    expect(result.mapped.unit).toBe("unidad")
  })

  it("maneja fila con valores numéricos", () => {
    const row = {
      código: "A011",
      nombre: "Correa distribución",
      precio_compra: 45000,
      precio_venta: 65000,
      stock: 8,
      stock_minimo: 2,
    }

    const result = mapRowToProduct(row, defaultCategoryId, categoryByName)
    expect(result.mapped.stock).toBe(8)
    expect(result.mapped.minimumStock).toBe(2)
  })

  it("ignora columnas que no están en COLUMN_MAP", () => {
    const row = {
      código: "A012",
      nombre: "Filtro aire",
      columna_extra: "esto se ignora",
      precio_compra: 20000,
      precio_venta: 35000,
    }

    const result = mapRowToProduct(row, defaultCategoryId, categoryByName)
    expect(result.error).toBeUndefined()
    expect(result.mapped.code).toBe("A012")
    expect((result.mapped as any).columna_extra).toBeUndefined()
  })

  it('mapea "existencia" como stock', () => {
    const row = {
      código: "A013",
      nombre: "Alternador",
      existencia: 15,
      precio_compra: 120000,
      precio_venta: 180000,
    }

    const result = mapRowToProduct(row, defaultCategoryId, categoryByName)
    expect(result.mapped.stock).toBe(15)
  })

  it('mapea "categoryname" como categoryName', () => {
    const row = {
      código: "A014",
      nombre: "Paragolpes",
      categoryname: "Accesorios",
      precio_compra: 80000,
      precio_venta: 120000,
    }

    const result = mapRowToProduct(row, defaultCategoryId, categoryByName)
    expect(result.mapped.categoryId).toBe("cat-accesorios")
  })
})

// ============================================
// normalizeHeader
// ============================================
describe("normalizeHeader", () => {
  it("quita acentos", () => {
    expect(normalizeHeader("código")).toBe("codigo")
    expect(normalizeHeader("Categoría")).toBe("categoria")
    expect(normalizeHeader("descripción")).toBe("descripcion")
  })

  it("lowercasea", () => {
    expect(normalizeHeader("CODIGO")).toBe("codigo")
    expect(normalizeHeader("Nombre")).toBe("nombre")
  })

  it("elimina espacios, guiones y guiones bajos", () => {
    expect(normalizeHeader("precio compra")).toBe("preciocompra")
    expect(normalizeHeader("precio_compra")).toBe("preciocompra")
    expect(normalizeHeader("precio-compra")).toBe("preciocompra")
    expect(normalizeHeader("  stock   mínimo  ")).toBe("stockminimo")
  })

  it("normaliza de forma equivalente a varias variantes del mismo campo", () => {
    const variants = ["código", "Código", "CODIGO", "codigo", "codigo "]
    const normalized = new Set(variants.map(normalizeHeader))
    expect(normalized.size).toBe(1)
  })
})

// ============================================
// mapRowToProduct — encabezados escritos por humanos
// ============================================
describe("mapRowToProduct con encabezados no normalizados", () => {
  const defaultCategoryId = "cat-default"
  const categoryByName = { repuestos: "cat-repuestos" }

  it("mapea encabezados capitalizados con acentos", () => {
    const row = {
      Código: "B001",
      Nombre: "Filtro de aire",
      Marca: "Mann",
      Modelo: "C3012",
      "Precio Compra": 12000,
      "Precio Venta": 20000,
      Stock: 4,
      Categoría: "Repuestos",
    }

    const result = mapRowToProduct(row, defaultCategoryId, categoryByName)
    expect(result.error).toBeUndefined()
    expect(result.mapped.code).toBe("B001")
    expect(result.mapped.name).toBe("Filtro de aire")
    expect(result.mapped.brand).toBe("Mann")
    expect(result.mapped.purchasePrice).toBe(12000)
    expect(result.mapped.salePrice).toBe(20000)
    expect(result.mapped.stock).toBe(4)
    expect(result.mapped.categoryId).toBe("cat-repuestos")
  })

  it("mapea encabezados en Title Case con espacios", () => {
    const row = {
      Codigo: "B002",
      Nombre: "Bujía",
      "Precio Compra": 5000,
      "Precio Venta": 8000,
      "Stock Minimo": 2,
    }

    const result = mapRowToProduct(row, defaultCategoryId, categoryByName)
    expect(result.mapped.code).toBe("B002")
    expect(result.mapped.purchasePrice).toBe(5000)
    expect(result.mapped.minimumStock).toBe(2)
  })

  it("sigue ignorando columnas desconocidas", () => {
    const row = {
      Código: "B003",
      Nombre: "Producto",
      columna_inventada: "ignorar",
      "Precio Compra": 100,
      "Precio Venta": 200,
    }

    const result = mapRowToProduct(row, defaultCategoryId, categoryByName)
    expect(result.error).toBeUndefined()
    expect((result.mapped as any).columna_inventada).toBeUndefined()
    expect(result.mapped.code).toBe("B003")
  })
})
