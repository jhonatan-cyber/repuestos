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
    "supplierId" TEXT,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" DATETIME,
    CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "products_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_products" ("id", "code", "name", "brand", "model", "categoryId", "purchasePrice", "salePrice", "stock", "minimumStock", "unit", "supplierId", "image", "createdAt", "updatedAt", "isDeleted", "lastSyncedAt")
SELECT "id", "code", "name", "brand", "model", "categoryId", "purchasePrice", "salePrice", "stock", "minimumStock", "unit", "supplierId", "image", "createdAt", "updatedAt", "isDeleted", "lastSyncedAt"
FROM "products";

DROP TABLE "products";
ALTER TABLE "new_products" RENAME TO "products";

CREATE UNIQUE INDEX "products_code_key" ON "products"("code");
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");
CREATE INDEX "products_supplierId_idx" ON "products"("supplierId");
CREATE INDEX "products_updatedAt_idx" ON "products"("updatedAt");
CREATE INDEX "products_lastSyncedAt_idx" ON "products"("lastSyncedAt");

PRAGMA foreign_keys=ON;
