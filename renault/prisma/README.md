# Migraciones de Base de Datos - Prisma

Este proyecto utiliza Prisma como ORM para gestionar la base de datos PostgreSQL.

## 📋 Estructura de la Base de Datos

El esquema de la base de datos incluye las siguientes entidades:

### Entidades Principales

- **User** - Usuarios del sistema con roles y permisos
- **Client** - Clientes de la empresa
- **Supplier** - Proveedores
- **Category** - Categorías de productos y gastos
- **Product** - Productos/Inventario
- **Sale** - Ventas realizadas
- **SaleItem** - Items de cada venta
- **Purchase** - Compras a proveedores
- **PurchaseItem** - Items de cada compra
- **Quotation** - Cotizaciones
- **QuotationItem** - Items de cada cotización
- **Commission** - Comisiones de vendedores
- **Expense** - Gastos de la empresa
- **CashRecord** - Registros de caja diaria

## 🚀 Comandos Disponibles

### Migraciones

```bash
# Crear una nueva migración
pnpm db:migrate

# Aplicar migraciones en producción
pnpm db:migrate:deploy

# Generar el cliente de Prisma
pnpm db:generate

# Resetear la base de datos (¡CUIDADO! Elimina todos los datos)
pnpm db:reset
```

### Seed (Datos Iniciales)

```bash
# Ejecutar el seed para poblar la base de datos con datos de prueba
pnpm db:seed
```

El seed crea:

- 5 usuarios de prueba (admin, vendedor, compras, supervisor, invitado)
- 4 categorías (Electrónica, Ropa, Alimentos, Oficina)
- 2 proveedores
- 3 clientes
- 5 productos de ejemplo

**Credenciales de prueba:**

- Admin: el correo de prueba `admin@gmail.com` usa una clave definida por ti en `SEED_ADMIN_PASSWORD`.
- Vendedor: `juan@erp.com` / `pass123`
- Compras: `maria@erp.com` / `pass123`
- Supervisor: `supervisor@erp.com` / `pass123`
- Invitado: `guest@erp.com` / `pass123`

### Prisma Studio

```bash
# Abrir Prisma Studio (interfaz visual para la base de datos)
pnpm db:studio
```

## 📁 Estructura de Archivos

```
prisma/
├── schema.prisma          # Esquema de la base de datos
├── seed.ts               # Script de seed para datos iniciales
├── migrations/           # Migraciones de la base de datos
│   └── [timestamp]_[name]/
│       └── migration.sql
└── README.md            # Este archivo
```

## 🔧 Configuración

### Variables de Entorno

Asegúrate de tener configurado el archivo `.env` con:

```env
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/nombre_base_datos
# Define SEED_ADMIN_PASSWORD con tu propia clave (mínimo 8 caracteres) antes de ejecutar db:seed.
```

### Primer Uso

1. **Aplicar migraciones:**

   ```bash
   pnpm db:migrate
   ```

2. **Generar cliente de Prisma:**

   ```bash
   pnpm db:generate
   ```

3. **Poblar con datos iniciales (opcional):**
   ```bash
   pnpm db:seed
   ```

## 📝 Crear una Nueva Migración

Cuando modifiques el `schema.prisma`:

1. Ejecuta `pnpm db:migrate`
2. Prisma te pedirá un nombre para la migración
3. Revisa el archivo SQL generado en `prisma/migrations/`
4. La migración se aplicará automáticamente

## ⚠️ Notas Importantes

- **Nunca edites manualmente** los archivos de migración ya aplicados
- **Siempre revisa** el SQL generado antes de aplicar en producción
- **Haz backup** de la base de datos antes de ejecutar `db:reset`
- Las migraciones en producción deben aplicarse con `db:migrate:deploy`

## 🔗 Recursos

- [Documentación de Prisma](https://www.prisma.io/docs)
- [Guía de Migraciones](https://www.prisma.io/docs/concepts/components/prisma-migrate)
