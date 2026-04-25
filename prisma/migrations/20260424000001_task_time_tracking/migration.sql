-- Add BLOCKED to TaskStatus enum (must run outside transaction on PG < 12)
-- Using IF NOT EXISTS so re-runs are safe
ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'BLOCKED';
