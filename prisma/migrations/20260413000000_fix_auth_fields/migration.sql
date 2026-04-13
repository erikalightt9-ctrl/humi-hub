-- =============================================================================
-- Fix: Add missing / renamed auth fields across all user tables
--
-- Problem: An earlier migration (merge_all_branches) added auth-hardening
-- columns with OLD names (failedLoginAttempts, lockedUntil). The current
-- codebase uses NEW names (failedAttempts, lockUntil). This migration:
--   1. Adds columns with the correct new names (IF NOT EXISTS — safe to re-run)
--   2. Migrates any non-zero data from old → new columns
--   3. Adds other missing fields (isSuperAdmin, resetToken, etc.)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- admins
-- ---------------------------------------------------------------------------
ALTER TABLE "admins"
  ADD COLUMN IF NOT EXISTS "isSuperAdmin"          BOOLEAN      NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "failedAttempts"        INTEGER      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lockUntil"             TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "resetToken"            TEXT,
  ADD COLUMN IF NOT EXISTS "resetTokenExpiresAt"   TIMESTAMP(3);

-- Migrate data from old columns where they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admins' AND column_name = 'failedLoginAttempts'
  ) THEN
    UPDATE "admins" SET "failedAttempts" = "failedLoginAttempts" WHERE "failedLoginAttempts" > 0;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admins' AND column_name = 'lockedUntil'
  ) THEN
    UPDATE "admins" SET "lockUntil" = "lockedUntil" WHERE "lockedUntil" IS NOT NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "admins_resetToken_key" ON "admins"("resetToken");

-- ---------------------------------------------------------------------------
-- students
-- ---------------------------------------------------------------------------
ALTER TABLE "students"
  ADD COLUMN IF NOT EXISTS "failedAttempts"        INTEGER      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lockUntil"             TIMESTAMP(3);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'failedLoginAttempts'
  ) THEN
    UPDATE "students" SET "failedAttempts" = "failedLoginAttempts" WHERE "failedLoginAttempts" > 0;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'lockedUntil'
  ) THEN
    UPDATE "students" SET "lockUntil" = "lockedUntil" WHERE "lockedUntil" IS NOT NULL;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- trainers
-- ---------------------------------------------------------------------------
ALTER TABLE "trainers"
  ADD COLUMN IF NOT EXISTS "failedAttempts"        INTEGER      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lockUntil"             TIMESTAMP(3);

-- ---------------------------------------------------------------------------
-- corporate_managers
-- ---------------------------------------------------------------------------
ALTER TABLE "corporate_managers"
  ADD COLUMN IF NOT EXISTS "failedAttempts"        INTEGER      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lockUntil"             TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "resetToken"            TEXT,
  ADD COLUMN IF NOT EXISTS "resetTokenExpiresAt"   TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "corporate_managers_resetToken_key" ON "corporate_managers"("resetToken");
