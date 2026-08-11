# Development seeds

Automatic database seeding is disabled. `dev_demo.sql` contains only
non-sensitive logistics examples and refuses to run unless the PostgreSQL
session setting `app.environment` is `development`.

Example with a local PostgreSQL client:

```sh
PGOPTIONS="-c app.environment=development" psql "$LOCAL_DATABASE_URL" \
  -f supabase/seeds/dev_demo.sql
```

Create development users through the local Supabase Auth API. Never seed
`auth.users` or `auth.identities` directly, and never put passwords or API keys
in seed files.

The large fixed-identity datasets formerly stored in migrations 003/004/010
are intentionally not replayable. Their exact historical content remains
available in Git history for audit only, not as an executable operational
artifact.
