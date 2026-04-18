CREATE TABLE IF NOT EXISTS "admin_vehicle_logs" (
  "id"             TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "plateNumber"    VARCHAR(50) NOT NULL,
  "vehicleType"    VARCHAR(100) NOT NULL,
  "logType"        VARCHAR(20) NOT NULL,
  "description"    TEXT,
  "amount"         DECIMAL(10,2),
  "performedBy"    VARCHAR(150),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_vehicle_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "admin_vehicle_logs_organizationId_logType_idx"
  ON "admin_vehicle_logs"("organizationId", "logType");

ALTER TABLE "admin_vehicle_logs"
  ADD CONSTRAINT "admin_vehicle_logs_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
