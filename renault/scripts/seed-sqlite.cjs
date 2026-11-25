// scripts/seed-sqlite.cjs
// Requires SEED_ADMIN_PASSWORD (at least 8 characters) in the environment.

const { DatabaseSync } = require('node:sqlite')
const path = require('path')
const crypto = require('crypto')
require('dotenv').config({ override: true })
const { resolveSqliteDatabasePath } = require('../lib/shared/database-config')

const DB = path.resolve(__dirname, '../prisma/renault.db')
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD
if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
  console.error(
    'Define SEED_ADMIN_PASSWORD con al menos 8 caracteres antes de ejecutar el seed.',
  )
  process.exit(1)
}

function hash(pw) { return crypto.createHash('sha256').update('renault-salt-' + pw).digest('hex') }

const db = new DatabaseSync(DB, { readonly: false })
const NOW = "datetime('now')"

console.log('🌱 Seeding SQLite demo data...\n')

function ins(table, cols, rows) {
  const colList = cols.map(c => `"${c}"`).join(', ')
  const vals = rows.map(r => `(${r.map(v => v === null ? 'NULL' : `'${String(v).replace(/'/g,"''")}'`).join(',')})`).join(',\n')
  const sql = `INSERT INTO "${table}" (${colList}) VALUES\n${vals}`
  db.exec(sql)
  console.log(`  ✅ ${rows.length} ${table}`)
}

// Roles
ins('roles',
  ['id','name','description','permissions','color','isSystem','status','createdAt','updatedAt','isDeleted','lastSyncedAt'],
  [
    ['r-admin','Administrador','Acceso completo','dashboard,clients,suppliers,inventory,quotations,purchases,sales,expenses,reports,cash,categories,users,roles,permissions','#EF4444',1,'active',NOW,NOW,0,null],
    ['r-seller','Vendedor','Ventas y clientes','dashboard,clients,inventory,quotations,sales,reports','#3B82F6',1,'active',NOW,NOW,0,null],
    ['r-buyer','Comprador','Compras y proveedores','dashboard,suppliers,inventory,purchases,reports','#8B5CF6',1,'active',NOW,NOW,0,null],
    ['r-supervisor','Supervisor','Supervision','dashboard,clients,suppliers,inventory,quotations,purchases,sales,expenses,reports,cash','#F97316',1,'active',NOW,NOW,0,null],
  ])

// Users
ins('users',
  ['id','ci','firstName','lastName','address','phone','email','password','role','status','createdAt','updatedAt','isDeleted','lastSyncedAt'],
  [
    ['u-admin','0000001','Admin','Sistema','Av. Principal','70000001','admin@gmail.com',hash(ADMIN_PASSWORD),'administrador','active',NOW,NOW,0,null],
    ['u-seller','0000002','Carlos','Rodriguez','Calle 2','70000002','carlos.rodriguez@repuestos.com',hash('vendedor123'),'vendedor','active',NOW,NOW,0,null],
    ['u-buyer','0000003','Luis','Castro','Av. 3','70000003','luis.castro@repuestos.com',hash('compras123'),'comprador','active',NOW,NOW,0,null],
    ['u-sup','0000004','Patricia','Morales','Calle 4','70000004','patricia.morales@repuestos.com',hash('supervisor123'),'supervisor','active',NOW,NOW,0,null],
  ])

// Categories
ins('categories',
  ['id','name','color','description','type','updatedAt','isDeleted','lastSyncedAt'],
  [
    ['cat-motor','Motor','#EF4444','Partes del motor','product',NOW,0,null],
    ['cat-frenos','Frenos','#3B82F6','Sistema de frenos','product',NOW,0,null],
    ['cat-electrico','Electrico','#F59E0B','Sistema electrico','product',NOW,0,null],
    ['cat-suspension','Suspension','#10B981','Amortiguadores','product',NOW,0,null],
    ['cat-filtros','Filtros','#8B5CF6','Filtros varios','product',NOW,0,null],
    ['cat-aceites','Aceites','#EC4899','Lubricantes','product',NOW,0,null],
    ['cat-gastos-op','Gastos Operativos','#6B7280','Gastos','expense',NOW,0,null],
  ])

