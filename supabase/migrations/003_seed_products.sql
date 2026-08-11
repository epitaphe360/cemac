-- LEGACY MIGRATION TOMBSTONE
--
-- Version 003 may already be present in remote schema_migrations, so the file
-- is retained to keep local/remote migration history aligned. Its former
-- contents created fixed-password demo auth users and marketplace records and
-- must never run as part of a production migration chain.
--
-- Development-only sample data now lives in ../seeds/dev_demo.sql.
-- See ../MIGRATIONS.md before repairing or replaying migration history.

DO $$
BEGIN
  RAISE NOTICE '003 legacy demo migration intentionally skipped';
END;
$$;
