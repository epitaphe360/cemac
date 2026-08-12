-- CEMAC INTEGRA - forward-only rate limiting and notification hardening.
-- Migrations 001-018 are already deployed and must remain immutable.

BEGIN;

-- Rate-limit state is backend infrastructure. It is intentionally absent from
-- PostgREST for anon/authenticated callers and only mutated through one RPC.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE TABLE private.rate_limit_counters (
  scope text NOT NULL,
  identifier_hash text NOT NULL,
  window_started_at timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 1 CHECK (request_count > 0),
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (scope, identifier_hash)
);

ALTER TABLE private.rate_limit_counters ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.rate_limit_counters FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_scope text,
  p_identifier_hash text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_time timestamptz := clock_timestamp();
  counter private.rate_limit_counters%ROWTYPE;
  allowed boolean;
  retry_after integer;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'service_role required' USING ERRCODE = '42501';
  END IF;
  IF p_scope !~ '^[a-z0-9:_-]{1,80}$'
     OR p_identifier_hash !~ '^[a-f0-9]{64}$'
     OR p_limit NOT BETWEEN 1 AND 10000
     OR p_window_seconds NOT BETWEEN 1 AND 604800 THEN
    RAISE EXCEPTION 'invalid rate limit parameters' USING ERRCODE = '22023';
  END IF;

  INSERT INTO private.rate_limit_counters AS counters (
    scope, identifier_hash, window_started_at, request_count, expires_at
  )
  VALUES (
    p_scope, p_identifier_hash, current_time, 1,
    current_time + make_interval(secs => p_window_seconds)
  )
  ON CONFLICT (scope, identifier_hash) DO UPDATE
  SET window_started_at = CASE
        WHEN counters.expires_at <= current_time THEN current_time
        ELSE counters.window_started_at
      END,
      request_count = CASE
        WHEN counters.expires_at <= current_time THEN 1
        ELSE counters.request_count + 1
      END,
      expires_at = CASE
        WHEN counters.expires_at <= current_time
          THEN current_time + make_interval(secs => p_window_seconds)
        ELSE counters.expires_at
      END
  RETURNING * INTO counter;

  allowed := counter.request_count <= p_limit;
  retry_after := CASE WHEN allowed THEN 0
    ELSE GREATEST(1, ceil(extract(epoch FROM counter.expires_at - current_time))::integer)
  END;

  RETURN jsonb_build_object(
    'allowed', allowed,
    'remaining', GREATEST(0, p_limit - counter.request_count),
    'retry_after', retry_after
  );
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(text, text, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, text, integer, integer)
  TO service_role;

-- Preferences have a closed schema. Security alerts are mandatory and cannot
-- be disabled, including through a crafted browser request.
UPDATE public.profiles
SET notification_preferences = jsonb_build_object(
  'cert_status_change', COALESCE(
    CASE WHEN jsonb_typeof(notification_preferences -> 'cert_status_change') = 'boolean'
      THEN (notification_preferences ->> 'cert_status_change')::boolean END, true),
  'new_document', COALESCE(
    CASE WHEN jsonb_typeof(notification_preferences -> 'new_document') = 'boolean'
      THEN (notification_preferences ->> 'new_document')::boolean END, true),
  'marketplace_inquiry', COALESCE(
    CASE WHEN jsonb_typeof(notification_preferences -> 'marketplace_inquiry') = 'boolean'
      THEN (notification_preferences ->> 'marketplace_inquiry')::boolean END, true),
  'price_alert', COALESCE(
    CASE WHEN jsonb_typeof(notification_preferences -> 'price_alert') = 'boolean'
      THEN (notification_preferences ->> 'price_alert')::boolean END, false),
  'newsletter', COALESCE(
    CASE WHEN jsonb_typeof(notification_preferences -> 'newsletter') = 'boolean'
      THEN (notification_preferences ->> 'newsletter')::boolean END, false),
  'security_alert', true
);

