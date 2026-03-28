-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "RevenueType" AS ENUM ('PLATFORM_FEE', 'TENANT_SUBSCRIPTION', 'ENROLLMENT_PAYMENT', 'TRAINER_EARNING', 'REFUND', 'MANUAL');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- CreateTable revenue_records
CREATE TABLE "revenue_records" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT,
    "userType" TEXT,
    "type" "RevenueType" NOT NULL DEFAULT 'MANUAL',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "description" TEXT,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "revenue_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable revenue_audit_logs
CREATE TABLE "revenue_audit_logs" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "revenue_audit_logs_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "revenue_records_tenantId_idx" ON "revenue_records"("tenantId");
CREATE INDEX "revenue_records_userId_userType_idx" ON "revenue_records"("userId", "userType");
CREATE INDEX "revenue_records_createdAt_idx" ON "revenue_records"("createdAt");
CREATE INDEX "revenue_records_status_idx" ON "revenue_records"("status");
CREATE INDEX "revenue_audit_logs_recordId_idx" ON "revenue_audit_logs"("recordId");
CREATE INDEX "revenue_audit_logs_actorId_idx" ON "revenue_audit_logs"("actorId");

-- FK
ALTER TABLE "revenue_audit_logs" ADD CONSTRAINT "revenue_audit_logs_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "revenue_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
