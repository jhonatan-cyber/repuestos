-- Add description column to products table
ALTER TABLE "products" ADD COLUMN "description" TEXT;

-- Backfill description for existing products that don't have one
UPDATE "products" SET "description" = '' WHERE "description" IS NULL;
