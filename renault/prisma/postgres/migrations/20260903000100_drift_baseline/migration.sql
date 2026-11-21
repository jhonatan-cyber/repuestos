-- Convergencia: objetos que el schema declara pero la base no tiene
-- (la base se creó históricamente con `db push`, sin estas migraciones).
-- Sin DROPs: los índices trgm de 20260903000000 se mantienen a propósito
-- (son SQL crudo fuera del schema y `migrate diff` siempre los reporta).
-- Todo con IF NOT EXISTS para que sea re-ejecutable en cualquier entorno.

-- Columnas faltantes
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT NOT NULL DEFAULT 'efectivo';
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "externalClientPhone" TEXT;
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "paymentSplits" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "image" TEXT;

-- Tablas faltantes
CREATE TABLE IF NOT EXISTS "supplier_requests" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendiente',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "notes" TEXT,
    "response" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" TIMESTAMP(3),
    CONSTRAINT "supplier_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "credits" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" TIMESTAMP(3),
    CONSTRAINT "credits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "credit_payments" (
    "id" TEXT NOT NULL,
    "creditId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT NOT NULL DEFAULT 'efectivo',
    "reference" TEXT,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" TIMESTAMP(3),
    CONSTRAINT "credit_payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT,
    "changes" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "system_config" (
    "id" TEXT NOT NULL,
    "logoMime" TEXT,
    "logoBase64" TEXT,
    "companyName" TEXT NOT NULL DEFAULT 'Renault Reluz',
    "companySlogan" TEXT NOT NULL DEFAULT 'Repuestos automotrices',
    "companyAddress" TEXT NOT NULL DEFAULT 'Av. Confital - Av. Blanco Galindo Km 14.5',
    "companyCity" TEXT NOT NULL DEFAULT 'Quillacollo - Cochabamba',
    "companyPhone" TEXT NOT NULL DEFAULT '+591 63070278',
    "companyNit" TEXT NOT NULL DEFAULT '000000',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- Índices de tablas nuevas + índices simples que el diff reporta ausentes
CREATE INDEX IF NOT EXISTS "supplier_requests_quotationId_idx" ON "supplier_requests"("quotationId");
CREATE INDEX IF NOT EXISTS "supplier_requests_supplierId_idx" ON "supplier_requests"("supplierId");
CREATE INDEX IF NOT EXISTS "supplier_requests_status_idx" ON "supplier_requests"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "credits_saleId_key" ON "credits"("saleId");
CREATE INDEX IF NOT EXISTS "credits_clientId_idx" ON "credits"("clientId");
CREATE INDEX IF NOT EXISTS "credits_status_idx" ON "credits"("status");
CREATE INDEX IF NOT EXISTS "credits_updatedAt_idx" ON "credits"("updatedAt");
CREATE INDEX IF NOT EXISTS "credits_lastSyncedAt_idx" ON "credits"("lastSyncedAt");
CREATE INDEX IF NOT EXISTS "credit_payments_creditId_idx" ON "credit_payments"("creditId");
CREATE INDEX IF NOT EXISTS "credit_payments_updatedAt_idx" ON "credit_payments"("updatedAt");
CREATE INDEX IF NOT EXISTS "credit_payments_lastSyncedAt_idx" ON "credit_payments"("lastSyncedAt");
CREATE INDEX IF NOT EXISTS "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");
CREATE INDEX IF NOT EXISTS "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
CREATE INDEX IF NOT EXISTS "cash_records_date_idx" ON "cash_records"("date");
CREATE INDEX IF NOT EXISTS "cash_records_userId_idx" ON "cash_records"("userId");
CREATE INDEX IF NOT EXISTS "cash_records_status_idx" ON "cash_records"("status");
CREATE INDEX IF NOT EXISTS "cash_withdrawals_cashRecordId_idx" ON "cash_withdrawals"("cashRecordId");
CREATE INDEX IF NOT EXISTS "cash_withdrawals_userId_idx" ON "cash_withdrawals"("userId");
CREATE INDEX IF NOT EXISTS "categories_type_idx" ON "categories"("type");
CREATE INDEX IF NOT EXISTS "categories_updatedAt_idx" ON "categories"("updatedAt");
CREATE INDEX IF NOT EXISTS "categories_lastSyncedAt_idx" ON "categories"("lastSyncedAt");
CREATE INDEX IF NOT EXISTS "clients_status_idx" ON "clients"("status");
CREATE INDEX IF NOT EXISTS "clients_updatedAt_idx" ON "clients"("updatedAt");
CREATE INDEX IF NOT EXISTS "clients_lastSyncedAt_idx" ON "clients"("lastSyncedAt");
CREATE INDEX IF NOT EXISTS "commissions_sellerId_idx" ON "commissions"("sellerId");
CREATE INDEX IF NOT EXISTS "commissions_saleId_idx" ON "commissions"("saleId");
CREATE INDEX IF NOT EXISTS "commissions_date_idx" ON "commissions"("date");
CREATE INDEX IF NOT EXISTS "commissions_status_idx" ON "commissions"("status");
CREATE INDEX IF NOT EXISTS "expenses_date_idx" ON "expenses"("date");
CREATE INDEX IF NOT EXISTS "expenses_responsibleUserId_idx" ON "expenses"("responsibleUserId");
CREATE INDEX IF NOT EXISTS "expenses_category_idx" ON "expenses"("category");
CREATE INDEX IF NOT EXISTS "products_categoryId_idx" ON "products"("categoryId");
CREATE INDEX IF NOT EXISTS "products_supplierId_idx" ON "products"("supplierId");
CREATE INDEX IF NOT EXISTS "products_updatedAt_idx" ON "products"("updatedAt");
CREATE INDEX IF NOT EXISTS "products_lastSyncedAt_idx" ON "products"("lastSyncedAt");
CREATE INDEX IF NOT EXISTS "purchase_items_purchaseId_idx" ON "purchase_items"("purchaseId");
CREATE INDEX IF NOT EXISTS "purchase_items_productId_idx" ON "purchase_items"("productId");
CREATE INDEX IF NOT EXISTS "purchases_supplierId_idx" ON "purchases"("supplierId");
CREATE INDEX IF NOT EXISTS "purchases_buyerUserId_idx" ON "purchases"("buyerUserId");
CREATE INDEX IF NOT EXISTS "purchases_date_idx" ON "purchases"("date");
CREATE INDEX IF NOT EXISTS "purchases_status_idx" ON "purchases"("status");
CREATE INDEX IF NOT EXISTS "purchases_updatedAt_idx" ON "purchases"("updatedAt");
CREATE INDEX IF NOT EXISTS "purchases_lastSyncedAt_idx" ON "purchases"("lastSyncedAt");
CREATE INDEX IF NOT EXISTS "quotation_items_quotationId_idx" ON "quotation_items"("quotationId");
CREATE INDEX IF NOT EXISTS "quotation_items_productId_idx" ON "quotation_items"("productId");
CREATE INDEX IF NOT EXISTS "quotations_clientId_idx" ON "quotations"("clientId");
CREATE INDEX IF NOT EXISTS "quotations_sellerUserId_idx" ON "quotations"("sellerUserId");
CREATE INDEX IF NOT EXISTS "quotations_date_idx" ON "quotations"("date");
CREATE INDEX IF NOT EXISTS "quotations_status_idx" ON "quotations"("status");
CREATE INDEX IF NOT EXISTS "quotations_updatedAt_idx" ON "quotations"("updatedAt");
CREATE INDEX IF NOT EXISTS "quotations_lastSyncedAt_idx" ON "quotations"("lastSyncedAt");
CREATE INDEX IF NOT EXISTS "sale_items_saleId_idx" ON "sale_items"("saleId");
CREATE INDEX IF NOT EXISTS "sale_items_productId_idx" ON "sale_items"("productId");
CREATE INDEX IF NOT EXISTS "sales_clientId_idx" ON "sales"("clientId");
CREATE INDEX IF NOT EXISTS "sales_sellerUserId_idx" ON "sales"("sellerUserId");
CREATE INDEX IF NOT EXISTS "sales_date_idx" ON "sales"("date");
CREATE INDEX IF NOT EXISTS "sales_status_idx" ON "sales"("status");
CREATE INDEX IF NOT EXISTS "sales_updatedAt_idx" ON "sales"("updatedAt");
CREATE INDEX IF NOT EXISTS "sales_lastSyncedAt_idx" ON "sales"("lastSyncedAt");
CREATE INDEX IF NOT EXISTS "suppliers_updatedAt_idx" ON "suppliers"("updatedAt");
CREATE INDEX IF NOT EXISTS "suppliers_lastSyncedAt_idx" ON "suppliers"("lastSyncedAt");
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");
CREATE INDEX IF NOT EXISTS "users_status_idx" ON "users"("status");
CREATE INDEX IF NOT EXISTS "users_updatedAt_idx" ON "users"("updatedAt");
CREATE INDEX IF NOT EXISTS "users_lastSyncedAt_idx" ON "users"("lastSyncedAt");

-- FKs de tablas nuevas (vacías: creación siempre segura)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'supplier_requests_quotationId_fkey') THEN
    ALTER TABLE "supplier_requests" ADD CONSTRAINT "supplier_requests_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'supplier_requests_supplierId_fkey') THEN
    ALTER TABLE "supplier_requests" ADD CONSTRAINT "supplier_requests_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'credits_saleId_fkey') THEN
    ALTER TABLE "credits" ADD CONSTRAINT "credits_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'credits_clientId_fkey') THEN
    ALTER TABLE "credits" ADD CONSTRAINT "credits_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'credit_payments_creditId_fkey') THEN
    ALTER TABLE "credit_payments" ADD CONSTRAINT "credit_payments_creditId_fkey" FOREIGN KEY ("creditId") REFERENCES "credits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_userId_fkey') THEN
    ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
