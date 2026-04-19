ALTER TABLE "admin_stock_items"
  ADD COLUMN IF NOT EXISTS "createdBy" VARCHAR(30);
