-- Tenant User Management — system users with role-based module access
CREATE TABLE IF NOT EXISTS "tenant_users" (
  "id"                 TEXT         NOT NULL,
  "organizationId"     TEXT         NOT NULL,
  "name"               VARCHAR(200) NOT NULL,
  "email"              VARCHAR(200) NOT NULL,
  "passwordHash"       TEXT,
  "mustChangePassword" BOOLEAN      NOT NULL DEFAULT true,
  "roleLabel"          VARCHAR(100) NOT NULL DEFAULT 'User',
  "permissions"        TEXT[]       NOT NULL DEFAULT '{}',
  "isActive"           BOOLEAN      NOT NULL DEFAULT true,
  "failedAttempts"     INTEGER      NOT NULL DEFAULT 0,
  "lockedUntil"        TIMESTAMP(3),
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tenant_users_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "tenant_users_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE,
  CONSTRAINT "tenant_users_org_email_unique"
    UNIQUE ("organizationId", "email")
);
CREATE INDEX IF NOT EXISTS "tenant_users_organizationId_idx" ON "tenant_users"("organizationId");
