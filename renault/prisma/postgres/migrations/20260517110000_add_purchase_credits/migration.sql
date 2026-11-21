CREATE TABLE "purchase_credits" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" TIMESTAMP(3),
    CONSTRAINT "purchase_credits_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "purchase_credits_purchaseId_key" ON "purchase_credits"("purchaseId");
CREATE INDEX "purchase_credits_supplierId_idx" ON "purchase_credits"("supplierId");
CREATE INDEX "purchase_credits_status_idx" ON "purchase_credits"("status");
CREATE INDEX "purchase_credits_updatedAt_idx" ON "purchase_credits"("updatedAt");
CREATE INDEX "purchase_credits_lastSyncedAt_idx" ON "purchase_credits"("lastSyncedAt");

CREATE TABLE "purchase_credit_payments" (
    "id" TEXT NOT NULL,
    "purchaseCreditId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT NOT NULL DEFAULT 'efectivo',
    "reference" TEXT,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" TIMESTAMP(3),
    CONSTRAINT "purchase_credit_payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "purchase_credit_payments_purchaseCreditId_idx" ON "purchase_credit_payments"("purchaseCreditId");
CREATE INDEX "purchase_credit_payments_updatedAt_idx" ON "purchase_credit_payments"("updatedAt");
CREATE INDEX "purchase_credit_payments_lastSyncedAt_idx" ON "purchase_credit_payments"("lastSyncedAt");

ALTER TABLE "purchase_credits" ADD CONSTRAINT "purchase_credits_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "purchase_credits" ADD CONSTRAINT "purchase_credits_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_credit_payments" ADD CONSTRAINT "purchase_credit_payments_purchaseCreditId_fkey" FOREIGN KEY ("purchaseCreditId") REFERENCES "purchase_credits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
