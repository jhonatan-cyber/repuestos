// @ts-nocheck
// scripts/generate-types.ts
// Run: pnpm types:generate
// Generates lib/types.ts from prisma/base/models.prisma (single source of truth)

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE_SCHEMA = path.resolve(__dirname, "../prisma/base/models.prisma")
const TYPES_OUTPUT = path.resolve(__dirname, "../lib/types.ts")

// Field type mappings Prisma → TypeScript
const TYPE_MAP: Record<string, string> = {
  String: "string",
  Int: "number",
  Float: "number",
  Boolean: "boolean",
  DateTime: "string",
  Json: "Record<string, unknown>",
}

// Model name to TypeScript interface name
function toInterfaceName(modelName: string): string {
  return modelName.charAt(0).toUpperCase() + modelName.slice(1)
}

// Special types that need custom definitions
const SPECIAL_TYPES: Record<string, string> = {
  User: `export interface User {
  id: EntityId
  ci: string
  firstName: string
  lastName: string
  address: string
  phone: string
  email: string
  role: string
  permissions?: string[]
  status: "active" | "inactive"
  createdAt: string
  name?: string
}`,
  Sale: `export interface Sale {
  id: EntityId
  date: string
  clientId: EntityId
  clientName?: string
  sellerUserId: EntityId
  sellerName?: string
  items: SaleItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethod: "efectivo" | "transferencia" | "crédito" | "qr" | "mixto"
  paymentSplits?: PaymentSplit[]
  notes?: string
  status: "completada" | "pendiente" | "cancelada"
  createdAt: string
}`,
  SaleItem: `export interface SaleItem {
  productId: EntityId
  productName?: string
  quantity: number
  price: number
  subtotal: number
}`,
  PaymentSplit: `export interface PaymentSplit {
  method: string
  amount: number
  reference?: string
}`,
  Quotation: `export interface Quotation {
  id: EntityId
  date: string
  clientId?: EntityId | null
  externalClientName?: string | null
  clientName?: string
  sellerUserId: EntityId
  sellerName?: string
  items: QuotationItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  validUntil: string
  status: QuotationStatus
  convertedToSaleId: EntityId | null
  createdAt: string
}`,
  QuotationItem: `export interface QuotationItem {
  productId: EntityId
  productName?: string
  quantity: number
  price: number
  subtotal: number
}`,
  Commission: `export interface Commission {
  id: EntityId
  sellerId: EntityId
  sellerName?: string
  saleId: EntityId
  saleInfo?: { id: EntityId; date: string; clientName: string; total: number }
  amount: number
  percentage: number
  date: string
  status: "completada" | "pendiente"
}`,
  CashRecord: `export interface CashRecord {
  id: EntityId
  date: string
  openingBalance: number
  cashIncome: number
  cashExpenses: number
  closingBalance: number
  notes: string | null
  userId: EntityId
  userName?: string
  status: "open" | "closed"
  closedAt?: string | null
  withdrawals?: CashWithdrawal[]
}`,
  CashWithdrawal: `export interface CashWithdrawal {
  id: EntityId
  amount: number
  reason: string
  createdAt: string
  userId: EntityId
  userName?: string
}`,
  Purchase: `export interface Purchase {
  id: EntityId
  date: string
  supplierId: EntityId
  supplierName?: string
  buyerUserId: EntityId
  buyerName?: string
  items: PurchaseItem[]
  subtotal: number
  tax: number
  total: number
  status: "pendiente" | "recibida" | "cancelada"
  createdAt: string
}`,
  PurchaseItem: `export interface PurchaseItem {
  productId: EntityId
  productName?: string
  quantity: number
  price: number
}`,
  Expense: `export interface Expense {
  id: EntityId
  name: string
  amount: number
  description: string
  category?: string
  date: string | Date
  createdAt: string
}`,
  ExpenseInput: `export interface ExpenseInput {
  name: string
  amount: number
  description: string
  category?: string
  date: string | Date
}`,
}

function parseModel(block: string, modelName: string): string {
  if (SPECIAL_TYPES[modelName]) {
    return SPECIAL_TYPES[modelName]
  }

  const fields: string[] = []

  const lines = block.split("\n")
  for (const line of lines) {
    const trimmed = line.trim()

    // Skip meta directives and empty lines
    if (trimmed.startsWith("@@") || trimmed === "") continue

    // Relation field: ModelName[] or ModelName?
    const relationMatch = trimmed.match(
      /^(\w+)\s+(User|Client|Supplier|Category|Product|Sale|Purchase|Quotation|CashRecord|CashWithdrawal|Role|Expense|Commission)\[\]$/,
    )
    if (relationMatch) {
      continue
    }

    // Field: name Type
    const fieldMatch = trimmed.match(
      /^(\w+)\s+(String|Int|Float|Boolean|DateTime|Json)(\?)?(\s+\/\/.*)?$/,
    )
    if (fieldMatch) {
      const fieldName = fieldMatch[1]
      const fieldType = fieldMatch[2]
      const nullable = fieldMatch[3] === "?"
      const comment = fieldMatch[4] || ""

      let tsType = TYPE_MAP[fieldType]
      if (!tsType) tsType = fieldType
      if (nullable) tsType = tsType + " | null"

      if (comment.includes("TODO") || comment.includes("deprecated")) continue
      if (fieldName === "password" && !nullable) continue

      fields.push(`  ${fieldName}: ${tsType}${comment}`)
    }
  }

  return `export interface ${toInterfaceName(modelName)} {\n${fields.join("\n")}\n}`
}

async function run() {
  console.log("🔄 Generating TypeScript types from base schema...\n")

  const schema = fs.readFileSync(BASE_SCHEMA, "utf-8")

  const interfaces: string[] = []

  const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/gs
  let match

  while ((match = modelRegex.exec(schema)) !== null) {
    const modelName = match[1]
    const block = match[2]

    if (SPECIAL_TYPES[modelName]) {
      interfaces.push(SPECIAL_TYPES[modelName])
    } else {
      interfaces.push(parseModel(block, modelName))
    }
  }

  const output = `// ============================================
// AUTO-GENERATED - Do not edit manually
// Generated from: prisma/base/models.prisma
// Run: pnpm types:generate
// ============================================

import type { QuotationStatus } from "@/lib/quotation-status"

export type EntityId = string | number

${interfaces.join("\n\n")}

// Additional types
export interface SupplierInput {
  name: string
  company?: string | null
  phone: string
  direccion?: string | null
  address?: string | null
}
`

  fs.writeFileSync(TYPES_OUTPUT, output, "utf-8")
  console.log("✅ Generated:", TYPES_OUTPUT)

  const count = (output.match(/export interface/g) || []).length
  console.log(`📋 Generated ${count} TypeScript interfaces`)
}

run()
  .then(() => {
    console.log("Done")
    process.exit(0)
  })
  .catch((err) => {
    console.error("❌ Error:", err)
    process.exit(1)
  })
