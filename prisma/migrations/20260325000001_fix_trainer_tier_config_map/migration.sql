-- Migration: fix_trainer_tier_config_map
-- The Prisma model previously had @@map("trainer_tier_config") but the table was
-- already named "trainer_tier_configs" (with 's') by migration 20260324000000.
-- This migration registers the correction: no SQL changes needed, the table already
-- exists with the correct name. Schema map is updated in schema.prisma only.

-- No-op: table "trainer_tier_configs" already exists with the correct name.
SELECT 1;
