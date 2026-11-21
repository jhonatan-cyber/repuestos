ALTER TABLE "sales" ALTER COLUMN "clientId" DROP NOT NULL;

ALTER TABLE "sales" DROP CONSTRAINT IF EXISTS "sales_clientId_fkey";

ALTER TABLE "sales"
  ADD CONSTRAINT "sales_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "clients"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
