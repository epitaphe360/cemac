# Supabase migration and operations policy

## Legacy versions 003, 004, and 010

These version files are retained as no-op tombstones. They may already be
recorded in a linked project's `supabase_migrations.schema_migrations` table,
and deleting or renumbering them would make migration history ambiguous.
Supabase migration history is version-based; an applied version is not replayed
by `db push` merely because its local file was converted to a tombstone.

The old statements were intentionally removed from the active migration chain:

- 003 created fixed-password users and demo marketplace data.
- 004 directly rewrote `auth.users`, `auth.identities`, and admin passwords.
- 010 disabled triggers, created more fixed-password users, and contained a
  real Resend credential.

Do not mark these versions reverted and do not run their historical contents.
Existing live rows are left intact. Migration 014 removes secret-shaped
`api_configs` values and flags known legacy accounts with
`password_reset_required = true`.

Before deploying, compare local and remote history with `supabase migration
list`. If a target project has a different history, stop and reconcile it
explicitly; never delete rows from migration history to force a match.

## Forward-only remediation

- `014_security_hardening.sql` secures role assignment, function
  `search_path`, sensitive updates, RLS, storage, notifications, contact
  intake, and API configuration.
- `015_stripe_idempotency.sql` adds a minimal event ledger and an atomic,
  service-role-only Stripe event processor.

Both migrations preserve existing business records. Known demo accounts are
not deleted because they may own referenced live data.

## Secrets and deployment

`api_configs` is metadata only and is not a credential store. Set runtime
credentials with Supabase Edge Function secrets:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL` (a verified sender)
- `APP_URL`
- `ALLOWED_ORIGINS` (comma-separated exact HTTPS origins)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_SME`
- `STRIPE_PRICE_ENTERPRISE`

Payments are fail-closed. Checkout and webhook processing remain disabled
unless `PAYMENTS_ENABLED=true` is set as an Edge Function secret. Configure and
test Stripe in test mode before enabling it.

The leaked Resend key must also be revoked/rotated in Resend. Removing it from
the repository and database cannot invalidate a credential that has already
been exposed.

## Password reset flag

`password_reset_required` is protected from browser updates. Migration 014
installs an `auth.users` trigger that clears the flag only after GoTrue changes
the stored password hash successfully. While the flag is set, protected routes
send the user to the password form, `get_my_role()` returns no effective
privileged role, and the email/checkout functions reject the account.
