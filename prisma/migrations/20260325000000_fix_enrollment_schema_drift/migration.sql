-- Migration: fix_enrollment_schema_drift
-- Adds missing enums and columns required for enrollment submission to succeed.
-- Fixes schema drift between the Prisma model definitions and the actual DB tables.

-- ============================================================
-- 1. Create missing enums
-- ============================================================

DO $$ BEGIN
  CREATE TYPE "CourseTier" AS ENUM ('BASIC', 'PROFESSIONAL', 'ADVANCED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'FAILED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "StudentPaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. Extend EnrollmentStatus enum with missing values
-- ============================================================

ALTER TYPE "EnrollmentStatus" ADD VALUE IF NOT EXISTS 'PAYMENT_SUBMITTED';
ALTER TYPE "EnrollmentStatus" ADD VALUE IF NOT EXISTS 'PAYMENT_VERIFIED';
ALTER TYPE "EnrollmentStatus" ADD VALUE IF NOT EXISTS 'EMAIL_VERIFIED';
ALTER TYPE "EnrollmentStatus" ADD VALUE IF NOT EXISTS 'ENROLLED';

-- ============================================================
-- 3. enrollments table: add all missing columns
-- ============================================================

-- Payment status (required for the model to work)
ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING_PAYMENT';

-- Course tier selection
ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "courseTier" "CourseTier" NOT NULL DEFAULT 'BASIC';

-- Trainer association
ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "trainerId" TEXT;

-- Pricing fields
ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "baseProgramPrice" DECIMAL(10,2);

-- Schedule association
ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "scheduleId" TEXT;

-- Email verification fields
ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "emailVerificationToken" TEXT;
ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "emailTokenExpiresAt" TIMESTAMP(3);

-- Activation token fields
ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "activationToken" TEXT;
ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "activationTokenExpiresAt" TIMESTAMP(3);

-- Reference code for payment tracking
ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "referenceCode" TEXT;

-- Organization / tenant association
ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- ============================================================
-- 4. Remove unique constraint on enrollments.email
--    (multiple enrollments per email should be allowed)
-- ============================================================

ALTER TABLE "enrollments" DROP CONSTRAINT IF EXISTS "enrollments_email_key";

-- ============================================================
-- 5. Add indexes for new enrollment columns
-- ============================================================

CREATE INDEX IF NOT EXISTS "enrollments_paymentStatus_idx"  ON "enrollments"("paymentStatus");
CREATE INDEX IF NOT EXISTS "enrollments_trainerId_idx"      ON "enrollments"("trainerId");
CREATE INDEX IF NOT EXISTS "enrollments_scheduleId_idx"     ON "enrollments"("scheduleId");
CREATE INDEX IF NOT EXISTS "enrollments_referenceCode_idx"  ON "enrollments"("referenceCode");
CREATE INDEX IF NOT EXISTS "enrollments_organizationId_idx" ON "enrollments"("organizationId");
CREATE INDEX IF NOT EXISTS "enrollments_email_idx"          ON "enrollments"("email");

-- Partial unique indexes for nullable token columns
CREATE UNIQUE INDEX IF NOT EXISTS "enrollments_emailVerificationToken_key"
  ON "enrollments"("emailVerificationToken")
  WHERE "emailVerificationToken" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "enrollments_activationToken_key"
  ON "enrollments"("activationToken")
  WHERE "activationToken" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "enrollments_referenceCode_key"
  ON "enrollments"("referenceCode")
  WHERE "referenceCode" IS NOT NULL;

-- ============================================================
-- 6. Fix trainer_tier_configs: add missing columns from schema
-- ============================================================

ALTER TABLE "trainer_tier_configs" ADD COLUMN IF NOT EXISTS "baseProgramPrice" DECIMAL(10,2) NOT NULL DEFAULT 1500;
ALTER TABLE "trainer_tier_configs" ADD COLUMN IF NOT EXISTS "benefits"         TEXT[]        NOT NULL DEFAULT '{}';
ALTER TABLE "trainer_tier_configs" ADD COLUMN IF NOT EXISTS "revenueSharePct"  INTEGER       NOT NULL DEFAULT 70;

-- ============================================================
-- 7. Fix waitlists table: add enrollmentId column
--    (schema uses enrollmentId; migration 20260324 used studentId)
-- ============================================================

ALTER TABLE "waitlists" ADD COLUMN IF NOT EXISTS "enrollmentId" TEXT;

-- Make studentId nullable (schema no longer requires it)
ALTER TABLE "waitlists" ALTER COLUMN "studentId" DROP NOT NULL;

-- Drop old studentId index if it exists
DROP INDEX IF EXISTS "waitlists_studentId_idx";

-- Create indexes for new column
CREATE INDEX IF NOT EXISTS "waitlists_enrollmentId_idx" ON "waitlists"("enrollmentId");
CREATE UNIQUE INDEX IF NOT EXISTS "waitlists_scheduleId_enrollmentId_key"
  ON "waitlists"("scheduleId", "enrollmentId")
  WHERE "enrollmentId" IS NOT NULL;

-- ============================================================
-- 8. payments table: add paymentStatus if missing
-- ============================================================

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING_PAYMENT';
