-- LEGACY MIGRATION TOMBSTONE
--
-- Version 004 is retained because deployed Supabase projects identify applied
-- migrations by version. The original script directly modified auth.users and
-- auth.identities and reset fixed administrator passwords; replaying it is not
-- safe in any shared or production environment.
--
-- Development identities must be created through supported Auth APIs or an
-- explicitly opt-in local seed. See ../MIGRATIONS.md.

DO $$
BEGIN
  RAISE NOTICE '004 legacy auth repair intentionally skipped';
END;
$$;
