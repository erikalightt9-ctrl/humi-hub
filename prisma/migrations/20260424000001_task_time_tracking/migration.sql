-- Add BLOCKED status to TaskStatus enum
ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'BLOCKED';

-- Extend organization_tasks with time tracking and employee assignment fields
ALTER TABLE "organization_tasks"
  ADD COLUMN IF NOT EXISTS "startedAt"        TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "completedAt"      TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "timeSpentMinutes" INTEGER,
  ADD COLUMN IF NOT EXISTS "assigneeId"       VARCHAR(100);

-- Index for employee task lookup
CREATE INDEX IF NOT EXISTS "organization_tasks_assigneeId_idx"
  ON "organization_tasks"("assigneeId");
