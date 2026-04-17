CREATE TABLE IF NOT EXISTS "admin_stock_items" (
  "id"             VARCHAR(30)    NOT NULL,
  "organizationId" VARCHAR(30)    NOT NULL,
  "name"           VARCHAR(200)   NOT NULL,
  "category"       VARCHAR(100)   NOT NULL,
  "quantity"       DECIMAL(10,2)  NOT NULL DEFAULT 0,
  "unit"           VARCHAR(50)    NOT NULL DEFAULT 'pcs',
  "minThreshold"   DECIMAL(10,2)  NOT NULL DEFAULT 0,
  "location"       VARCHAR(200),
  "supplier"       VARCHAR(200),
  "notes"          TEXT,
  "createdAt"      TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "admin_stock_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "admin_stock_items_organizationId_category_idx"
  ON "admin_stock_items"("organizationId", "category");

ALTER TABLE "admin_stock_items"
  DROP CONSTRAINT IF EXISTS "admin_stock_items_organizationId_fkey";

ALTER TABLE "admin_stock_items"
  ADD CONSTRAINT "admin_stock_items_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
