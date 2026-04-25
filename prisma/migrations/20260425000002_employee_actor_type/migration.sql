-- Add EMPLOYEE value to ActorType enum
-- Must run outside a transaction on PG < 12
ALTER TYPE "ActorType" ADD VALUE IF NOT EXISTS 'EMPLOYEE';