// Suppliers
ins('suppliers',
  ['id','name','company','phone','email','address','totalPurchases','createdAt','updatedAt','isDeleted','lastSyncedAt'],
  [
    ['sup-1','AutoPartes Bolivia','AutoPartes','444-1234','ventas@autopartes.bo','Av. Blanco Galindo',0,NOW,NOW,0,null],
    ['sup-2','Importadora Diaz','Importadora','444-5678','info@diaimport.com','Zona Central',0,NOW,NOW,0,null],
    ['sup-3','Repuestos Andinos','RepAndinos','444-9012','contacto@repandinos.com','Av. Circunvalacion',0,NOW,NOW,0,null],
  ])

// Clients
ins('clients',
  ['id','name','phone','email','nit','address','status','totalPurchases','createdAt','updatedAt','isDeleted','lastSyncedAt'],
  [
    ['cli-1','Juan Perez','70010001','juan@email.com','0000001','Av. Heroinas','active',0,NOW,NOW,0,null],
    ['cli-2','Maria Lopez','70010002',null,null,'Calle Sucre','active',0,NOW,NOW,0,null],
    ['cli-3','Taller El Rapido','70010003','taller@rapido.com',null,'Zona Sud','active',0,NOW,NOW,0,null],
    ['cli-4','Pedro Gomez','70010004',null,null,'Av. Ayacucho','active',0,NOW,NOW,0,null],
  ])

// Products
ins('products',
  ['id','code','name','brand','model','categoryId','purchasePrice','salePrice','stock','minimumStock','unit','supplierId','image','createdAt','updatedAt','isDeleted','lastSyncedAt'],
  [
    ['prod-1','ALT-001','Alternador Renault Clio','Valeo','Clio II','cat-electrico',450,650,10,2,'unidad','sup-1',null,NOW,NOW,0,null],
    ['prod-2','FRE-001','Pastillas de Freno Delanteras','Bosch','Universal','cat-frenos',120,180,25,5,'juego','sup-2',null,NOW,NOW,0,null],
    ['prod-3','ACE-001','Aceite 15W40 5L','Castrol','GTX','cat-aceites',80,120,50,10,'unidad','sup-3',null,NOW,NOW,0,null],
    ['prod-4','FIL-001','Filtro de Aceite','Mann','W712','cat-filtros',35,55,60,10,'unidad','sup-1',null,NOW,NOW,0,null],
    ['prod-5','MOT-001','Bomba de Agua','SKF','Clio','cat-motor',280,420,8,2,'unidad','sup-2',null,NOW,NOW,0,null],
    ['prod-6','SUS-001','Amortiguador Delantero','Monroe','Logan','cat-suspension',350,520,15,3,'unidad','sup-1',null,NOW,NOW,0,null],
    ['prod-7','ELE-001','Bateria 60Ah','Bosch','S4','cat-electrico',380,550,12,3,'unidad','sup-3',null,NOW,NOW,0,null],
    ['prod-8','FRE-002','Disco de Freno','TRW','Universal','cat-frenos',180,280,20,4,'unidad','sup-2',null,NOW,NOW,0,null],
  ])

// Cash Record
ins('cash_records',
  ['id','date','openingBalance','cashIncome','cashExpenses','closingBalance','notes','userId','status','closedAt','createdAt','updatedAt','isDeleted','lastSyncedAt'],
  [
    ['cash-1',NOW,1000,0,0,1000,null,'u-admin','open',null,NOW,NOW,0,null],
  ])

console.log(`\n✨ SQLite seeded successfully!`)
console.log(`\n📂 ${DB}`)
console.log(`\n🔐 Credentials:`)
console.log(`   admin@gmail.com / contraseña definida en SEED_ADMIN_PASSWORD`)
console.log(`   carlos.rodriguez@repuestos.com / vendedor123`)
console.log(`   luis.castro@repuestos.com / compras123`)
console.log(`   patricia.morales@repuestos.com / supervisor123`)
console.log(`\n⚠️  SHA256 hashes — for bcrypt, run: pnpm dev`)

db.close()
