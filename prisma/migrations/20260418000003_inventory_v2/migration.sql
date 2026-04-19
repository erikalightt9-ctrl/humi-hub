-- =========================================================
-- Inventory v2 — Category → Item → StockMovement ledger
-- =========================================================

CREATE TABLE IF NOT EXISTS "inventory_categories" (
  "id"             VARCHAR(30)  NOT NULL,
  "organizationId" VARCHAR(30)  NOT NULL,
  "name"           VARCHAR(150) NOT NULL,
  "description"    TEXT,
  "icon"           VARCHAR(10),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inventory_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "inventory_categories_org_name_key"
  ON "inventory_categories"("organizationId", "name");

ALTER TABLE "inventory_categories"
  DROP CONSTRAINT IF EXISTS "inventory_categories_org_fkey";
ALTER TABLE "inventory_categories"
  ADD CONSTRAINT "inventory_categories_org_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "inventory_items" (
  "id"             VARCHAR(30)    NOT NULL,
  "organizationId" VARCHAR(30)    NOT NULL,
  "categoryId"     VARCHAR(30)    NOT NULL,
  "name"           VARCHAR(200)   NOT NULL,
  "sku"            VARCHAR(100),
  "unit"           VARCHAR(50)    NOT NULL DEFAULT 'pcs',
  "description"    TEXT,
  "minThreshold"   DECIMAL(10,2)  NOT NULL DEFAULT 0,
  "totalStock"     DECIMAL(10,2)  NOT NULL DEFAULT 0,
  "location"       VARCHAR(200),
  "createdBy"      VARCHAR(30),
  "createdAt"      TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "inventory_items_org_sku_key"
  ON "inventory_items"("organizationId", "sku");
CREATE INDEX IF NOT EXISTS "inventory_items_org_category_idx"
  ON "inventory_items"("organizationId", "categoryId");

ALTER TABLE "inventory_items"
  DROP CONSTRAINT IF EXISTS "inventory_items_org_fkey";
ALTER TABLE "inventory_items"
  ADD CONSTRAINT "inventory_items_org_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "inventory_items"
  DROP CONSTRAINT IF EXISTS "inventory_items_cat_fkey";
ALTER TABLE "inventory_items"
  ADD CONSTRAINT "inventory_items_cat_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "inventory_categories"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "stock_movements" (
  "id"             VARCHAR(30)   NOT NULL,
  "organizationId" VARCHAR(30)   NOT NULL,
  "itemId"         VARCHAR(30)   NOT NULL,
  "type"           VARCHAR(20)   NOT NULL,
  "quantity"       DECIMAL(10,2) NOT NULL,
  "unitCost"       DECIMAL(12,2),
  "supplier"       VARCHAR(200),
  "note"           TEXT,
  "userId"         VARCHAR(30),
  "createdAt"      TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "stock_movements_org_item_idx"
  ON "stock_movements"("organizationId", "itemId");
CREATE INDEX IF NOT EXISTS "stock_movements_org_created_idx"
  ON "stock_movements"("organizationId", "createdAt");

ALTER TABLE "stock_movements"
  DROP CONSTRAINT IF EXISTS "stock_movements_org_fkey";
ALTER TABLE "stock_movements"
  ADD CONSTRAINT "stock_movements_org_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "stock_movements"
  DROP CONSTRAINT IF EXISTS "stock_movements_item_fkey";
ALTER TABLE "stock_movements"
  ADD CONSTRAINT "stock_movements_item_fkey"
  FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "inventory_audit_logs" (
  "id"             VARCHAR(30)  NOT NULL,
  "organizationId" VARCHAR(30)  NOT NULL,
  "actorId"        VARCHAR(30),
  "action"         VARCHAR(50)  NOT NULL,
  "targetType"     VARCHAR(30)  NOT NULL,
  "targetId"       VARCHAR(30),
  "payload"        JSONB,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inventory_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "inventory_audit_logs_org_created_idx"
  ON "inventory_audit_logs"("organizationId", "createdAt");

ALTER TABLE "inventory_audit_logs"
  DROP CONSTRAINT IF EXISTS "inventory_audit_logs_org_fkey";
ALTER TABLE "inventory_audit_logs"
  ADD CONSTRAINT "inventory_audit_logs_org_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- =========================================================
-- Data migration: AdminStockItem → InventoryCategory + InventoryItem + initial IN StockMovement
-- =========================================================

-- 1. Seed categories for each tenant that has existing stock items
INSERT INTO "inventory_categories" ("id", "organizationId", "name", "icon", "createdAt", "updatedAt")
SELECT
  substr(md5(random()::text || clock_timestamp()::text), 1, 24),
  si."organizationId",
  si."category",
  CASE si."category"
    WHEN 'Cleaning Supplies'    THEN '🧹'
    WHEN 'Pantry Supplies'      THEN '🍱'
    WHEN 'Maintenance Supplies' THEN '🔧'
    WHEN 'Assets'               THEN '📦'
    WHEN 'Stockroom Stocks'     THEN '🏪'
    ELSE '📋'
  END,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "organizationId", "category" FROM "admin_stock_items") AS si
ON CONFLICT ("organizationId", "name") DO NOTHING;

-- 2. Copy admin_stock_items → inventory_items
INSERT INTO "inventory_items" (
  "id", "organizationId", "categoryId", "name", "unit", "minThreshold",
  "totalStock", "location", "createdBy", "createdAt", "updatedAt"
)
SELECT
  asi."id",
  asi."organizationId",
  ic."id",
  asi."name",
  asi."unit",
  asi."minThreshold",
  asi."quantity",
  asi."location",
  asi."createdBy",
  asi."createdAt",
  asi."updatedAt"
FROM "admin_stock_items" asi
JOIN "inventory_categories" ic
  ON ic."organizationId" = asi."organizationId"
 AND ic."name" = asi."category"
ON CONFLICT DO NOTHING;

-- 3. Seed initial StockMovement IN per migrated item (if quantity > 0)
INSERT INTO "stock_movements" (
  "id", "organizationId", "itemId", "type", "quantity", "note", "userId", "createdAt"
)
SELECT
  substr(md5(random()::text || clock_timestamp()::text || asi."id"), 1, 24),
  asi."organizationId",
  asi."id",
  'IN',
  asi."quantity",
  'Initial stock (migrated from legacy)',
  asi."createdBy",
  asi."createdAt"
FROM "admin_stock_items" asi
WHERE asi."quantity" > 0
  AND EXISTS (SELECT 1 FROM "inventory_items" ii WHERE ii."id" = asi."id");
