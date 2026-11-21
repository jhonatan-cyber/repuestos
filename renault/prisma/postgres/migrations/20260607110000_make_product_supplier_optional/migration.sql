ALTER TABLE "products" ALTER COLUMN "supplierId" DROP NOT NULL;

ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_supplierId_fkey";

ALTER TABLE "products"
  ADD CONSTRAINT "products_supplierId_fkey"
  FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
