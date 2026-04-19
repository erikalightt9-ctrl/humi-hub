-- Clears the failed migration record so prisma migrate deploy can re-apply it cleanly.
-- Safe to run multiple times: only deletes unfinished (failed) records.
DELETE FROM "_prisma_migrations"
WHERE migration_name = '20260419000002_inventory_item_category_optional'
  AND finished_at IS NULL;
