import { describe, it, expect } from "vitest"
import {
  ProductSchema,
  ClientSchema,
  SupplierSchema,
  UserSchema,
  RoleSchema,
  CategorySchema,
  SaleSchema,
  PurchaseSchema,
  QuotationSchema,
  ExpenseSchema,
  CommissionSchema,
  CashRecordSchema,
  PermissionSchema,
} from "@/lib/validations"

describe("ProductSchema", () => {
  const valid = {
    code: "P001",
    name: "Producto de prueba",
    brand: "Marca X",
    model: "Modelo Y",
    categoryId: 1,
    purchasePrice: 10.5,
    salePrice: 25.0,
    stock: 100,
    minimumStock: 5,
    unit: "unidad",
  }

  it("accepts valid product", () => {
    expect(ProductSchema.safeParse(valid).success).toBe(true)
  })

  it("rejects empty code", () => {
    const res = ProductSchema.safeParse({ ...valid, code: "" })
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error.issues[0].message).toContain("código es requerido")
  })

  it("rejects short name", () => {
    const res = ProductSchema.safeParse({ ...valid, name: "AB" })
    expect(res.success).toBe(false)
  })

  it("rejects negative stock", () => {
    const res = ProductSchema.safeParse({ ...valid, stock: -1 })
    expect(res.success).toBe(false)
  })

  it("accepts optional fields omitted", () => {
    const res = ProductSchema.safeParse(valid)
    expect(res.success).toBe(true)
  })

  it("accepts supplierId as number", () => {
    expect(ProductSchema.safeParse({ ...valid, supplierId: 1 }).success).toBe(true)
  })

  it("rejects zero purchasePrice", () => {
    const res = ProductSchema.safeParse({ ...valid, purchasePrice: 0 })
    expect(res.success).toBe(false)
  })
})

describe("ClientSchema", () => {
  const valid = { name: "Juan Pérez", phone: "123456789" }

  it("accepts valid client", () => {
    expect(ClientSchema.safeParse(valid).success).toBe(true)
  })

  it("accepts optional fields", () => {
    expect(ClientSchema.safeParse({ ...valid, address: "" }).success).toBe(true)
  })

  it("rejects short name", () => {
    const res = ClientSchema.safeParse({ ...valid, name: "AB" })
    expect(res.success).toBe(false)
  })
})

describe("SupplierSchema", () => {
  const valid = { name: "Proveedor X", phone: "123456789" }

  it("accepts valid supplier", () => {
    expect(SupplierSchema.safeParse(valid).success).toBe(true)
  })

  it("accepts optional fields", () => {
    expect(
      SupplierSchema.safeParse({ ...valid, company: null, direccion: null, address: null }).success,
    ).toBe(true)
  })

  it("rejects short name", () => {
    const res = SupplierSchema.safeParse({ name: "AB", phone: "123456789" })
    expect(res.success).toBe(false)
  })
})

describe("UserSchema", () => {
  const valid = {
    ci: "12345678",
    firstName: "Juan",
    lastName: "Pérez",
    address: "Calle Falsa 123",
    phone: "123456789",
    email: "juan@ejemplo.com",
    role: "vendedor",
    password: "123456",
  }

  it("accepts valid user", () => {
    expect(UserSchema.safeParse(valid).success).toBe(true)
  })

  it("rejects short CI", () => {
    const res = UserSchema.safeParse({ ...valid, ci: "123" })
    expect(res.success).toBe(false)
  })

  it("rejects invalid email", () => {
    const res = UserSchema.safeParse({ ...valid, email: "invalido" })
    expect(res.success).toBe(false)
  })

  it("accepts optional password", () => {
    const { password, ...noPwd } = valid
    expect(UserSchema.safeParse(noPwd).success).toBe(true)
  })

  it("accepts optional status with default", () => {
    const res = UserSchema.safeParse(valid)
    if (res.success) {
      expect(res.data.status).toBe("active")
    }
  })
})

describe("RoleSchema", () => {
  const valid = {
    name: "Admin",
    description: "Descripción del rol",
    permissions: ["dashboard", "sales"],
  }

  it("accepts valid role", () => {
    expect(RoleSchema.safeParse(valid).success).toBe(true)
  })

  it("rejects empty permissions", () => {
    const res = RoleSchema.safeParse({ ...valid, permissions: [] })
    expect(res.success).toBe(false)
  })

  it("rejects invalid hex color", () => {
    const res = RoleSchema.safeParse({ ...valid, color: "not-a-color" })
    expect(res.success).toBe(false)
  })

  it("accepts valid hex color", () => {
    expect(RoleSchema.safeParse({ ...valid, color: "#FF5733" }).success).toBe(true)
  })
})

describe("CategorySchema", () => {
  const valid = { name: "Frenos", color: "#FF0000" }

  it("accepts valid category", () => {
    expect(CategorySchema.safeParse(valid).success).toBe(true)
  })

  it("rejects invalid hex color", () => {
    const res = CategorySchema.safeParse({ ...valid, color: "rojo" })
    expect(res.success).toBe(false)
  })

  it("accepts optional description", () => {
    expect(CategorySchema.safeParse({ ...valid, description: null }).success).toBe(true)
  })
})

