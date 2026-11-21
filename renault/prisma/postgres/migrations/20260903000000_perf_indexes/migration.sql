-- Perf indexes: isDeleted + compuestos + pg_trgm para búsquedas LIKE %x%
-- Cada índice se crea solo si su tabla existe (la base puede tener drift de
-- migraciones viejas creadas con db push; ver 20260903000100_drift_baseline).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

DO $$ BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "users_isDeleted_idx" ON "users"("isDeleted");
    CREATE INDEX IF NOT EXISTS "users_role_status_idx" ON "users"("role", "status");
  END IF;
  IF to_regclass('public.clients') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "clients_name_idx" ON "clients"("name");
    CREATE INDEX IF NOT EXISTS "clients_isDeleted_idx" ON "clients"("isDeleted");
    CREATE INDEX IF NOT EXISTS "clients_isDeleted_status_idx" ON "clients"("isDeleted", "status");
    CREATE INDEX IF NOT EXISTS "clients_name_trgm_idx" ON "clients" USING gin ("name" gin_trgm_ops);
  END IF;
  IF to_regclass('public.suppliers') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "suppliers_name_idx" ON "suppliers"("name");
    CREATE INDEX IF NOT EXISTS "suppliers_isDeleted_idx" ON "suppliers"("isDeleted");
    CREATE INDEX IF NOT EXISTS "suppliers_name_trgm_idx" ON "suppliers" USING gin ("name" gin_trgm_ops);
  END IF;
  IF to_regclass('public.categories') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "categories_isDeleted_idx" ON "categories"("isDeleted");
  END IF;
  IF to_regclass('public.products') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "products_name_idx" ON "products"("name");
    CREATE INDEX IF NOT EXISTS "products_isDeleted_idx" ON "products"("isDeleted");
    CREATE INDEX IF NOT EXISTS "products_isDeleted_categoryId_idx" ON "products"("isDeleted", "categoryId");
    CREATE INDEX IF NOT EXISTS "products_stock_idx" ON "products"("stock");
    CREATE INDEX IF NOT EXISTS "products_name_trgm_idx" ON "products" USING gin ("name" gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS "products_code_trgm_idx" ON "products" USING gin ("code" gin_trgm_ops);
  END IF;
  IF to_regclass('public.sales') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "sales_isDeleted_idx" ON "sales"("isDeleted");
    CREATE INDEX IF NOT EXISTS "sales_date_status_idx" ON "sales"("date", "status");
    CREATE INDEX IF NOT EXISTS "sales_isDeleted_status_idx" ON "sales"("isDeleted", "status");
  END IF;
  IF to_regclass('public.purchases') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "purchases_isDeleted_idx" ON "purchases"("isDeleted");
    CREATE INDEX IF NOT EXISTS "purchases_date_status_idx" ON "purchases"("date", "status");
    CREATE INDEX IF NOT EXISTS "purchases_isDeleted_status_idx" ON "purchases"("isDeleted", "status");
  END IF;
  IF to_regclass('public.quotations') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "quotations_isDeleted_idx" ON "quotations"("isDeleted");
    CREATE INDEX IF NOT EXISTS "quotations_date_status_idx" ON "quotations"("date", "status");
  END IF;
  IF to_regclass('public.expenses') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "expenses_isDeleted_idx" ON "expenses"("isDeleted");
    CREATE INDEX IF NOT EXISTS "expenses_date_category_idx" ON "expenses"("date", "category");
  END IF;
  IF to_regclass('public.cash_records') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "cash_records_isDeleted_idx" ON "cash_records"("isDeleted");
    CREATE INDEX IF NOT EXISTS "cash_records_status_isDeleted_idx" ON "cash_records"("status", "isDeleted");
  END IF;
  IF to_regclass('public.credits') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "credits_isDeleted_idx" ON "credits"("isDeleted");
    CREATE INDEX IF NOT EXISTS "credits_clientId_status_idx" ON "credits"("clientId", "status");
  END IF;
  IF to_regclass('public.purchase_credits') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "purchase_credits_isDeleted_idx" ON "purchase_credits"("isDeleted");
    CREATE INDEX IF NOT EXISTS "purchase_credits_supplierId_status_idx" ON "purchase_credits"("supplierId", "status");
  END IF;
END $$;
