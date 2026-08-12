# Edge Function secrets

Store runtime credentials with `supabase secrets set`; never put their values in
SQL migrations, `api_configs`, frontend variables, logs, tests, or this file.

Required for security/contact:

- `ALLOWED_ORIGINS`: comma-separated exact HTTPS origins.
- `RATE_LIMIT_SALT`: random value of at least 32 characters, unique per
  environment. Rotating it resets the effective rate-limit identities.
- `RESEND_API_KEY` and `RESEND_FROM_EMAIL`: email provider credentials.
- `APP_URL`: canonical public application URL.

Supabase provides `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` to deployed Edge Functions. The service-role key
must never be exposed to the browser.

Required for Stripe (server-side only):

- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
- `STRIPE_PRICE_SME_MONTHLY`, `STRIPE_PRICE_SME_YEARLY`,
  `STRIPE_PRICE_ENTERPRISE_MONTHLY`, and
  `STRIPE_PRICE_ENTERPRISE_YEARLY`. All four must be distinct Stripe Price IDs.
- `PAYMENTS_ENABLED`: omit it or set it to `false` until migration 020, all
  functions, portal configuration, test-mode prices and webhook retries have
  been validated. Only the exact string `true` enables payment endpoints.

Never store Stripe secrets or Price IDs in SQL, `api_configs`, CMS rows or
`VITE_*` variables. CMS prices are display content only and are never accepted
as payment authority.

Deployment checklist:

1. Generate and set `RATE_LIMIT_SALT` without printing it into CI logs.
2. Set exact production and preview origins in `ALLOWED_ORIGINS`.
3. Deploy migration `019_security_rate_limits.sql` before the updated
   `submit-contact`, `send-email`, and `security-health` functions.
4. As a super admin, open the health panel and confirm that all aggregate checks
   are green. The panel intentionally exposes no secret values or account data.
5. Apply `020_stripe_lifecycle.sql`, then deploy `stripe-webhook`,
   `create-checkout-session`, and `create-customer-portal-session`.
6. In Stripe test mode, subscribe the webhook to the six events documented in
   `MIGRATIONS.md`, verify monthly/yearly checkout and portal ownership, then
   explicitly set `PAYMENTS_ENABLED=true`. The frontend also requires
   `VITE_PAYMENTS_ENABLED=true`; both switches are fail-closed.

## Operator handoff — external activation still required

Code and migrations for security, logistics, Stripe lifecycle and CI are
deployed. The following remain **operator actions**, not application code:

1. **Resend rotation**: revoke any historical Resend API key that may have
   appeared in old migration history, create a new key, then
   `supabase secrets set RESEND_API_KEY=... RESEND_FROM_EMAIL=...`.
2. **Legacy accounts**: confirm `password_reset_required = true` for demo /
   historical UUIDs in production (`profiles` filter from migration 014). Keep
   them blocked until each user completes a password change.
3. **Rate-limit salt**: set a unique `RATE_LIMIT_SALT` (≥ 32 chars) per
   environment before expecting production quotas to be meaningful.
4. **Stripe live activation**: configure Price IDs and webhook secret, validate
   in test mode, only then set `PAYMENTS_ENABLED=true` and
   `VITE_PAYMENTS_ENABLED=true`.
