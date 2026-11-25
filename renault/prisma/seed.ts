import { PrismaClient as PrismaClientSQLite } from "@prisma/client"
import { PrismaClient as PrismaClientPostgres } from ".prisma/client-postgres"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import bcrypt from "bcryptjs"
import "dotenv/config"
import fs from "fs"
import path from "path"
import { getPostgresDatabaseUrl, resolveSqliteDatabaseUrl } from "../lib/runtime-env"
import { serializePermissions } from "../lib/json-field"

const DEFAULT_SYSTEM_ROLES = [
  {
    id: "6ccf70c8-78b8-4d0d-b32c-7d3cb1692eb3", // UUID fijo para que ambas DB coincidan
    name: "Administrador",
    description: "Acceso completo al sistema",
    permissions: [
      "dashboard",
      "clients",
      "quotations",
      "sales",
      "products",
      "suppliers",
      "purchases",
      "categories",
      "inventory",
      "expenses",
      "cash",
      "reports",
      "users",
      "roles",
      "permissions",
      "sync",
      "settings",
    ],
    color: "#EF4444",
  },
  {
    name: "Vendedor",
    description: "Gestion de ventas y clientes",
    permissions: ["dashboard", "clients", "inventory", "quotations", "sales", "reports"],
    color: "#3B82F6",
  },
  {
    name: "Comprador",
    description: "Gestion de compras y proveedores",
    permissions: ["dashboard", "suppliers", "inventory", "purchases", "reports"],
    color: "#8B5CF6",
  },
  {
    name: "Supervisor",
    description: "Supervision de operaciones",
    permissions: [
      "dashboard",
      "clients",
      "suppliers",
      "inventory",
      "quotations",
      "purchases",
      "sales",
      "expenses",
      "reports",
      "cash",
    ],
    color: "#F97316",
  },
  {
    name: "Invitado",
    description: "Solo lectura de reportes",
    permissions: ["dashboard", "reports"],
    color: "#6B7280",
  },
]

const CURRENT_YEAR = new Date().getFullYear()
const today = new Date()

function currentYearDate(mmdd: string): Date {
  return new Date(`${CURRENT_YEAR}-${mmdd}T00:00:00`)
}

function currentYearDateTime(datetime: string): Date {
  return new Date(`${CURRENT_YEAR}-${datetime}`)
}

function daysAgo(days: number, hour = 10, minute = 0) {
  const d = new Date(today)
  d.setDate(d.getDate() - days)
  d.setHours(hour, minute, 0, 0)
  return d
}

function daysFromNow(days: number, hour = 10, minute = 0) {
  const d = new Date(today)
  d.setDate(d.getDate() + days)
  d.setHours(hour, minute, 0, 0)
  return d
}

