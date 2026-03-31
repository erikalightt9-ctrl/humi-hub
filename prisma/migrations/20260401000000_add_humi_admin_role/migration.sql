-- Add HUMI_ADMIN to ActorType enum
ALTER TYPE "ActorType" ADD VALUE IF NOT EXISTS 'HUMI_ADMIN';

-- Add adminRoleLabel to organizations
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "adminRoleLabel" VARCHAR(50);

-- Create humi_admins table
CREATE TABLE IF NOT EXISTS "humi_admins" (
  "id"                    TEXT NOT NULL,
  "email"                 TEXT NOT NULL,
  "passwordHash"          TEXT NOT NULL,
  "name"                  TEXT NOT NULL,
  "isActive"              BOOLEAN NOT NULL DEFAULT true,
  "failedAttempts"        INTEGER NOT NULL DEFAULT 0,
  "mustChangePassword"    BOOLEAN NOT NULL DEFAULT true,
  "resetToken"            TEXT,
  "resetTokenExpiresAt"   TIMESTAMP(3),
  "canReviewTenants"      BOOLEAN NOT NULL DEFAULT false,
  "canOnboardTenants"     BOOLEAN NOT NULL DEFAULT false,
  "canMonitorPlatform"    BOOLEAN NOT NULL DEFAULT false,
  "canProvideSupport"     BOOLEAN NOT NULL DEFAULT false,
  "canManageContent"      BOOLEAN NOT NULL DEFAULT false,
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "humi_admins_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "humi_admins_email_key" ON "humi_admins"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "humi_admins_resetToken_key" ON "humi_admins"("resetToken");
CREATE INDEX IF NOT EXISTS "humi_admins_email_idx" ON "humi_admins"("email");
