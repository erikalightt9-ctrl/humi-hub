-- Employee portal auth fields on hr_employees
ALTER TABLE "hr_employees"
  ADD COLUMN IF NOT EXISTS "passwordHash"       TEXT,
  ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "failedAttempts"     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "isPortalEnabled"    BOOLEAN NOT NULL DEFAULT false;

-- Geofencing config on organizations
ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "officeAddress"         TEXT,
  ADD COLUMN IF NOT EXISTS "officeLatitude"        DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "officeLongitude"       DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "geofenceRadiusMeters"  INTEGER NOT NULL DEFAULT 100;

-- GPS + photo fields on hr_attendance_logs
ALTER TABLE "hr_attendance_logs"
  ADD COLUMN IF NOT EXISTS "clockInLatitude"   DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "clockInLongitude"  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "clockInPhotoUrl"   TEXT,
  ADD COLUMN IF NOT EXISTS "clockOutLatitude"  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "clockOutLongitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "clockOutPhotoUrl"  TEXT;
