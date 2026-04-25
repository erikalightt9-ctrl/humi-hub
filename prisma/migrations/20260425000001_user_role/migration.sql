-- Add UserRole enum and userRole field to corporate_managers
-- ALTER TYPE must run outside a transaction on PG < 12
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EXECUTIVE', 'MANAGER');

ALTER TABLE "corporate_managers"
  ADD COLUMN IF NOT EXISTS "userRole" "UserRole" NOT NULL DEFAULT 'ADMIN';
