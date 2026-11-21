PRAGMA foreign_keys=OFF;

CREATE TABLE "new_sales" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "clientId" TEXT,
    "sellerUserId" TEXT NOT NULL,
    "subtotal" REAL NOT NULL,
    "tax" REAL NOT NULL DEFAULT 0,
    "discount" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paymentSplits" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completada',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" DATETIME,
    CONSTRAINT "sales_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "sales_sellerUserId_fkey" FOREIGN KEY ("sellerUserId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_sales" ("id", "date", "clientId", "sellerUserId", "subtotal", "tax", "discount", "total", "paymentMethod", "paymentSplits", "notes", "status", "createdAt", "updatedAt", "isDeleted", "lastSyncedAt")
SELECT "id", "date", "clientId", "sellerUserId", "subtotal", "tax", "discount", "total", "paymentMethod", "paymentSplits", "notes", "status", "createdAt", "updatedAt", "isDeleted", "lastSyncedAt"
FROM "sales";

DROP TABLE "sales";
ALTER TABLE "new_sales" RENAME TO "sales";

CREATE INDEX "sales_clientId_idx" ON "sales"("clientId");
CREATE INDEX "sales_sellerUserId_idx" ON "sales"("sellerUserId");
CREATE INDEX "sales_date_idx" ON "sales"("date");
CREATE INDEX "sales_status_idx" ON "sales"("status");
CREATE INDEX "sales_updatedAt_idx" ON "sales"("updatedAt");
CREATE INDEX "sales_lastSyncedAt_idx" ON "sales"("lastSyncedAt");

PRAGMA foreign_keys=ON;