describe("SaleSchema", () => {
  const validItem = { productId: "prod-1", quantity: 2, price: 25, subtotal: 50 }
  const valid = {
    date: "2026-07-28",
    sellerUserId: "user-1",
    items: [validItem],
    subtotal: 50,
    total: 50,
    paymentMethod: "efectivo",
    status: "completada",
  }

  it("accepts valid sale", () => {
    expect(SaleSchema.safeParse(valid).success).toBe(true)
  })

  it("rejects empty items", () => {
    const res = SaleSchema.safeParse({ ...valid, items: [] })
    expect(res.success).toBe(false)
  })

  it("rejects invalid paymentMethod", () => {
    const res = SaleSchema.safeParse({ ...valid, paymentMethod: "bitcoin" })
    expect(res.success).toBe(false)
  })

  it("rejects invalid status", () => {
    const res = SaleSchema.safeParse({ ...valid, status: "invalido" })
    expect(res.success).toBe(false)
  })

  it("accepts optional clientId as number", () => {
    expect(SaleSchema.safeParse({ ...valid, clientId: "client-1" }).success).toBe(true)
  })

  it("accepts optional clientId as empty string", () => {
    expect(SaleSchema.safeParse({ ...valid, clientId: "" }).success).toBe(true)
  })

  it("defaults tax to 0", () => {
    const res = SaleSchema.safeParse(valid)
    if (res.success) expect(res.data.tax).toBe(0)
  })
})

describe("PurchaseSchema", () => {
  const validItem = { productId: "1", quantity: 5, price: 10 }
  const valid = {
    date: "2026-07-28",
    supplierId: "1",
    buyerUserId: "1",
    items: [validItem],
    subtotal: 50,
    total: 50,
  }

  it("accepts valid purchase", () => {
    expect(PurchaseSchema.safeParse(valid).success).toBe(true)
  })

  it("defaults paymentMethod to efectivo", () => {
    const res = PurchaseSchema.safeParse(valid)
    if (res.success) expect(res.data.paymentMethod).toBe("efectivo")
  })

  it("defaults status to recibida", () => {
    const res = PurchaseSchema.safeParse(valid)
    if (res.success) expect(res.data.status).toBe("recibida")
  })
})

describe("QuotationSchema", () => {
  const validItem = { productId: "prod-1", quantity: 2, price: 25, subtotal: 50 }
  const valid = {
    date: "2026-07-28",
    sellerUserId: "user-1",
    items: [validItem],
    subtotal: 50,
    total: 50,
    validUntil: "2026-08-28",
  }

  it("accepts valid quotation", () => {
    expect(QuotationSchema.safeParse(valid).success).toBe(true)
  })

  it("defaults status to pendiente", () => {
    const res = QuotationSchema.safeParse(valid)
    if (res.success) expect(res.data.status).toBe("pendiente")
  })
})

describe("ExpenseSchema", () => {
  const valid = {
    name: "Luz",
    amount: 150,
    description: "Factura de electricidad",
    date: "2026-07-28",
  }

  it("accepts valid expense", () => {
    expect(ExpenseSchema.safeParse(valid).success).toBe(true)
  })

  it("rejects negative amount", () => {
    const res = ExpenseSchema.safeParse({ ...valid, amount: -10 })
    expect(res.success).toBe(false)
  })
})

describe("CommissionSchema", () => {
  const valid = { sellerId: 1, saleId: 1, amount: 50, percentage: 5, date: "2026-07-28" }

  it("accepts valid commission", () => {
    expect(CommissionSchema.safeParse(valid).success).toBe(true)
  })

  it("rejects percentage over 100", () => {
    const res = CommissionSchema.safeParse({ ...valid, percentage: 150 })
    expect(res.success).toBe(false)
  })

  it("accepts percentage at boundary", () => {
    expect(CommissionSchema.safeParse({ ...valid, percentage: 0 }).success).toBe(true)
    expect(CommissionSchema.safeParse({ ...valid, percentage: 100 }).success).toBe(true)
  })
})

describe("CashRecordSchema", () => {
  const valid = { date: "2026-07-28", openingBalance: 1000, closingBalance: 800, userId: "1" }

  it("accepts valid cash record", () => {
    expect(CashRecordSchema.safeParse(valid).success).toBe(true)
  })
})

describe("PermissionSchema", () => {
  const valid = {
    id: "sales.view",
    name: "Ver ventas",
    module: "sales",
    description: "Permite ver el módulo de ventas",
    category: "ventas",
  }

  it("accepts valid permission", () => {
    expect(PermissionSchema.safeParse(valid).success).toBe(true)
  })

  it("rejects short description", () => {
    const res = PermissionSchema.safeParse({ ...valid, description: "abc" })
    expect(res.success).toBe(false)
  })
})