ALTER TABLE public.profiles
  ALTER COLUMN notification_preferences SET DEFAULT
    '{"cert_status_change":true,"new_document":true,"marketplace_inquiry":true,"price_alert":false,"newsletter":false,"security_alert":true}'::jsonb,
  ALTER COLUMN notification_preferences SET NOT NULL;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_notification_preferences_valid;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_notification_preferences_valid CHECK (
    jsonb_typeof(notification_preferences) = 'object'
    AND notification_preferences ?& ARRAY[
      'cert_status_change', 'new_document', 'marketplace_inquiry',
      'price_alert', 'newsletter', 'security_alert'
    ]
    AND (
      notification_preferences - ARRAY[
        'cert_status_change', 'new_document', 'marketplace_inquiry',
        'price_alert', 'newsletter', 'security_alert'
      ]
    ) = '{}'::jsonb
    AND jsonb_typeof(notification_preferences -> 'cert_status_change') = 'boolean'
    AND jsonb_typeof(notification_preferences -> 'new_document') = 'boolean'
    AND jsonb_typeof(notification_preferences -> 'marketplace_inquiry') = 'boolean'
    AND jsonb_typeof(notification_preferences -> 'price_alert') = 'boolean'
    AND jsonb_typeof(notification_preferences -> 'newsletter') = 'boolean'
    AND jsonb_typeof(notification_preferences -> 'security_alert') = 'boolean'
    AND (notification_preferences ->> 'security_alert')::boolean
  );

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND jsonb_typeof(notification_preferences) = 'object'
    AND octet_length(notification_preferences::text) <= 1000
    AND (notification_preferences ->> 'security_alert')::boolean
  );

CREATE OR REPLACE FUNCTION public.user_notification_enabled(
  p_user_id uuid,
  p_preference text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
  result boolean;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'service_role required' USING ERRCODE = '42501';
  END IF;
  IF p_preference NOT IN (
    'cert_status_change', 'new_document', 'marketplace_inquiry',
    'price_alert', 'newsletter', 'security_alert'
  ) THEN
    RAISE EXCEPTION 'invalid notification preference' USING ERRCODE = '22023';
  END IF;
  IF p_preference = 'security_alert' THEN
    RETURN true;
  END IF;

  SELECT COALESCE(
    (p.notification_preferences ->> p_preference)::boolean,
    CASE WHEN p_preference IN (
      'cert_status_change', 'new_document', 'marketplace_inquiry'
    ) THEN true ELSE false END
  )
  INTO result
  FROM public.profiles AS p
  WHERE p.id = p_user_id;
  RETURN COALESCE(result, false);
END;
$$;

REVOKE ALL ON FUNCTION public.user_notification_enabled(uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_notification_enabled(uuid, text)
  TO service_role;

-- Public contact submission now goes exclusively through submit-contact.
DROP POLICY IF EXISTS "contacts_insert_public" ON public.contact_requests;
REVOKE INSERT ON public.contact_requests FROM anon, authenticated;

-- This health RPC returns only aggregate counters. It never returns account
-- identifiers, emails, environment values, hashes, or stored rate-limit rows.
CREATE OR REPLACE FUNCTION public.admin_security_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
  legacy_total bigint;
  legacy_unflagged bigint;
  invalid_preferences bigint;
BEGIN
  IF public.get_my_role() IS DISTINCT FROM 'super_admin' THEN
    RAISE EXCEPTION 'super_admin required' USING ERRCODE = '42501';
  END IF;

  SELECT count(*), count(*) FILTER (WHERE NOT p.password_reset_required)
  INTO legacy_total, legacy_unflagged
  FROM public.profiles AS p
  WHERE p.id::text LIKE '11111111-0000-0000-0000-%'
     OR p.id::text LIKE 'ad00000_-0000-0000-0000-00000000000_'
     OR p.id::text LIKE '0000000_-0000-0000-0000-00000000000_';

  SELECT count(*) INTO invalid_preferences
  FROM public.profiles AS p
  WHERE jsonb_typeof(p.notification_preferences) IS DISTINCT FROM 'object'
     OR COALESCE((p.notification_preferences ->> 'security_alert')::boolean, false) = false;

  RETURN jsonb_build_object(
    'legacy_accounts_total', legacy_total,
    'legacy_accounts_unflagged', legacy_unflagged,
    'invalid_notification_preferences', invalid_preferences,
    'contact_direct_insert_revoked', true,
    'rate_limit_rpc_ready', true
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_security_health()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_security_health()
  TO authenticated, service_role;

COMMENT ON TABLE private.rate_limit_counters IS
  'Private, service-role-only fixed-window counters; identifiers are salted hashes.';

COMMIT;
