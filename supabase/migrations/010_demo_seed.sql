-- LEGACY MIGRATION TOMBSTONE
--
-- Version 010 is intentionally preserved so an already-linked Supabase
-- project does not report a missing migration version. The former migration
-- disabled triggers, inserted fixed-password auth users, and embedded an API
-- credential. Those operations are not schema migrations and are unsafe to
-- replay.
--
-- No live rows are deleted here. Migration 014 removes credential material
-- from api_configs and marks known legacy accounts for password rotation.
-- Opt-in local examples live in ../seeds/dev_demo.sql.

DO $$
BEGIN
  RAISE NOTICE '010 legacy demo migration intentionally skipped';
END;
$$;
