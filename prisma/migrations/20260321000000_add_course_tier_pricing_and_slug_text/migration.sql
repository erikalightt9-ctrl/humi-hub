-- Migration: add_course_tier_pricing_and_slug_text
--
-- 1. Convert courses.slug from CourseSlug enum to free-text (TEXT + UNIQUE)
-- 2. Add missing columns: priceBasic, priceProfessional, priceAdvanced, currency, tenantId

-- Step 1: Add a temporary text column
ALTER TABLE "courses" ADD COLUMN "slug_text" TEXT;

-- Step 2: Copy existing enum values to text
UPDATE "courses" SET "slug_text" = "slug"::TEXT;

-- Step 3: Drop the unique constraint on the enum slug (if it exists)
ALTER TABLE "courses" DROP CONSTRAINT IF EXISTS "courses_slug_key";

-- Step 4: Drop the old enum column
ALTER TABLE "courses" DROP COLUMN "slug";

-- Step 5: Rename the text column to slug
ALTER TABLE "courses" RENAME COLUMN "slug_text" TO "slug";

-- Step 6: Add NOT NULL and UNIQUE constraints
ALTER TABLE "courses" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "courses" ADD CONSTRAINT "courses_slug_key" UNIQUE ("slug");

-- Step 7: Drop the CourseSlug enum type (no longer needed)
DROP TYPE IF EXISTS "CourseSlug";

-- Step 8: Add missing tier pricing columns with defaults
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "priceBasic" DECIMAL(10,2) NOT NULL DEFAULT 1500;
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "priceProfessional" DECIMAL(10,2) NOT NULL DEFAULT 3500;
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "priceAdvanced" DECIMAL(10,2) NOT NULL DEFAULT 5500;
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'PHP';

-- Step 9: Add tenantId column (nullable, no FK yet since organizations table
--         may not exist in all environments; FK will be added in a future migration
--         once organizations table is fully migrated)
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- Step 10: Add index on tenantId for query performance
CREATE INDEX IF NOT EXISTS "courses_tenantId_idx" ON "courses"("tenantId");
