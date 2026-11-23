import { z } from "zod"
import { QUOTATION_STATUS_VALUES } from "./quotation-status"
export const ProductSchema = z.object({
  code: z.string().min(1, "El código es requerido"),
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  brand: z.string().min(1, "La marca es requerida"),
  model: z.string().min(1, "El modelo es requerido"),
  categoryId: z.union([
    z.number().int().positive("Debe seleccionar una categoría"),
    z.string().min(1, "Debe seleccionar una categoría"),
  ]),
  purchasePrice: z.number().positive("El precio de compra debe ser positivo"),
  salePrice: z.number().positive("El precio de venta debe ser positivo"),
  stock: z.number().int().min(0, "El stock no puede ser negativo").default(0),
  minimumStock: z.number().int().min(0, "El stock mínimo no puede ser negativo").default(0),
  unit: z.string().min(1, "La unidad es requerida").default("unidad"),
  supplierId: z
    .union([z.number().int().positive(), z.string().min(1), z.literal(""), z.null()])
    .optional(),
  image: z.string().nullable().optional(),
})

export type ProductInput = z.infer<typeof ProductSchema>

export const ClientSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  phone: z.string().min(7, "El teléfono debe tener al menos 7 caracteres"),
  address: z.string().nullable().optional().or(z.literal("")),
})

export type ClientInput = z.infer<typeof ClientSchema>
export const SupplierSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  company: z.string().nullable().optional(),
  phone: z.string().min(7, "El teléfono debe tener al menos 7 caracteres"),
  direccion: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
})

export type SupplierInput = z.infer<typeof SupplierSchema>
export const UserSchema = z.object({
  ci: z.string().min(6, "El CI debe tener al menos 6 caracteres"),
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  address: z.string().min(5, "La dirección debe tener al menos 5 caracteres"),
  phone: z.string().min(7, "El teléfono debe tener al menos 7 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional(),
  role: z.string().min(1, "Debe seleccionar un rol"),
  status: z.enum(["active", "inactive"]).default("active").optional(),
})

export const RoleSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().min(5, "La descripción debe tener al menos 5 caracteres"),
  permissions: z.array(z.string()).min(1, "Debe seleccionar al menos un permiso"),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Color hexadecimal inválido")
    .optional(),
  status: z.enum(["active", "inactive"]).default("active").optional(),
})

export type UserInput = z.infer<typeof UserSchema>
export type RoleInput = z.infer<typeof RoleSchema>

export const CategorySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Color hexadecimal inválido"),
  description: z.string().nullable().optional(),
  status: z.enum(["active", "inactive"]).default("active").optional(),
})

export type CategoryInput = z.infer<typeof CategorySchema>

export const SaleItemSchema = z.object({
  productId: z.string().min(1, "Debe seleccionar un producto"),
  quantity: z.number().int().positive("La cantidad debe ser positiva"),
  price: z.number().positive("El precio debe ser positivo"),
  subtotal: z.number(),
})

export const SaleSchema = z.object({
  date: z.string().or(z.date()),
  clientId: z
    .union([
      z.number().int().positive("Debe seleccionar un cliente"),
      z.string().min(1),
      z.literal(""),
      z.null(),
    ])
    .optional(),
  sellerUserId: z.union([
    z.number().int().positive("Debe seleccionar un vendedor"),
    z.string().min(1, "Debe seleccionar un vendedor"),
  ]),
  items: z.array(SaleItemSchema).min(1, "Debe agregar al menos un producto"),
  subtotal: z.number(),
  tax: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  total: z.number().positive(),
  paymentMethod: z.enum(["efectivo", "transferencia", "crédito", "qr"]),
  status: z.enum(["completada", "pendiente", "cancelada"]).default("completada"),
})

export type SaleInput = z.infer<typeof SaleSchema>

export const PurchaseItemSchema = z.object({
  productId: z.string().min(1, "Debe seleccionar un producto"),
  quantity: z.number().int().positive("La cantidad debe ser positiva"),
  price: z.number().min(0, "El precio no puede ser negativo"),
})

export const PurchaseSchema = z.object({
  date: z.string().or(z.date()),
  supplierId: z.string().min(1, "Debe seleccionar un proveedor"),
  buyerUserId: z.string().min(1, "Debe seleccionar un comprador"),
  items: z.array(PurchaseItemSchema).min(1, "Debe agregar al menos un producto"),
  subtotal: z.number(),
  tax: z.number().min(0).default(0),
  total: z.number().positive(),
  paymentMethod: z.enum(["efectivo", "transferencia", "crédito", "qr"]).default("efectivo"),
  status: z.enum(["pendiente", "recibida", "cancelada"]).default("recibida"),
})

export type PurchaseInput = z.infer<typeof PurchaseSchema>

export const QuotationItemSchema = z.object({
  productId: z.string().min(1, "Debe seleccionar un producto"),
  quantity: z.number().int().positive("La cantidad debe ser positiva"),
  price: z.number().positive("El precio debe ser positivo"),
  subtotal: z.number(),
})

export const QuotationSchema = z.object({
  date: z.string().or(z.date()),
  clientId: z
    .union([z.number().int().positive("Debe seleccionar un cliente"), z.string().min(1)])
    .nullable()
    .optional(),
  sellerUserId: z.union([
    z.number().int().positive("Debe seleccionar un vendedor"),
    z.string().min(1, "Debe seleccionar un vendedor"),
  ]),
  items: z.array(QuotationItemSchema).min(1, "Debe agregar al menos un producto"),
  subtotal: z.number(),
  tax: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  total: z.number().positive(),
  validUntil: z.string().or(z.date()),
  status: z.enum(QUOTATION_STATUS_VALUES).default("pendiente"),
})

export type QuotationInput = z.infer<typeof QuotationSchema>

export const ExpenseSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  amount: z.number().positive("El monto debe ser positivo"),
  description: z.string().min(3, "La descripción debe tener al menos 3 caracteres"),
  category: z.string().optional(),
  date: z.string().or(z.date()),
})

export type ExpenseInput = z.infer<typeof ExpenseSchema>

export const CommissionSchema = z.object({
  sellerId: z.number().int().positive("Debe seleccionar un vendedor"),
  saleId: z.number().int().positive("Debe seleccionar una venta"),
  amount: z.number().positive("El monto debe ser positivo"),
  percentage: z.number().min(0).max(100, "El porcentaje debe estar entre 0 y 100"),
  date: z.string().or(z.date()),
  status: z.enum(["completada", "pendiente"]).default("pendiente"),
})

export type CommissionInput = z.infer<typeof CommissionSchema>

export const CashRecordSchema = z.object({
  date: z.string().or(z.date()),
  openingBalance: z.number(),
  cashIncome: z.number().min(0).default(0),
  cashExpenses: z.number().min(0).default(0),
  closingBalance: z.number(),
  notes: z.string().nullable().optional(),
  userId: z.string().min(1, "Debe seleccionar un usuario"),
})

export type CashRecordInput = z.infer<typeof CashRecordSchema>

export const PermissionSchema = z.object({
  id: z.string().min(1, "El ID es requerido"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  module: z.string().min(1, "Debe seleccionar un módulo"),
  description: z.string().min(5, "La descripción debe tener al menos 5 caracteres"),
  category: z.string().min(1, "Debe seleccionar una categoría"),
  status: z.enum(["active", "inactive"]).default("active").optional(),
})

export type PermissionInput = z.infer<typeof PermissionSchema>
