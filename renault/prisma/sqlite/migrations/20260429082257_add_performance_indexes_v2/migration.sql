/*
  Warnings:

  - You are about to drop the column `icon` on the `categories` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "permissions" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6B7280',
    "status" TEXT NOT NULL DEFAULT 'active',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" DATETIME
);

-- CreateTable
CREATE TABLE "cash_withdrawals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cashRecordId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" DATETIME,
    CONSTRAINT "cash_withdrawals_cashRecordId_fkey" FOREIGN KEY ("cashRecordId") REFERENCES "cash_records" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cash_withdrawals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_cash_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "openingBalance" REAL NOT NULL,
    "cashIncome" REAL NOT NULL DEFAULT 0,
    "cashExpenses" REAL NOT NULL DEFAULT 0,
    "closingBalance" REAL NOT NULL,
    "notes" TEXT,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'closed',
    "closedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" DATETIME,
    CONSTRAINT "cash_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_cash_records" ("cashExpenses", "cashIncome", "closingBalance", "date", "id", "isDeleted", "lastSyncedAt", "notes", "openingBalance", "updatedAt", "userId") SELECT "cashExpenses", "cashIncome", "closingBalance", "date", "id", "isDeleted", "lastSyncedAt", "notes", "openingBalance", "updatedAt", "userId" FROM "cash_records";
DROP TABLE "cash_records";
ALTER TABLE "new_cash_records" RENAME TO "cash_records";
CREATE INDEX "cash_records_date_idx" ON "cash_records"("date");
CREATE INDEX "cash_records_userId_idx" ON "cash_records"("userId");
CREATE INDEX "cash_records_status_idx" ON "cash_records"("status");
CREATE TABLE "new_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'product',
    "updatedAt" DATETIME NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" DATETIME
);
INSERT INTO "new_categories" ("color", "id", "isDeleted", "lastSyncedAt", "name", "type", "updatedAt") SELECT "color", "id", "isDeleted", "lastSyncedAt", "name", "type", "updatedAt" FROM "categories";
DROP TABLE "categories";
ALTER TABLE "new_categories" RENAME TO "categories";
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");
CREATE INDEX "categories_type_idx" ON "categories"("type");
CREATE INDEX "categories_updatedAt_idx" ON "categories"("updatedAt");
CREATE INDEX "categories_lastSyncedAt_idx" ON "categories"("lastSyncedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "cash_withdrawals_cashRecordId_idx" ON "cash_withdrawals"("cashRecordId");

-- CreateIndex
CREATE INDEX "cash_withdrawals_userId_idx" ON "cash_withdrawals"("userId");

-- CreateIndex
CREATE INDEX "clients_status_idx" ON "clients"("status");

-- CreateIndex
CREATE INDEX "clients_updatedAt_idx" ON "clients"("updatedAt");

-- CreateIndex
CREATE INDEX "clients_lastSyncedAt_idx" ON "clients"("lastSyncedAt");

-- CreateIndex
CREATE INDEX "commissions_sellerId_idx" ON "commissions"("sellerId");

-- CreateIndex
CREATE INDEX "commissions_saleId_idx" ON "commissions"("saleId");

-- CreateIndex
CREATE INDEX "commissions_date_idx" ON "commissions"("date");

-- CreateIndex
CREATE INDEX "commissions_status_idx" ON "commissions"("status");

-- CreateIndex
CREATE INDEX "expenses_date_idx" ON "expenses"("date");

-- CreateIndex
CREATE INDEX "expenses_responsibleUserId_idx" ON "expenses"("responsibleUserId");

-- CreateIndex
CREATE INDEX "expenses_category_idx" ON "expenses"("category");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- CreateIndex
CREATE INDEX "products_supplierId_idx" ON "products"("supplierId");

-- CreateIndex
CREATE INDEX "products_updatedAt_idx" ON "products"("updatedAt");

-- CreateIndex
CREATE INDEX "products_lastSyncedAt_idx" ON "products"("lastSyncedAt");

-- CreateIndex
CREATE INDEX "purchase_items_purchaseId_idx" ON "purchase_items"("purchaseId");

-- CreateIndex
CREATE INDEX "purchase_items_productId_idx" ON "purchase_items"("productId");

-- CreateIndex
CREATE INDEX "purchases_supplierId_idx" ON "purchases"("supplierId");

-- CreateIndex
CREATE INDEX "purchases_buyerUserId_idx" ON "purchases"("buyerUserId");

-- CreateIndex
CREATE INDEX "purchases_date_idx" ON "purchases"("date");

-- CreateIndex
CREATE INDEX "purchases_status_idx" ON "purchases"("status");

-- CreateIndex
CREATE INDEX "purchases_updatedAt_idx" ON "purchases"("updatedAt");

-- CreateIndex
CREATE INDEX "purchases_lastSyncedAt_idx" ON "purchases"("lastSyncedAt");

-- CreateIndex
CREATE INDEX "quotation_items_quotationId_idx" ON "quotation_items"("quotationId");

-- CreateIndex
CREATE INDEX "quotation_items_productId_idx" ON "quotation_items"("productId");

-- CreateIndex
CREATE INDEX "quotations_clientId_idx" ON "quotations"("clientId");

-- CreateIndex
CREATE INDEX "quotations_sellerUserId_idx" ON "quotations"("sellerUserId");

-- CreateIndex
CREATE INDEX "quotations_date_idx" ON "quotations"("date");

-- CreateIndex
CREATE INDEX "quotations_status_idx" ON "quotations"("status");

-- CreateIndex
CREATE INDEX "quotations_updatedAt_idx" ON "quotations"("updatedAt");

-- CreateIndex
CREATE INDEX "quotations_lastSyncedAt_idx" ON "quotations"("lastSyncedAt");

-- CreateIndex
CREATE INDEX "sale_items_saleId_idx" ON "sale_items"("saleId");

-- CreateIndex
CREATE INDEX "sale_items_productId_idx" ON "sale_items"("productId");

-- CreateIndex
CREATE INDEX "sales_clientId_idx" ON "sales"("clientId");

-- CreateIndex
CREATE INDEX "sales_sellerUserId_idx" ON "sales"("sellerUserId");

-- CreateIndex
CREATE INDEX "sales_date_idx" ON "sales"("date");

-- CreateIndex
CREATE INDEX "sales_status_idx" ON "sales"("status");

-- CreateIndex
CREATE INDEX "sales_updatedAt_idx" ON "sales"("updatedAt");

-- CreateIndex
CREATE INDEX "sales_lastSyncedAt_idx" ON "sales"("lastSyncedAt");

-- CreateIndex
CREATE INDEX "suppliers_updatedAt_idx" ON "suppliers"("updatedAt");

-- CreateIndex
CREATE INDEX "suppliers_lastSyncedAt_idx" ON "suppliers"("lastSyncedAt");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_updatedAt_idx" ON "users"("updatedAt");

-- CreateIndex
CREATE INDEX "users_lastSyncedAt_idx" ON "users"("lastSyncedAt");
