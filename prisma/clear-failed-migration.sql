-- Clears ALL failed (unfinished, not rolled-back) migration records so
-- prisma migrate deploy can re-attempt them cleanly.
-- Safe to run multiple times: only targets unfinished rows.
DELETE FROM "_prisma_migrations"
WHERE finished_at IS NULL
  AND rolled_back_at IS NULL;

