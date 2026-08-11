-- Explicitly opt-in, non-sensitive development examples.
--
-- This seed deliberately does not write auth.users/auth.identities and does
-- not contain credentials. Create local users through the Supabase Auth API.
-- Set the PostgreSQL session setting app.environment=development before use.

DO $$
BEGIN
  IF current_setting('app.environment', true) IS DISTINCT FROM 'development' THEN
    RAISE EXCEPTION
      'Refusing development seed: set app.environment=development for this session';
  END IF;
END;
$$;

INSERT INTO public.corridors (id, route, mode, days, status)
VALUES
  (
    'd0000000-0000-4000-8000-000000000001',
    'Local demo: Douala → Bangui',
    'Route',
    '5-7j',
    'Opérationnel'
  ),
  (
    'd0000000-0000-4000-8000-000000000002',
    'Local demo: Malabo → Douala',
    'Maritime',
    '1-2j',
    'Ralenti'
  )
ON CONFLICT (id) DO UPDATE SET
  route = EXCLUDED.route,
  mode = EXCLUDED.mode,
  days = EXCLUDED.days,
  status = EXCLUDED.status;

INSERT INTO public.logistics_alerts (id, country, message, type, is_active)
VALUES (
  'd0000000-0000-4000-8000-000000000003',
  'DEV',
  'Alerte de démonstration locale — ne pas utiliser en production.',
  'info',
  true
)
ON CONFLICT (id) DO UPDATE SET
  country = EXCLUDED.country,
  message = EXCLUDED.message,
  type = EXCLUDED.type,
  is_active = EXCLUDED.is_active;
