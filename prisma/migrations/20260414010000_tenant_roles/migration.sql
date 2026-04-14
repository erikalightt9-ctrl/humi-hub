-- Tenant Role & Permission Management
CREATE TABLE IF NOT EXISTS "tenant_roles" (
  "id"             TEXT         NOT NULL,
  "organizationId" TEXT         NOT NULL,
  "name"           VARCHAR(100) NOT NULL,
  "description"    VARCHAR(255),
  "permissions"    JSONB        NOT NULL DEFAULT '{}',
  "isSystem"       BOOLEAN      NOT NULL DEFAULT false,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tenant_roles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "tenant_roles_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE,
  CONSTRAINT "tenant_roles_org_name_unique"
    UNIQUE ("organizationId", "name")
);
CREATE INDEX IF NOT EXISTS "tenant_roles_organizationId_idx" ON "tenant_roles"("organizationId");

-- Add roleId foreign key to tenant_users
ALTER TABLE "tenant_users"
  ADD COLUMN IF NOT EXISTS "roleId" TEXT;

ALTER TABLE "tenant_users"
  ADD CONSTRAINT "tenant_users_roleId_fkey"
    FOREIGN KEY ("roleId") REFERENCES "tenant_roles"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "tenant_users_roleId_idx" ON "tenant_users"("roleId");
