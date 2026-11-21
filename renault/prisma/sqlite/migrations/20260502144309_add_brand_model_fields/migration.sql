/*
  Warnings:

  - Added the required column `brand` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `model` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "purchasePrice" REAL NOT NULL,
    "salePrice" REAL NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "minimumStock" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'unidad',
    "supplierId" TEXT NOT NULL,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" DATETIME,
    CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "products_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_products" ("categoryId", "code", "createdAt", "id", "image", "isDeleted", "lastSyncedAt", "minimumStock", "name", "purchasePrice", "salePrice", "stock", "supplierId", "unit", "updatedAt") SELECT "categoryId", "code", "createdAt", "id", "image", "isDeleted", "lastSyncedAt", "minimumStock", "name", "purchasePrice", "salePrice", "stock", "supplierId", "unit", "updatedAt" FROM "products";
DROP TABLE "products";
ALTER TABLE "new_products" RENAME TO "products";
CREATE UNIQUE INDEX "products_code_key" ON "products"("code");
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");
CREATE INDEX "products_supplierId_idx" ON "products"("supplierId");
CREATE INDEX "products_updatedAt_idx" ON "products"("updatedAt");
CREATE INDEX "products_lastSyncedAt_idx" ON "products"("lastSyncedAt");
CREATE TABLE "new_quotations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "clientId" TEXT,
    "externalClientName" TEXT,
    "sellerUserId" TEXT NOT NULL,
    "subtotal" REAL NOT NULL,
    "tax" REAL NOT NULL DEFAULT 0,
    "discount" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "validUntil" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'activa',
    "convertedToSaleId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" DATETIME,
    CONSTRAINT "quotations_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "quotations_sellerUserId_fkey" FOREIGN KEY ("sellerUserId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "quotations_convertedToSaleId_fkey" FOREIGN KEY ("convertedToSaleId") REFERENCES "sales" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_quotations" ("clientId", "convertedToSaleId", "createdAt", "date", "discount", "id", "isDeleted", "lastSyncedAt", "sellerUserId", "status", "subtotal", "tax", "total", "updatedAt", "validUntil") SELECT "clientId", "convertedToSaleId", "createdAt", "date", "discount", "id", "isDeleted", "lastSyncedAt", "sellerUserId", "status", "subtotal", "tax", "total", "updatedAt", "validUntil" FROM "quotations";
DROP TABLE "quotations";
ALTER TABLE "new_quotations" RENAME TO "quotations";
CREATE UNIQUE INDEX "quotations_convertedToSaleId_key" ON "quotations"("convertedToSaleId");
CREATE INDEX "quotations_clientId_idx" ON "quotations"("clientId");
CREATE INDEX "quotations_sellerUserId_idx" ON "quotations"("sellerUserId");
CREATE INDEX "quotations_date_idx" ON "quotations"("date");
CREATE INDEX "quotations_status_idx" ON "quotations"("status");
CREATE INDEX "quotations_updatedAt_idx" ON "quotations"("updatedAt");
CREATE INDEX "quotations_lastSyncedAt_idx" ON "quotations"("lastSyncedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
