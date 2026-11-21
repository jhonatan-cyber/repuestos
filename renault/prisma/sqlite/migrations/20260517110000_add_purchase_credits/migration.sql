CREATE TABLE "purchase_credits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchaseId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "total" REAL NOT NULL,
    "balance" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dueDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" DATETIME,
    CONSTRAINT "purchase_credits_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "purchase_credits_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "purchase_credits_purchaseId_key" ON "purchase_credits"("purchaseId");
CREATE INDEX "purchase_credits_supplierId_idx" ON "purchase_credits"("supplierId");
CREATE INDEX "purchase_credits_status_idx" ON "purchase_credits"("status");
CREATE INDEX "purchase_credits_updatedAt_idx" ON "purchase_credits"("updatedAt");
CREATE INDEX "purchase_credits_lastSyncedAt_idx" ON "purchase_credits"("lastSyncedAt");

CREATE TABLE "purchase_credit_payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchaseCreditId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT NOT NULL DEFAULT 'efectivo',
    "reference" TEXT,
    "notes" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" DATETIME,
    CONSTRAINT "purchase_credit_payments_purchaseCreditId_fkey" FOREIGN KEY ("purchaseCreditId") REFERENCES "purchase_credits"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "purchase_credit_payments_purchaseCreditId_idx" ON "purchase_credit_payments"("purchaseCreditId");
CREATE INDEX "purchase_credit_payments_updatedAt_idx" ON "purchase_credit_payments"("updatedAt");
CREATE INDEX "purchase_credit_payments_lastSyncedAt_idx" ON "purchase_credit_payments"("lastSyncedAt");
