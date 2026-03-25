-- Drop the old global unique constraint on email
ALTER TABLE "corporate_managers" DROP CONSTRAINT IF EXISTS "corporate_managers_email_key";

-- Add department and phone columns
ALTER TABLE "corporate_managers" ADD COLUMN IF NOT EXISTS "department" TEXT;
ALTER TABLE "corporate_managers" ADD COLUMN IF NOT EXISTS "phone" TEXT;

-- Add per-organization unique constraint (email unique within an org only)
ALTER TABLE "corporate_managers" ADD CONSTRAINT "corporate_managers_organizationId_email_key" UNIQUE ("organizationId", "email");
