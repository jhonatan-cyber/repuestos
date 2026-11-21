import type { QuotationStatus } from "@/lib/quotation-status"

export type EntityId = string | number

export interface User {
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
  image?: string | null
}

export interface Client {
  id?: EntityId
  name: string
  phone: string
  address: string | null
  status: "active" | "inactive"
  totalPurchases?: number
  lastSyncedAt: string | null
}

export interface Supplier {
  id: EntityId
  name: string
  company: string | null
  phone: string
  email: string | null
  direccion?: string | null
  address: string | null
  status: "active" | "inactive"
  totalPurchases?: number
  createdAt?: string
  lastSyncedAt: string | null
}

export interface Category {
  id: EntityId
  name: string
  color: string
  description: string | null
  type: "product" | "expense"
  status: "active" | "inactive"
  createdAt?: string
  lastSyncedAt?: string | null
}

export interface Product {
  id: EntityId
  code: string
  name: string
  description?: string | null
  brand: string
  model: string
  categoryId: string
  category?: string
  purchasePrice: number
  salePrice: number
  stock: number
  minimumStock?: number
  unit: string
  supplierId: string | null
  supplierName?: string
  status: "active" | "inactive"
  image: string | null
  lastSyncedAt: string | null
}

export interface Sale {
  id: EntityId
  date: string
  clientId: EntityId | null
  clientName?: string
  sellerUserId: EntityId
  sellerName?: string
  items: SaleItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  saleType?: "contado" | "credito"
  paymentMethod: "efectivo" | "transferencia" | "crédito" | "qr" | "mixto"
  paymentSplits?: PaymentSplit[]
  notes?: string
  status: "completada" | "pendiente" | "cancelada"
  createdAt: string
}

export interface SaleItem {
  productId: EntityId
  productName?: string
  quantity: number
  price: number
  subtotal: number
}

export interface PaymentSplit {
  method: "efectivo" | "transferencia" | "crédito" | "qr" | "mixto"
  amount: number
}

export interface Purchase {
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
  paymentMethod: "efectivo" | "transferencia" | "crédito" | "qr"
  status: "pendiente" | "recibida" | "cancelada"
  createdAt: string
}

export interface PurchaseItem {
  productId: EntityId
  productName?: string
  quantity: number
  price: number
}

export interface Quotation {
  id: EntityId
  date: string
  clientId?: EntityId | null
  externalClientName?: string | null
  externalClientPhone?: string | null
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
}

export interface SupplierRequest {
  id: EntityId
  quotationId: EntityId
  supplierId: EntityId
  supplierName?: string
  status: "pendiente" | "enviado" | "recibido" | "respondido"
  sentAt: string
  respondedAt: string | null
  notes: string | null
  response: string | null
  updatedAt: string
}

export interface SupplierRequestProduct {
  id: string
  code: string
  name: string
  description: string | null
  image: string | null
  quantity: number
}

export interface SupplierRequestWithProducts extends SupplierRequest {
  products: SupplierRequestProduct[]
  quotation: {
    date: string
    clientName: string
    total: number
    status: string
  }
}

export interface QuotationItem {
  productId: EntityId
  productName?: string
  quantity: number
  price: number
  subtotal: number
}

export interface Commission {
  id: EntityId
  sellerId: EntityId
  sellerName?: string
  saleId: EntityId
  saleInfo?: { id: EntityId; date: string; clientName: string; total: number }
  amount: number
  percentage: number
  date: string
  status: "completada" | "pendiente"
}

export interface Expense {
  id: EntityId
  name: string
  amount: number
  description: string
  category?: string
  date: string | Date
  createdAt: string
}

export interface ExpenseInput {
  name: string
  amount: number
  description: string
  category?: string
  date: string | Date
}

export interface CashRecord {
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
}

export interface CashWithdrawal {
  id: EntityId
  amount: number
  reason: string
  createdAt: string
  userId: EntityId
  userName?: string
}

export interface Role {
  id?: EntityId
  name: string
  description: string
  permissions: string[]
  color?: string
  status: "active" | "inactive"
  isSystem?: boolean
  usersCount?: number
  users?: User[]
  lastSyncedAt?: string | null
}

export interface Permission {
  id: EntityId
  name: string
  module: string
  category?: string
  description?: string
  status?: "active" | "inactive"
  isSystem?: boolean
  rolesCount?: number
}

export interface ProductInput {
  code: string
  name: string
  description?: string
  brand: string
  model: string
  categoryId: string | number
  purchasePrice: number
  salePrice: number
  stock?: number
  minimumStock?: number
  unit?: string
  supplierId?: string | number | null
  image?: string | null
}

export interface SupplierInput {
  name: string
  company?: string | null
  phone: string
  direccion?: string | null
  address?: string | null
}
