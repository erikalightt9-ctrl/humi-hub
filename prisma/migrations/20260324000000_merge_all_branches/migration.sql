-- Migration: Merge all branches into main
-- Adds fields from: condescending-ptolemy (trainer tiers), vigilant-montalcini (waitlist),
-- busy-kirch (attendance, auth hardening), confident-mcnulty (messaging), busy-noether (placement tracking)

-- ============================================================
-- Enums
-- ============================================================

-- TrainerTier enum
DO $$ BEGIN
  CREATE TYPE "TrainerTier" AS ENUM ('BASIC', 'PROFESSIONAL', 'PREMIUM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- WaitlistStatus enum
DO $$ BEGIN
  CREATE TYPE "WaitlistStatus" AS ENUM ('WAITING', 'PROMOTED', 'EXPIRED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add CONTACT_MESSAGE to NotificationType if not exists
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CONTACT_MESSAGE';

-- Add ASSIGNMENT_SUBMITTED, ASSIGNMENT_GRADED, ASSIGNMENT_DUE_SOON to NotificationType if not exists
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ASSIGNMENT_SUBMITTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ASSIGNMENT_GRADED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ASSIGNMENT_DUE_SOON';

-- ============================================================
-- Enrollment table: add trainer tier fields
-- ============================================================

ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "trainerTier" "TrainerTier";
ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "trainerUpgradeFee" DECIMAL(10,2);

-- ============================================================
-- Trainer table: add tier field
-- ============================================================

ALTER TABLE "trainers" ADD COLUMN IF NOT EXISTS "tier" "TrainerTier" NOT NULL DEFAULT 'BASIC';
ALTER TABLE "trainers" ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT true;

-- ============================================================
-- Student table: add auth hardening fields
-- ============================================================

ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "tempPasswordHash" TEXT;

-- ============================================================
-- Admin table: add auth fields
-- ============================================================

ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);

-- ============================================================
-- Waitlist table
-- ============================================================

CREATE TABLE IF NOT EXISTS "waitlists" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "scheduleId" TEXT NOT NULL,
  "status" "WaitlistStatus" NOT NULL DEFAULT 'WAITING',
  "position" INTEGER NOT NULL,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "promotedAt" TIMESTAMP(3),
  CONSTRAINT "waitlists_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "waitlists_scheduleId_status_idx" ON "waitlists"("scheduleId", "status");
CREATE INDEX IF NOT EXISTS "waitlists_studentId_idx" ON "waitlists"("studentId");

-- ============================================================
-- SessionAttendance table
-- ============================================================

CREATE TABLE IF NOT EXISTS "session_attendances" (
  "id" TEXT NOT NULL,
  "scheduleId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "clockIn" TIMESTAMP(3),
  "clockOut" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'ABSENT',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "session_attendances_pkey" PRIMARY KEY ("id")
);

-- Guard: ensure all columns exist on session_attendances (handles partial prior runs)
ALTER TABLE "session_attendances" ADD COLUMN IF NOT EXISTS "date"      DATE         NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE "session_attendances" ADD COLUMN IF NOT EXISTS "clockIn"   TIMESTAMP(3);
ALTER TABLE "session_attendances" ADD COLUMN IF NOT EXISTS "clockOut"  TIMESTAMP(3);
ALTER TABLE "session_attendances" ADD COLUMN IF NOT EXISTS "status"    TEXT         NOT NULL DEFAULT 'ABSENT';
ALTER TABLE "session_attendances" ADD COLUMN IF NOT EXISTS "notes"     TEXT;
ALTER TABLE "session_attendances" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "session_attendances" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS "session_attendances_scheduleId_studentId_date_key" ON "session_attendances"("scheduleId", "studentId", "date");
CREATE INDEX IF NOT EXISTS "session_attendances_scheduleId_date_idx" ON "session_attendances"("scheduleId", "date");

-- ============================================================
-- TrainerTierConfig table
-- ============================================================

CREATE TABLE IF NOT EXISTS "trainer_tier_configs" (
  "tier" "TrainerTier" NOT NULL,
  "label" TEXT NOT NULL,
  "maxCapacity" INTEGER NOT NULL DEFAULT 30,
  "upgradeFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "description" TEXT,
  "features" TEXT[],
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "trainer_tier_configs_pkey" PRIMARY KEY ("tier")
);

-- ============================================================
-- Indexes for trainer tier
-- ============================================================

CREATE INDEX IF NOT EXISTS "trainers_tier_idx" ON "trainers"("tier");
CREATE INDEX IF NOT EXISTS "enrollments_trainerTier_idx" ON "enrollments"("trainerTier");