async function main(prisma: any, dbName: string) {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD
  if (!adminPassword || adminPassword.length < 8) {
    throw new Error(
      "Define SEED_ADMIN_PASSWORD con al menos 8 caracteres antes de ejecutar el seed",
    )
  }

  await prisma.cashWithdrawal.deleteMany()
  await prisma.commission.deleteMany()
  await prisma.cashRecord.deleteMany()
  await prisma.expense.deleteMany()
  await prisma.quotationItem.deleteMany()
  await prisma.quotation.deleteMany()
  await prisma.saleItem.deleteMany()
  await prisma.sale.deleteMany()
  await prisma.purchaseItem.deleteMany()
  await prisma.purchase.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.client.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.user.deleteMany()
  await prisma.role.deleteMany()

  await prisma.role.createMany({
    data: DEFAULT_SYSTEM_ROLES.map((role) => ({
      ...role,
      permissions: serializePermissions(role.permissions),
      status: "active",
      isSystem: role.name === "Administrador",
    })),
  })

  const hashedAdmin = await bcrypt.hash(adminPassword, 10)
  const hashedVendedor = await bcrypt.hash("vendedor123", 10)
  const hashedCompras = await bcrypt.hash("compras123", 10)
  const hashedSupervisor = await bcrypt.hash("supervisor123", 10)

  const users = await Promise.all([
    prisma.user.create({
      data: {
        id: "b92ad810-b72e-4897-8d86-9bdeaadba5c8", // UUID fijo
        firstName: "Administrador",
        lastName: "Sistema",
        ci: "12345678",
        phone: "+591 70000000",
        address: "Av. Principal 123",
        email: "admin@gmail.com",
        password: hashedAdmin,
        role: "administrador",
        status: "active",
      },
    }),
    prisma.user.create({
      data: {
        firstName: "Carlos",
        lastName: "Rodríguez",
        ci: "23456789",
        phone: "+591 70000001",
        address: "Calle 1 #45",
        email: "carlos.rodriguez@repuestos.com",
        password: hashedVendedor,
        role: "vendedor",
        status: "active",
      },
    }),
    prisma.user.create({
      data: {
        firstName: "Ana María",
        lastName: "Gómez",
        ci: "34567890",
        phone: "+591 70000002",
        address: "Av. Central #67",
        email: "ana.gomez@repuestos.com",
        password: hashedVendedor,
        role: "vendedor",
        status: "active",
      },
    }),
    prisma.user.create({
      data: {
        firstName: "Luis Fernando",
        lastName: "Castro",
        ci: "45678901",
        phone: "+591 70000003",
        address: "Cl. Secundaria #89",
        email: "luis.castro@repuestos.com",
        password: hashedCompras,
        role: "comprador",
        status: "active",
      },
    }),
    prisma.user.create({
      data: {
        firstName: "Patricia",
        lastName: "Morales",
        ci: "56789012",
        phone: "+591 70000004",
        address: "Av. Tercera #10",
        email: "patricia.morales@repuestos.com",
        password: hashedSupervisor,
        role: "supervisor",
        status: "active",
      },
    }),
    prisma.user.create({
      data: {
        firstName: "Diego",
        lastName: "Martínez",
        ci: "67890123",
        phone: "+591 70000005",
        address: "Cl. Cuarta #11",
        email: "diego.martinez@repuestos.com",
        password: hashedVendedor,
        role: "vendedor",
        status: "active",
      },
    }),
    prisma.user.create({
      data: {
        firstName: "Sandra",
        lastName: "Pérez",
        ci: "78901234",
        phone: "+591 70000006",
        address: "Av. Quinta #12",
        email: "sandra.perez@repuestos.com",
        password: hashedVendedor,
        role: "vendedor",
        status: "active",
      },
    }),
    prisma.user.create({
      data: {
        firstName: "Roberto",
        lastName: "Silva",
        ci: "89012345",
        phone: "+591 70000007",
        address: "Cl. Sexta #13",
        email: "roberto.silva@repuestos.com",
        password: hashedCompras,
        role: "comprador",
        status: "active",
      },
    }),
  ])

  const [admin, carlos, ana, luis, patricia, diego, sandra, roberto] = users

  const categories = await Promise.all([
    // Categorías de Productos
    prisma.category.create({ data: { name: "Motor", color: "#EF4444", type: "product" } }),
    prisma.category.create({ data: { name: "Frenos", color: "#DC2626", type: "product" } }),
    prisma.category.create({ data: { name: "Suspensión", color: "#F59E0B", type: "product" } }),
    prisma.category.create({ data: { name: "Transmisión", color: "#3B82F6", type: "product" } }),
    prisma.category.create({ data: { name: "Eléctrico", color: "#FBBF24", type: "product" } }),
    prisma.category.create({ data: { name: "Filtros", color: "#10B981", type: "product" } }),
    prisma.category.create({ data: { name: "Lubricantes", color: "#8B5CF6", type: "product" } }),
    prisma.category.create({ data: { name: "Iluminación", color: "#F97316", type: "product" } }),
    prisma.category.create({ data: { name: "Carrocería", color: "#06B6D4", type: "product" } }),
    prisma.category.create({ data: { name: "Neumáticos", color: "#6366F1", type: "product" } }),
    prisma.category.create({ data: { name: "Escape", color: "#64748B", type: "product" } }),
    prisma.category.create({ data: { name: "Refrigeración", color: "#0EA5E9", type: "product" } }),
    // Categorías de Gastos
    prisma.category.create({ data: { name: "Servicios", color: "#EF4444", type: "expense" } }),
    prisma.category.create({ data: { name: "Alquiler", color: "#F97316", type: "expense" } }),
    prisma.category.create({ data: { name: "Salarios", color: "#06B6D4", type: "expense" } }),
    prisma.category.create({ data: { name: "Marketing", color: "#EC4899", type: "expense" } }),
    prisma.category.create({ data: { name: "Transporte", color: "#8B5CF6", type: "expense" } }),
    prisma.category.create({ data: { name: "Mantenimiento", color: "#10B981", type: "expense" } }),
  ])

  const [
    catMotor,
    catFrenos,
    catSuspension,
    catTransmision,
    catElectrico,
    catFiltros,
    catLubricantes,
    catIluminacion,
    catCarroceria,
    catNeumaticos,
    catEscape,
    catRefrigeracion,
  ] = categories
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: "Roberto Martínez",
        company: "AutoPartes Premium S.A.S",
        phone: "+57 300 555 1001",
        email: "ventas@autopartespremium.com",
        address: "Calle 45 #23-15, Bogotá",
        totalPurchases: 0,
      },
    }),
    prisma.supplier.create({
      data: {
        name: "Laura Sánchez",
        company: "Repuestos Originales Ltda",
        phone: "+57 301 555 2002",
        email: "contacto@repuestosoriginales.com",
        address: "Av. Caracas #67-89, Bogotá",
        totalPurchases: 0,
      },
    }),
    prisma.supplier.create({
      data: {
        name: "Diego Ramírez",
        company: "Importadora AutoMotriz",
        phone: "+57 302 555 3003",
        email: "diego@importadoraautomotriz.com",
        address: "Cra 30 #45-12, Medellín",
        totalPurchases: 0,
      },
    }),
    prisma.supplier.create({
      data: {
        name: "Ana Torres",
        company: "Distribuidora Continental",
        phone: "+57 303 555 4004",
        email: "ana.torres@distcontinental.com",
        address: "Calle 100 #15-20, Bogotá",
        totalPurchases: 0,
      },
    }),
    prisma.supplier.create({
      data: {
        name: "Miguel Ángel Castro",
        company: "Repuestos del Norte",
        phone: "+57 304 555 5005",
        email: "ventas@repuestosdelnorte.com",
        address: "Av. 19 #120-45, Bogotá",
        totalPurchases: 0,
      },
    }),
    prisma.supplier.create({
      data: {
        name: "Patricia Gómez",
        company: "AutoRepuestos Express",
        phone: "+57 305 555 6006",
        email: "patricia@autorepuestosexpress.com",
        address: "Calle 13 #68-24, Cali",
        totalPurchases: 0,
      },
    }),
    prisma.supplier.create({
      data: {
        name: "Fernando Silva",
        company: "Lubricantes y Filtros S.A",
        phone: "+57 306 555 7007",
        email: "fernando@lubricantesyfiltros.com",
        address: "Cra 7 #32-18, Barranquilla",
        totalPurchases: 0,
      },
    }),
    prisma.supplier.create({
      data: {
        name: "Carmen Ruiz",
        company: "Neumáticos Colombia",
        phone: "+57 307 555 8008",
        email: "carmen@neumaticoscolombia.com",
        address: "Av. 68 #45-90, Bogotá",
        totalPurchases: 0,
      },
    }),
  ])

  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: "Taller Mecánico El Experto",
        phone: "+57 310 400 5001",
        address: "Calle 72 #45-23, Bogotá",
        totalPurchases: 0,
      },
    }),
    prisma.client.create({
      data: {
        name: "AutoServicio Rápido",
        phone: "+57 311 400 5002",
        address: "Av. Boyacá #134-56, Bogotá",
        totalPurchases: 0,
      },
    }),
    prisma.client.create({
      data: {
        name: "Mecánica Alemana",
        phone: "+57 312 400 5003",
        address: "Cra 15 #89-12, Bogotá",
        totalPurchases: 0,
      },
    }),
    prisma.client.create({
      data: {
        name: "Taller Los Andes",
        phone: "+57 313 400 5004",
        address: "Calle 26 #68-45, Bogotá",
        totalPurchases: 0,
      },
    }),
    prisma.client.create({
      data: {
        name: "Carlos Mendoza",
        phone: "+57 314 400 5005",
        address: "Cra 50 #23-67, Bogotá",
        totalPurchases: 0,
      },
    }),
    prisma.client.create({
      data: {
        name: "Serviteca La 80",
        phone: "+57 315 400 5006",
        address: "Av. 80 #45-90, Bogotá",
        totalPurchases: 0,
      },
    }),
    prisma.client.create({
      data: {
        name: "María Fernanda López",
        phone: "+57 316 400 5007",
        address: "Calle 100 #15-34, Bogotá",
        totalPurchases: 0,
      },
    }),
    prisma.client.create({
      data: {
        name: "Taller Diesel Power",
        phone: "+57 317 400 5008",
        address: "Cra 68 #23-12, Bogotá",
        totalPurchases: 0,
      },
    }),
    prisma.client.create({
      data: {
        name: "AutoLujo Premium",
        phone: "+57 318 400 5009",
        address: "Calle 116 #45-78, Bogotá",
        totalPurchases: 0,
      },
    }),
    prisma.client.create({
      data: {
        name: "Jorge Andrés Ruiz",
        phone: "+57 319 400 5010",
        address: "Av. Suba #120-45, Bogotá",
        totalPurchases: 0,
      },
    }),
    prisma.client.create({
      data: {
        name: "Taller Multimarcas",
        phone: "+57 320 400 5011",
        address: "Calle 13 #34-56, Bogotá",
        totalPurchases: 0,
      },
    }),
    prisma.client.create({
      data: {
        name: "Electro Auto",
        phone: "+57 321 400 5012",
        address: "Cra 30 #67-89, Bogotá",
        totalPurchases: 0,
      },
    }),
  ])

  const products = await Promise.all([
    // MOTOR (5 productos)
    prisma.product.create({
      data: {
        code: "MOT-001",
        name: "Filtro de Aceite Toyota",
        brand: "Toyota",
        model: "Corolla",
        categoryId: catMotor.id,
        purchasePrice: 15000,
        salePrice: 25000,
        stock: 45,
        minimumStock: 15,
        unit: "unidad",
        supplierId: suppliers[0].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "MOT-002",
        name: "Bujía NGK Platino",
        brand: "NGK",
        model: "Platino",
        categoryId: catMotor.id,
        purchasePrice: 18000,
        salePrice: 32000,
        stock: 120,
        minimumStock: 30,
        unit: "unidad",
        supplierId: suppliers[1].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "MOT-003",
        name: "Correa de Distribución Gates",
        brand: "Gates",
        model: "Timing",
        categoryId: catMotor.id,
        purchasePrice: 85000,
        salePrice: 145000,
        stock: 25,
        minimumStock: 10,
        unit: "unidad",
        supplierId: suppliers[2].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "MOT-004",
        name: "Empaque de Culata Universal",
        brand: "Universal",
        model: "Multi",
        categoryId: catMotor.id,
        purchasePrice: 120000,
        salePrice: 195000,
        stock: 8,
        minimumStock: 5,
        unit: "unidad",
        supplierId: suppliers[0].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "MOT-005",
        name: "Bomba de Agua Chevrolet",
        brand: "Chevrolet",
        model: "Aveo",
        categoryId: catMotor.id,
        purchasePrice: 95000,
        salePrice: 155000,
        stock: 18,
        minimumStock: 8,
        unit: "unidad",
        supplierId: suppliers[1].id,
      },
    }),
    // FRENOS (5 productos)
    prisma.product.create({
      data: {
        code: "FRE-001",
        name: "Pastillas de Freno Delanteras Mazda",
        brand: "Mazda",
        model: "CX-5",
        categoryId: catFrenos.id,
        purchasePrice: 75000,
        salePrice: 125000,
        stock: 32,
        minimumStock: 12,
        unit: "juego",
        supplierId: suppliers[0].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "FRE-002",
        name: "Disco de Freno Ventilado Renault",
        brand: "Renault",
        model: "Logan",
        categoryId: catFrenos.id,
        purchasePrice: 110000,
        salePrice: 180000,
        stock: 24,
        minimumStock: 10,
        unit: "unidad",
        supplierId: suppliers[2].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "FRE-003",
        name: "Líquido de Frenos DOT 4",
        brand: "DOT",
        model: "4",
        categoryId: catFrenos.id,
        purchasePrice: 12000,
        salePrice: 22000,
        stock: 85,
        minimumStock: 20,
        unit: "litro",
        supplierId: suppliers[6].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "FRE-004",
        name: "Cilindro Maestro de Freno",
        brand: "Bendix",
        model: "Master",
        categoryId: catFrenos.id,
        purchasePrice: 185000,
        salePrice: 295000,
        stock: 6,
        minimumStock: 4,
        unit: "unidad",
        supplierId: suppliers[1].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "FRE-005",
        name: "Manguera de Freno Flexible",
        brand: "Gates",
        model: "Flex",
        categoryId: catFrenos.id,
        purchasePrice: 25000,
        salePrice: 42000,
        stock: 40,
        minimumStock: 15,
        unit: "unidad",
        supplierId: suppliers[0].id,
      },
    }),
    // SUSPENSIÓN (4 productos)
    prisma.product.create({
      data: {
        code: "SUS-001",
        name: "Amortiguador Delantero KYB",
        brand: "KYB",
        model: "Excel-G",
        categoryId: catSuspension.id,
        purchasePrice: 145000,
        salePrice: 235000,
        stock: 16,
        minimumStock: 8,
        unit: "unidad",
        supplierId: suppliers[2].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "SUS-002",
        name: "Terminal de Dirección",
        brand: "TRW",
        model: "Tie Rod End",
        categoryId: catSuspension.id,
        purchasePrice: 45000,
        salePrice: 75000,
        stock: 28,
        minimumStock: 12,
        unit: "unidad",
        supplierId: suppliers[0].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "SUS-003",
        name: "Rótula de Suspensión",
        brand: "Moog",
        model: "MOOG-K8494",
        categoryId: catSuspension.id,
        purchasePrice: 55000,
        salePrice: 92000,
        stock: 22,
        minimumStock: 10,
        unit: "unidad",
        supplierId: suppliers[1].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "SUS-004",
        name: "Resorte Helicoidal Trasero",
        brand: "Lesjöfors",
        model: "432",
        categoryId: catSuspension.id,
        purchasePrice: 85000,
        salePrice: 140000,
        stock: 12,
        minimumStock: 6,
        unit: "unidad",
        supplierId: suppliers[2].id,
      },
    }),
    // TRANSMISIÓN (3 productos)
    prisma.product.create({
      data: {
        code: "TRA-001",
        name: "Kit de Embrague Completo",
        brand: "Sachs",
        model: "Performance",
        categoryId: catTransmision.id,
        purchasePrice: 320000,
        salePrice: 495000,
        stock: 8,
        minimumStock: 4,
        unit: "kit",
        supplierId: suppliers[2].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "TRA-002",
        name: "Aceite de Transmisión ATF",
        brand: "Castrol",
        model: "ATF",
        categoryId: catTransmision.id,
        purchasePrice: 28000,
        salePrice: 48000,
        stock: 65,
        minimumStock: 20,
        unit: "litro",
        supplierId: suppliers[6].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "TRA-003",
        name: "Cruceta de Cardan",
        brand: "SKF",
        model: "35302-2",
        categoryId: catTransmision.id,
        purchasePrice: 65000,
        salePrice: 105000,
        stock: 14,
        minimumStock: 6,
        unit: "unidad",
        supplierId: suppliers[1].id,
      },
    }),
    // ELÉCTRICO (5 productos)
    prisma.product.create({
      data: {
        code: "ELE-001",
        name: "Batería 12V 45Ah",
        brand: "Varta",
        model: "544 045",
        categoryId: catElectrico.id,
        purchasePrice: 185000,
        salePrice: 295000,
        stock: 22,
        minimumStock: 10,
        unit: "unidad",
        supplierId: suppliers[4].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "ELE-002",
        name: "Alternador Reconstruido",
        brand: "Bosch",
        model: "AL 427X",
        categoryId: catElectrico.id,
        purchasePrice: 245000,
        salePrice: 385000,
        stock: 7,
        minimumStock: 4,
        unit: "unidad",
        supplierId: suppliers[3].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "ELE-003",
        name: "Motor de Arranque",
        brand: "Denso",
        model: "228000-0110",
        categoryId: catElectrico.id,
        purchasePrice: 285000,
        salePrice: 445000,
        stock: 5,
        minimumStock: 3,
        unit: "unidad",
        supplierId: suppliers[3].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "ELE-004",
        name: "Sensor de Oxígeno",
        brand: "Bosch",
        model: "LSU 4 2",
        categoryId: catElectrico.id,
        purchasePrice: 95000,
        salePrice: 155000,
        stock: 18,
        minimumStock: 8,
        unit: "unidad",
        supplierId: suppliers[1].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "ELE-005",
        name: "Bobina de Encendido",
        brand: "NGK",
        model: "U5010",
        categoryId: catElectrico.id,
        purchasePrice: 75000,
        salePrice: 125000,
        stock: 25,
        minimumStock: 10,
        unit: "unidad",
        supplierId: suppliers[0].id,
      },
    }),
    // FILTROS (4 productos)
    prisma.product.create({
      data: {
        code: "FIL-001",
        name: "Filtro de Aire K&N",
        brand: "K&N",
        model: "33-2301",
        categoryId: catFiltros.id,
        purchasePrice: 45000,
        salePrice: 75000,
        stock: 55,
        minimumStock: 20,
        unit: "unidad",
        supplierId: suppliers[5].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "FIL-002",
        name: "Filtro de Combustible Diesel",
        brand: "Bosch",
        model: "0450905038",
        categoryId: catFiltros.id,
        purchasePrice: 32000,
        salePrice: 55000,
        stock: 42,
        minimumStock: 15,
        unit: "unidad",
        supplierId: suppliers[5].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "FIL-003",
        name: "Filtro de Cabina con Carbón",
        brand: "Mann",
        model: "CU 19 003",
        categoryId: catFiltros.id,
        purchasePrice: 28000,
        salePrice: 48000,
        stock: 38,
        minimumStock: 15,
        unit: "unidad",
        supplierId: suppliers[5].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "FIL-004",
        name: "Filtro de Aceite Mann",
        brand: "Mann",
        model: "W 67/1",
        categoryId: catFiltros.id,
        purchasePrice: 18000,
        salePrice: 32000,
        stock: 95,
        minimumStock: 30,
        unit: "unidad",
        supplierId: suppliers[5].id,
      },
    }),
    // LUBRICANTES (4 productos)
    prisma.product.create({
      data: {
        code: "LUB-001",
        name: "Aceite Motor 20W-50 Mobil",
        brand: "Mobil",
        model: "Super 2000",
        categoryId: catLubricantes.id,
        purchasePrice: 35000,
        salePrice: 58000,
        stock: 120,
        minimumStock: 40,
        unit: "litro",
        supplierId: suppliers[6].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "LUB-002",
        name: "Aceite Sintético 5W-30 Castrol",
        brand: "Castrol",
        model: "EDGE",
        categoryId: catLubricantes.id,
        purchasePrice: 52000,
        salePrice: 85000,
        stock: 85,
        minimumStock: 30,
        unit: "litro",
        supplierId: suppliers[6].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "LUB-003",
        name: "Grasa Multiusos",
        brand: "Lithium",
        model: "Multi",
        categoryId: catLubricantes.id,
        purchasePrice: 15000,
        salePrice: 28000,
        stock: 45,
        minimumStock: 15,
        unit: "kg",
        supplierId: suppliers[6].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "LUB-004",
        name: "Refrigerante Verde",
        brand: "Prestone",
        model: "AF888",
        categoryId: catLubricantes.id,
        purchasePrice: 18000,
        salePrice: 32000,
        stock: 75,
        minimumStock: 25,
        unit: "litro",
        supplierId: suppliers[6].id,
      },
    }),
    // ILUMINACIÓN (4 productos)
    prisma.product.create({
      data: {
        code: "ILU-001",
        name: "Bombilla H4 Halógena",
        brand: "Osram",
        model: "H4 12V 60/55W",
        categoryId: catIluminacion.id,
        purchasePrice: 12000,
        salePrice: 22000,
        stock: 85,
        minimumStock: 30,
        unit: "unidad",
        supplierId: suppliers[4].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "ILU-002",
        name: "Faro Delantero Derecho",
        brand: "Hella",
        model: "1NE 008 322-021",
        categoryId: catIluminacion.id,
        purchasePrice: 145000,
        salePrice: 235000,
        stock: 12,
        minimumStock: 5,
        unit: "unidad",
        supplierId: suppliers[3].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "ILU-003",
        name: "Luz LED Trasera",
        brand: "Philips",
        model: "LED 1157",
        categoryId: catIluminacion.id,
        purchasePrice: 85000,
        salePrice: 140000,
        stock: 18,
        minimumStock: 8,
        unit: "unidad",
        supplierId: suppliers[4].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "ILU-004",
        name: "Bombilla LED H7",
        brand: "Sylvania",
        model: "H7 LED",
        categoryId: catIluminacion.id,
        purchasePrice: 35000,
        salePrice: 58000,
        stock: 42,
        minimumStock: 15,
        unit: "unidad",
        supplierId: suppliers[4].id,
      },
    }),
    // CARROCERÍA (4 productos)
    prisma.product.create({
      data: {
        code: "CAR-001",
        name: "Espejo Retrovisor Eléctrico",
        brand: "OEM",
        model: "Power Mirror",
        categoryId: catCarroceria.id,
        purchasePrice: 95000,
        salePrice: 155000,
        stock: 16,
        minimumStock: 6,
        unit: "unidad",
        supplierId: suppliers[3].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "CAR-002",
        name: "Parachoque Delantero",
        brand: "Depo",
        model: "Front Bumper",
        categoryId: catCarroceria.id,
        purchasePrice: 285000,
        salePrice: 445000,
        stock: 5,
        minimumStock: 3,
        unit: "unidad",
        supplierId: suppliers[3].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "CAR-003",
        name: "Guardafango Trasero",
        brand: "OEM",
        model: "Rear Fender",
        categoryId: catCarroceria.id,
        purchasePrice: 125000,
        salePrice: 195000,
        stock: 8,
        minimumStock: 4,
        unit: "unidad",
        supplierId: suppliers[3].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "CAR-004",
        name: "Manija de Puerta Cromada",
        brand: "Chrome",
        model: "Door Handle",
        categoryId: catCarroceria.id,
        purchasePrice: 45000,
        salePrice: 75000,
        stock: 24,
        minimumStock: 10,
        unit: "unidad",
        supplierId: suppliers[5].id,
      },
    }),
    // NEUMÁTICOS (4 productos)
    prisma.product.create({
      data: {
        code: "NEU-001",
        name: "Llanta 185/65 R15 Michelin",
        brand: "Michelin",
        model: "Energy XM2",
        categoryId: catNeumaticos.id,
        purchasePrice: 285000,
        salePrice: 445000,
        stock: 32,
        minimumStock: 16,
        unit: "unidad",
        supplierId: suppliers[7].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "NEU-002",
        name: "Llanta 205/55 R16 Bridgestone",
        brand: "Bridgestone",
        model: "Turanza",
        categoryId: catNeumaticos.id,
        purchasePrice: 345000,
        salePrice: 525000,
        stock: 28,
        minimumStock: 12,
        unit: "unidad",
        supplierId: suppliers[7].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "NEU-003",
        name: "Rin de Aluminio 15 pulgadas",
        brand: "Enkei",
        model: 'Alloy 15"',
        categoryId: catNeumaticos.id,
        purchasePrice: 195000,
        salePrice: 315000,
        stock: 20,
        minimumStock: 8,
        unit: "unidad",
        supplierId: suppliers[7].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "NEU-004",
        name: "Válvula de Neumático",
        brand: "TR-413",
        model: "Standard",
        categoryId: catNeumaticos.id,
        purchasePrice: 3000,
        salePrice: 6000,
        stock: 200,
        minimumStock: 50,
        unit: "unidad",
        supplierId: suppliers[7].id,
      },
    }),
    // ESCAPE (3 productos)
    prisma.product.create({
      data: {
        code: "ESC-001",
        name: "Silenciador Universal",
        brand: "Universal",
        model: "Silencer",
        categoryId: catEscape.id,
        purchasePrice: 125000,
        salePrice: 195000,
        stock: 14,
        minimumStock: 6,
        unit: "unidad",
        supplierId: suppliers[2].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "ESC-002",
        name: "Catalizador",
        brand: "Bosal",
        model: "Catalytic",
        categoryId: catEscape.id,
        purchasePrice: 385000,
        salePrice: 595000,
        stock: 6,
        minimumStock: 3,
        unit: "unidad",
        supplierId: suppliers[2].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "ESC-003",
        name: "Tubo de Escape Flexible",
        brand: "Flex",
        model: "Pipe",
        categoryId: catEscape.id,
        purchasePrice: 45000,
        salePrice: 75000,
        stock: 22,
        minimumStock: 10,
        unit: "unidad",
        supplierId: suppliers[2].id,
      },
    }),
    // REFRIGERACIÓN (5 productos)
    prisma.product.create({
      data: {
        code: "REF-001",
        name: "Radiador de Aluminio",
        brand: "Aluminum",
        model: "Radiator",
        categoryId: catRefrigeracion.id,
        purchasePrice: 245000,
        salePrice: 385000,
        stock: 10,
        minimumStock: 5,
        unit: "unidad",
        supplierId: suppliers[1].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "REF-002",
        name: "Termostato de Motor",
        brand: "Thermostat",
        model: "Engine",
        categoryId: catRefrigeracion.id,
        purchasePrice: 35000,
        salePrice: 58000,
        stock: 32,
        minimumStock: 12,
        unit: "unidad",
        supplierId: suppliers[0].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "REF-003",
        name: "Ventilador Eléctrico",
        brand: "Electric",
        model: "Fan",
        categoryId: catRefrigeracion.id,
        purchasePrice: 145000,
        salePrice: 235000,
        stock: 8,
        minimumStock: 4,
        unit: "unidad",
        supplierId: suppliers[4].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "REF-004",
        name: "Manguera de Radiador Superior",
        brand: "Gates",
        model: "Hose",
        categoryId: catRefrigeracion.id,
        purchasePrice: 28000,
        salePrice: 48000,
        stock: 35,
        minimumStock: 15,
        unit: "unidad",
        supplierId: suppliers[0].id,
      },
    }),
    prisma.product.create({
      data: {
        code: "REF-005",
        name: "Tapa de Radiador",
        brand: "Cap",
        model: "Radiator",
        categoryId: catRefrigeracion.id,
        purchasePrice: 15000,
        salePrice: 28000,
        stock: 45,
        minimumStock: 20,
        unit: "unidad",
        supplierId: suppliers[0].id,
      },
    }),
  ])

  const purchase1 = await prisma.purchase.create({
    data: {
      date: daysAgo(28),
      supplierId: suppliers[0].id,
      buyerUserId: luis.id,
      subtotal: 3500000,
      tax: 665000,
      total: 4165000,
      status: "recibida",
      items: {
        create: [
          { productId: products[0].id, quantity: 50, price: 15000 },
          { productId: products[3].id, quantity: 15, price: 120000 },
          { productId: products[11].id, quantity: 30, price: 45000 },
        ],
      },
    },
  })

  const purchase2 = await prisma.purchase.create({
    data: {
      date: daysAgo(24),
      supplierId: suppliers[2].id,
      buyerUserId: luis.id,
      subtotal: 5200000,
      tax: 988000,
      total: 6188000,
      status: "recibida",
      items: {
        create: [
          { productId: products[2].id, quantity: 30, price: 85000 },
          { productId: products[10].id, quantity: 20, price: 145000 },
        ],
      },
    },
  })

  const purchase3 = await prisma.purchase.create({
    data: {
      date: daysAgo(28),
      supplierId: suppliers[6].id,
      buyerUserId: roberto.id,
      subtotal: 10450000,
      tax: 1985500,
      total: 12435500,
      status: "recibida",
      items: {
        create: [
          { productId: products[26].id, quantity: 150, price: 35000 },
          { productId: products[27].id, quantity: 100, price: 52000 },
        ],
      },
    },
  })

  const purchase4 = await prisma.purchase.create({
    data: {
      date: currentYearDate("11-28"),
      supplierId: suppliers[7].id,
      buyerUserId: luis.id,
      subtotal: 21750000,
      tax: 4132500,
      total: 25882500,
      status: "recibida",
      items: {
        create: [
          { productId: products[38].id, quantity: 40, price: 285000 },
          { productId: products[39].id, quantity: 30, price: 345000 },
        ],
      },
    },
  })

  const purchase5 = await prisma.purchase.create({
    data: {
      date: currentYearDate("12-02"),
      supplierId: suppliers[1].id,
      buyerUserId: roberto.id,
      subtotal: 6975000,
      tax: 1325250,
      total: 8300250,
      status: "recibida",
      items: {
        create: [
          { productId: products[1].id, quantity: 150, price: 18000 },
          { productId: products[4].id, quantity: 20, price: 95000 },
          { productId: products[20].id, quantity: 25, price: 95000 },
        ],
      },
    },
  })

  const purchase6 = await prisma.purchase.create({
    data: {
      date: currentYearDate("12-03"),
      supplierId: suppliers[4].id,
      buyerUserId: luis.id,
      subtotal: 8500000,
      tax: 1615000,
      total: 10115000,
      status: "pendiente",
      items: {
        create: [
          { productId: products[17].id, quantity: 30, price: 185000 },
          { productId: products[30].id, quantity: 100, price: 12000 },
          { productId: products[33].id, quantity: 50, price: 35000 },
        ],
      },
    },
  })

  const sale1 = await prisma.sale.create({
    data: {
      date: currentYearDateTime("12-01T10:30:00"),
      clientId: clients[0].id,
      sellerUserId: carlos.id,
      subtotal: 458000,
      tax: 87020,
      discount: 0,
      total: 545020,
      paymentMethod: "transferencia",
      status: "completada",
      items: {
        create: [
          { productId: products[0].id, quantity: 4, price: 25000, subtotal: 100000 },
          { productId: products[5].id, quantity: 2, price: 125000, subtotal: 250000 },
          { productId: products[22].id, quantity: 1, price: 75000, subtotal: 75000 },
          { productId: products[47].id, quantity: 1, price: 58000, subtotal: 58000 },
        ],
      },
    },
  })

  const sale2 = await prisma.sale.create({
    data: {
      date: currentYearDateTime("12-01T14:15:00"),
      clientId: clients[4].id,
      sellerUserId: ana.id,
      subtotal: 295000,
      tax: 56050,
      discount: 15000,
      total: 336050,
      paymentMethod: "efectivo",
      status: "completada",
      items: {
        create: [{ productId: products[17].id, quantity: 1, price: 295000, subtotal: 295000 }],
      },
    },
  })

  const sale3 = await prisma.sale.create({
    data: {
      date: currentYearDateTime("12-02T09:45:00"),
      clientId: clients[1].id,
      sellerUserId: carlos.id,
      subtotal: 1254000,
      tax: 238260,
      discount: 50000,
      total: 1442260,
      paymentMethod: "crédito",
      status: "completada",
      items: {
        create: [
          { productId: products[14].id, quantity: 2, price: 495000, subtotal: 990000 },
          { productId: products[26].id, quantity: 4, price: 58000, subtotal: 232000 },
          { productId: products[25].id, quantity: 1, price: 32000, subtotal: 32000 },
        ],
      },
    },
  })

  const sale4 = await prisma.sale.create({
    data: {
      date: currentYearDateTime("12-02T11:20:00"),
      clientId: clients[2].id,
      sellerUserId: diego.id,
      subtotal: 913000,
      tax: 173470,
      discount: 0,
      total: 1086470,
      paymentMethod: "transferencia",
      status: "completada",
      items: {
        create: [
          { productId: products[10].id, quantity: 2, price: 235000, subtotal: 470000 },
          { productId: products[18].id, quantity: 1, price: 385000, subtotal: 385000 },
          { productId: products[47].id, quantity: 1, price: 58000, subtotal: 58000 },
        ],
      },
    },
  })

  const sale5 = await prisma.sale.create({
    data: {
      date: currentYearDateTime("12-03T10:00:00"),
      clientId: clients[5].id,
      sellerUserId: ana.id,
      subtotal: 1780000,
      tax: 338200,
      discount: 80000,
      total: 2038200,
      paymentMethod: "transferencia",
      status: "completada",
      items: {
        create: [{ productId: products[38].id, quantity: 4, price: 445000, subtotal: 1780000 }],
      },
    },
  })

  const sale6 = await prisma.sale.create({
    data: {
      date: currentYearDateTime("12-03T15:30:00"),
      clientId: clients[7].id,
      sellerUserId: sandra.id,
      subtotal: 1425000,
      tax: 270750,
      discount: 0,
      total: 1695750,
      paymentMethod: "transferencia",
      status: "completada",
      items: {
        create: [
          { productId: products[19].id, quantity: 1, price: 445000, subtotal: 445000 },
          { productId: products[46].id, quantity: 1, price: 385000, subtotal: 385000 },
          { productId: products[44].id, quantity: 1, price: 595000, subtotal: 595000 },
        ],
      },
    },
  })

  const sale7 = await prisma.sale.create({
    data: {
      date: currentYearDateTime("12-04T09:15:00"),
      clientId: clients[8].id,
      sellerUserId: carlos.id,
      subtotal: 2100000,
      tax: 399000,
      discount: 100000,
      total: 2399000,
      paymentMethod: "transferencia",
      status: "completada",
      items: {
        create: [{ productId: products[39].id, quantity: 4, price: 525000, subtotal: 2100000 }],
      },
    },
  })

  const sale8 = await prisma.sale.create({
    data: {
      date: currentYearDateTime("12-04T13:45:00"),
      clientId: clients[3].id,
      sellerUserId: diego.id,
      subtotal: 410000,
      tax: 77900,
      discount: 20000,
      total: 467900,
      paymentMethod: "efectivo",
      status: "completada",
      items: {
        create: [
          { productId: products[6].id, quantity: 2, price: 180000, subtotal: 360000 },
          { productId: products[7].id, quantity: 1, price: 22000, subtotal: 22000 },
          { productId: products[49].id, quantity: 1, price: 28000, subtotal: 28000 },
        ],
      },
    },
  })

  const quotation1 = await prisma.quotation.create({
    data: {
      date: currentYearDateTime("12-03T16:30:00"),
      clientId: clients[10].id,
      sellerUserId: carlos.id,
      subtotal: 1576000,
      tax: 299440,
      discount: 0,
      total: 1875440,
      validUntil: currentYearDate("12-10"),
      status: "pendiente",
      items: {
        create: [
          { productId: products[14].id, quantity: 2, price: 495000, subtotal: 990000 },
          { productId: products[10].id, quantity: 2, price: 235000, subtotal: 470000 },
          { productId: products[26].id, quantity: 2, price: 58000, subtotal: 116000 },
        ],
      },
    },
  })

  const quotation2 = await prisma.quotation.create({
    data: {
      date: currentYearDateTime("12-04T10:00:00"),
      clientId: clients[11].id,
      sellerUserId: ana.id,
      subtotal: 979000,
      tax: 186010,
      discount: 50000,
      total: 1115010,
      validUntil: currentYearDate("12-11"),
      status: "pendiente",
      items: {
        create: [
          { productId: products[18].id, quantity: 1, price: 385000, subtotal: 385000 },
          { productId: products[19].id, quantity: 1, price: 445000, subtotal: 445000 },
          { productId: products[21].id, quantity: 1, price: 125000, subtotal: 125000 },
          { productId: products[41].id, quantity: 4, price: 6000, subtotal: 24000 },
        ],
      },
    },
  })

  const quotation3 = await prisma.quotation.create({
    data: {
      date: currentYearDateTime("12-04T14:20:00"),
      clientId: clients[9].id,
      sellerUserId: diego.id,
      subtotal: 445000,
      tax: 84550,
      discount: 0,
      total: 529550,
      validUntil: currentYearDate("12-11"),
      status: "pendiente",
      items: {
        create: [{ productId: products[38].id, quantity: 1, price: 445000, subtotal: 445000 }],
      },
    },
  })

  const quotation4 = await prisma.quotation.create({
    data: {
      date: currentYearDateTime("12-04T15:45:00"),
      clientId: clients[0].id,
      sellerUserId: sandra.id,
      subtotal: 1218000,
      tax: 231420,
      discount: 60000,
      total: 1389420,
      validUntil: currentYearDate("12-11"),
      status: "pendiente",
      items: {
        create: [
          { productId: products[46].id, quantity: 2, price: 385000, subtotal: 770000 },
          { productId: products[48].id, quantity: 1, price: 235000, subtotal: 235000 },
          { productId: products[29].id, quantity: 5, price: 32000, subtotal: 160000 },
          { productId: products[47].id, quantity: 1, price: 58000, subtotal: 58000 },
        ],
      },
    },
  })

  await prisma.expense.createMany({
    data: [
      {
        date: currentYearDateTime("12-01T09:00:00"),
        category: "Servicios",
        description: "Pago de energía eléctrica del mes de noviembre",
        amount: 450000,
        responsibleUserId: admin.id,
        notes: "Factura #45678 - Codensa",
      },
      {
        date: currentYearDateTime("12-01T09:15:00"),
        category: "Servicios",
        description: "Internet y telefonía empresarial",
        amount: 180000,
        responsibleUserId: admin.id,
        notes: "Plan empresarial 100MB - Claro",
      },
      {
        date: currentYearDateTime("12-01T10:00:00"),
        category: "Alquiler",
        description: `Arriendo del local comercial - Diciembre ${CURRENT_YEAR}`,
        amount: 3500000,
        responsibleUserId: admin.id,
        notes: `Pago mensual - Contrato #${CURRENT_YEAR}-001`,
      },
      {
        date: currentYearDateTime("12-02T14:30:00"),
        category: "Transporte",
        description: "Flete de mercancía desde Medellín",
        amount: 350000,
        responsibleUserId: luis.id,
        notes: "Transportes Rápidos S.A - Guía #TR-12345",
      },
      {
        date: currentYearDateTime("12-03T11:00:00"),
        category: "Mantenimiento",
        description: "Reparación de estantería metálica",
        amount: 280000,
        responsibleUserId: patricia.id,
        notes: "Soldadura y pintura - Taller Metal Works",
      },
      {
        date: currentYearDateTime("12-03T15:00:00"),
        category: "Marketing",
        description: "Publicidad en redes sociales - Facebook Ads",
        amount: 500000,
        responsibleUserId: patricia.id,
        notes: `Campaña diciembre ${CURRENT_YEAR} - 30 días`,
      },
      {
        date: currentYearDateTime("12-04T08:30:00"),
        category: "Servicios",
        description: "Servicio de aseo y limpieza",
        amount: 320000,
        responsibleUserId: admin.id,
        notes: "Aseo Profesional Ltda - Quincenal",
      },
      {
        date: currentYearDateTime("12-04T16:00:00"),
        category: "Transporte",
        description: "Domicilios y entregas a clientes",
        amount: 180000,
        responsibleUserId: carlos.id,
        notes: "Mensajería urbana - Semana 1",
      },
      {
        date: currentYearDateTime("11-30T17:00:00"),
        category: "Salarios",
        description: `Nómina del mes de noviembre ${CURRENT_YEAR}`,
        amount: 12500000,
        responsibleUserId: admin.id,
        notes: "Pago de 8 empleados + prestaciones",
      },
      {
        date: currentYearDateTime("12-01T13:00:00"),
        category: "Mantenimiento",
        description: "Mantenimiento preventivo del sistema de aire acondicionado",
        amount: 450000,
        responsibleUserId: patricia.id,
        notes: "Clima Confort S.A.S - Revisión trimestral",
      },
    ],
  })

  await prisma.cashRecord.createMany({
    data: [
      {
        date: currentYearDate("12-01"),
        openingBalance: 500000,
        cashIncome: 336050,
        cashExpenses: 150000,
        closingBalance: 686050,
        userId: carlos.id,
        notes: "Venta en efectivo a Carlos Mendoza. Pago de domicilios.",
      },
      {
        date: currentYearDate("12-02"),
        openingBalance: 686050,
        cashIncome: 0,
        cashExpenses: 80000,
        closingBalance: 606050,
        userId: ana.id,
        notes: "Sin ventas en efectivo. Gastos menores de oficina.",
      },
      {
        date: currentYearDate("12-03"),
        openingBalance: 606050,
        cashIncome: 0,
        cashExpenses: 120000,
        closingBalance: 486050,
        userId: diego.id,
        notes: "Todas las ventas por transferencia. Pago de servicios menores.",
      },
      {
        date: currentYearDate("12-04"),
        openingBalance: 486050,
        cashIncome: 467900,
        cashExpenses: 200000,
        closingBalance: 753950,
        userId: sandra.id,
        notes: "Venta en efectivo a Taller Los Andes. Pago de transporte y domicilios.",
      },
    ],
  })

  // Seed: logo por defecto
  const logoPath = path.join(__dirname, "..", "public", "renaultreluz.png")
  if (fs.existsSync(logoPath)) {
    const logoBuffer = fs.readFileSync(logoPath)
    const logoBase64 = logoBuffer.toString("base64")
    const existing = await prisma.systemConfig.findFirst()
    if (existing) {
      await prisma.systemConfig.update({
        where: { id: existing.id },
        data: { logoMime: "image/png", logoBase64 },
      })
    } else {
      await prisma.systemConfig.create({ data: { logoMime: "image/png", logoBase64 } })
    }
    console.log(`  ✅ [${dbName}] Logo por defecto guardado`)
  }
}

async function runSeeds() {
  const targetArg = process.argv.find((arg) => arg.startsWith("--target="))
  const target = targetArg?.split("=")[1]
  const shouldSeedSqlite = !target || target === "sqlite"
  const shouldSeedPostgres = !target || target === "postgres"

  const sqliteAdapter = new PrismaLibSql({ url: resolveSqliteDatabaseUrl() })
  const prismaSqlite = new PrismaClientSQLite({ adapter: sqliteAdapter })

  const pgPool = new Pool({ connectionString: getPostgresDatabaseUrl() })
  const pgAdapter = new PrismaPg(pgPool)
  const prismaPostgres = new PrismaClientPostgres({ adapter: pgAdapter })

  try {
    if (shouldSeedSqlite) {
      await main(prismaSqlite, "SQLite (Local)")
    }

    if (shouldSeedPostgres) {
      await main(prismaPostgres, "PostgreSQL (Nube)")
    }
  } catch (e) {
    console.error("❌ Seed error:", e)
    process.exit(1)
  } finally {
    await prismaSqlite.$disconnect()
    await prismaPostgres.$disconnect()
    await pgPool.end()
  }
}

runSeeds()
