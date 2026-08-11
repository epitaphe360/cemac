-- CEMAC INTEGRA - typed CMS, public statistics and platform fixes.
-- Forward-only: migrations 001-015 are already deployed.

BEGIN;

-- ---------------------------------------------------------------------------
-- Shared CMS authorization
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.can_manage_cms(resource_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN public.get_my_role() = 'super_admin' THEN true
    WHEN public.get_my_role() = 'cemac_officer' THEN resource_name = ANY (ARRAY[
      'content_blocks', 'team_members', 'partners', 'milestones',
      'marketing_stats', 'contact_offices', 'contact_reasons',
      'commodity_baselines', 'assistant_knowledge', 'product_categories'
    ])
    ELSE false
  END;
$$;

REVOKE ALL ON FUNCTION public.can_manage_cms(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_cms(text) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Typed mutable content
-- Localized fields are JSON objects keyed by an ISO language code (fr/en).
-- ---------------------------------------------------------------------------

CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_key_format CHECK (key ~ '^[a-z0-9][a-z0-9._-]*$'),
  CONSTRAINT site_settings_value_size CHECK (octet_length(value::text) <= 100000)
);

CREATE TABLE public.content_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page text NOT NULL,
  section text NOT NULL,
  key text NOT NULL,
  locale text NOT NULL DEFAULT 'fr' CHECK (locale IN ('fr', 'en')),
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  media_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (page, section, key, locale),
  CONSTRAINT content_blocks_identifier_format CHECK (
    page ~ '^[a-z0-9][a-z0-9_-]*$'
    AND section ~ '^[a-z0-9][a-z0-9_-]*$'
    AND key ~ '^[a-z0-9][a-z0-9_-]*$'
  ),
  CONSTRAINT content_blocks_content_size CHECK (octet_length(content::text) <= 250000)
);

CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  full_name text NOT NULL,
  role jsonb NOT NULL,
  country_code text CHECK (country_code IS NULL OR country_code IN ('CM', 'GA', 'CG', 'TD', 'CF', 'GQ')),
  country_label jsonb NOT NULL DEFAULT '{}'::jsonb,
  initials text,
  photo_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description jsonb NOT NULL DEFAULT '{}'::jsonb,
  logo_url text,
  website_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  year integer NOT NULL CHECK (year BETWEEN 1900 AND 2200),
  title jsonb NOT NULL DEFAULT '{}'::jsonb,
  description jsonb NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.marketing_stats (
  key text PRIMARY KEY,
  label jsonb NOT NULL,
  display_value jsonb NOT NULL,
  numeric_value numeric,
  source text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.pricing_plans (
  id text PRIMARY KEY,
  name jsonb NOT NULL,
  description jsonb NOT NULL,
  monthly_price numeric(12,2) CHECK (monthly_price IS NULL OR monthly_price >= 0),
  yearly_price numeric(12,2) CHECK (yearly_price IS NULL OR yearly_price >= 0),
  currency text NOT NULL DEFAULT 'XAF',
  badge jsonb,
  cta jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pricing_plans_id_check CHECK (id IN ('free', 'sme', 'enterprise', 'institutional'))
);

CREATE TABLE public.pricing_plan_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id text NOT NULL REFERENCES public.pricing_plans(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  label jsonb NOT NULL,
  is_included boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, feature_key)
);

CREATE TABLE public.pricing_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  question jsonb NOT NULL,
  answer jsonb NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.contact_offices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  country_code text NOT NULL CHECK (country_code IN ('CM', 'GA', 'CG', 'TD', 'CF', 'GQ')),
  country_name jsonb NOT NULL,
  city text NOT NULL,
  address jsonb NOT NULL,
  phone text,
  email text,
  is_headquarters boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX contact_offices_single_headquarters_idx
  ON public.contact_offices (is_headquarters) WHERE is_headquarters;

CREATE TABLE public.contact_reasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label jsonb NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.commodity_baselines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  world_bank_indicator text,
  name jsonb NOT NULL,
  country_code text NOT NULL CHECK (country_code IN ('CM', 'GA', 'CG', 'TD', 'CF', 'GQ')),
  xaf_unit jsonb NOT NULL,
  category jsonb NOT NULL,
  usd_unit text NOT NULL,
  usd_price numeric(14,4) NOT NULL CHECK (usd_price >= 0),
  source_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.assistant_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  patterns text[] NOT NULL DEFAULT '{}',
  answer jsonb NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT assistant_knowledge_patterns_limit CHECK (cardinality(patterns) BETWEEN 1 AND 25)
);

CREATE TABLE public.legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  locale text NOT NULL CHECK (locale IN ('fr', 'en')),
  title text NOT NULL,
  sections jsonb NOT NULL,
  effective_date date NOT NULL,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slug, locale),
  CONSTRAINT legal_documents_slug_check CHECK (slug IN ('cgu', 'privacy', 'cookies', 'legal')),
  CONSTRAINT legal_documents_sections_array CHECK (jsonb_typeof(sections) = 'array')
);

CREATE TABLE public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label jsonb NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tax_rates (
  country_code text PRIMARY KEY CHECK (country_code IN ('CM', 'GA', 'CG', 'TD', 'CF', 'GQ')),
  country_name jsonb NOT NULL,
  rate numeric(5,2) NOT NULL CHECK (rate BETWEEN 0 AND 100),
  effective_from date NOT NULL,
  source text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX content_blocks_public_idx
  ON public.content_blocks (page, section, locale, sort_order) WHERE is_published;
CREATE INDEX team_members_public_idx ON public.team_members (sort_order) WHERE is_published;
CREATE INDEX partners_public_idx ON public.partners (sort_order) WHERE is_published;
CREATE INDEX milestones_public_idx ON public.milestones (year, sort_order) WHERE is_published;
CREATE INDEX pricing_plan_features_plan_idx ON public.pricing_plan_features (plan_id, sort_order);
CREATE INDEX commodity_baselines_filter_idx
  ON public.commodity_baselines (country_code, sort_order) WHERE is_published;
CREATE INDEX assistant_knowledge_tags_idx ON public.assistant_knowledge USING gin (tags);
CREATE INDEX assistant_knowledge_patterns_idx ON public.assistant_knowledge USING gin (patterns);

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'site_settings', 'content_blocks', 'team_members', 'partners', 'milestones',
    'marketing_stats', 'pricing_plans', 'pricing_plan_features', 'pricing_faqs',
    'contact_offices', 'contact_reasons', 'commodity_baselines',
    'assistant_knowledge', 'legal_documents', 'product_categories', 'tax_rates'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at()',
      'trg_' || table_name || '_updated_at',
      table_name
    );
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
  END LOOP;
END;
$$;

-- Public reads only published/public rows. Authenticated CMS managers also see drafts.
CREATE POLICY site_settings_public_read ON public.site_settings
  FOR SELECT TO anon, authenticated USING (is_public);
CREATE POLICY site_settings_admin_read ON public.site_settings
  FOR SELECT TO authenticated USING (public.can_manage_cms('site_settings'));
CREATE POLICY site_settings_admin_write ON public.site_settings
  FOR ALL TO authenticated
  USING (public.can_manage_cms('site_settings'))
  WITH CHECK (public.can_manage_cms('site_settings'));

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'content_blocks', 'team_members', 'partners', 'milestones', 'marketing_stats',
    'pricing_plans', 'pricing_faqs', 'contact_offices', 'contact_reasons',
    'commodity_baselines', 'assistant_knowledge', 'legal_documents', 'product_categories'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (is_published)',
      table_name || '_public_read', table_name
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.can_manage_cms(%L))',
      table_name || '_manager_read', table_name, table_name
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.can_manage_cms(%L)) WITH CHECK (public.can_manage_cms(%L))',
      table_name || '_manager_write', table_name, table_name, table_name
    );
  END LOOP;
END;
$$;

CREATE POLICY pricing_plan_features_public_read ON public.pricing_plan_features
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.pricing_plans AS plan
    WHERE plan.id = pricing_plan_features.plan_id AND plan.is_published
  ));
CREATE POLICY pricing_plan_features_manager_read ON public.pricing_plan_features
  FOR SELECT TO authenticated USING (public.can_manage_cms('pricing_plan_features'));
CREATE POLICY pricing_plan_features_manager_write ON public.pricing_plan_features
  FOR ALL TO authenticated
  USING (public.can_manage_cms('pricing_plan_features'))
  WITH CHECK (public.can_manage_cms('pricing_plan_features'));

CREATE POLICY tax_rates_public_read ON public.tax_rates
  FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY tax_rates_manager_read ON public.tax_rates
  FOR SELECT TO authenticated USING (public.can_manage_cms('tax_rates'));
CREATE POLICY tax_rates_manager_write ON public.tax_rates
  FOR ALL TO authenticated
  USING (public.can_manage_cms('tax_rates'))
  WITH CHECK (public.can_manage_cms('tax_rates'));

-- Explicit grants pair with RLS. Service role keeps operational access.
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'site_settings', 'content_blocks', 'team_members', 'partners', 'milestones',
    'marketing_stats', 'pricing_plans', 'pricing_plan_features', 'pricing_faqs',
    'contact_offices', 'contact_reasons', 'commodity_baselines',
    'assistant_knowledge', 'legal_documents', 'product_categories', 'tax_rates'
  ]
  LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC', table_name);
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', table_name);
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated', table_name);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', table_name);
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- Real aggregate platform statistics (no fictional marketing values).
-- ---------------------------------------------------------------------------

CREATE VIEW public.platform_stats
WITH (security_barrier = true)
AS
SELECT
  (SELECT count(*) FROM public.entreprises WHERE is_verified) AS verified_companies,
  (SELECT count(*) FROM public.certifications WHERE statut = 'approved') AS approved_certifications,
  (SELECT count(*) FROM public.certifications) AS total_certifications,
  (SELECT count(*) FROM public.produits WHERE is_published) AS published_products,
  (SELECT count(DISTINCT pays) FROM public.entreprises WHERE is_verified) AS represented_countries,
  (SELECT count(*) FROM public.chambres_commerce) AS chambers,
  now() AS measured_at;

COMMENT ON VIEW public.platform_stats IS
  'Live aggregate platform counts. Contains no row-level or personal data.';
REVOKE ALL ON public.platform_stats FROM PUBLIC;
GRANT SELECT ON public.platform_stats TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Existing platform fixes
-- ---------------------------------------------------------------------------

ALTER TABLE public.chambres_commerce
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS trg_chambres_commerce_updated_at ON public.chambres_commerce;
CREATE TRIGGER trg_chambres_commerce_updated_at
  BEFORE UPDATE ON public.chambres_commerce
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP POLICY IF EXISTS "chambres_insert_admin" ON public.chambres_commerce;
DROP POLICY IF EXISTS "chambres_update_admin" ON public.chambres_commerce;
DROP POLICY IF EXISTS "chambres_delete_admin" ON public.chambres_commerce;
CREATE POLICY "chambres_insert_admin" ON public.chambres_commerce
  FOR INSERT TO authenticated
  WITH CHECK (public.get_my_role() IN ('super_admin', 'cemac_officer'));
CREATE POLICY "chambres_update_admin" ON public.chambres_commerce
  FOR UPDATE TO authenticated
  USING (public.get_my_role() IN ('super_admin', 'cemac_officer'))
  WITH CHECK (public.get_my_role() IN ('super_admin', 'cemac_officer'));
CREATE POLICY "chambres_delete_admin" ON public.chambres_commerce
  FOR DELETE TO authenticated
  USING (public.get_my_role() IN ('super_admin', 'cemac_officer'));
GRANT SELECT ON public.chambres_commerce TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.chambres_commerce TO authenticated;

CREATE OR REPLACE FUNCTION public.protect_entreprise_security_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  caller_role text;
BEGIN
  IF auth.role() IS DISTINCT FROM 'authenticated' THEN
    RETURN NEW;
  END IF;

  caller_role := public.get_my_role();

  -- SECURITY DEFINER administrative/payment RPCs execute as postgres. Direct
  -- browser updates remain blocked even for administrators.
  IF current_user <> 'postgres'
     AND NEW.subscription_plan IS DISTINCT FROM OLD.subscription_plan
  THEN
    RAISE EXCEPTION 'subscription_plan can only be changed by a trusted backend'
      USING ERRCODE = '42501';
  END IF;

  IF (caller_role IS NULL OR caller_role NOT IN ('super_admin', 'cemac_officer'))
     AND (
       NEW.owner_id IS DISTINCT FROM OLD.owner_id
       OR NEW.is_verified IS DISTINCT FROM OLD.is_verified
       OR NEW.chambre_id IS DISTINCT FROM OLD.chambre_id
     )
  THEN
    RAISE EXCEPTION 'entreprise trust fields require an authorized officer'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_entreprise_security_fields() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_subscription_plan(
  target_entreprise_id uuid,
  target_plan text
)
RETURNS public.entreprises
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  updated_entreprise public.entreprises;
BEGIN
  IF public.get_my_role() <> 'super_admin' THEN
    RAISE EXCEPTION 'only super_admin may set subscription plans'
      USING ERRCODE = '42501';
  END IF;
  IF target_plan NOT IN ('free', 'sme', 'enterprise', 'institutional') THEN
    RAISE EXCEPTION 'invalid subscription plan' USING ERRCODE = '22023';
  END IF;

  UPDATE public.entreprises
  SET subscription_plan = target_plan,
      updated_at = now()
  WHERE id = target_entreprise_id
  RETURNING * INTO updated_entreprise;

  IF updated_entreprise.id IS NULL THEN
    RAISE EXCEPTION 'entreprise not found' USING ERRCODE = 'P0002';
  END IF;
  RETURN updated_entreprise;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_subscription_plan(uuid, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_subscription_plan(uuid, text)
  TO authenticated, service_role;

-- Safe metadata projection. Credential-shaped keys are never projected.
CREATE VIEW public.api_config_metadata
WITH (security_barrier = true)
AS
SELECT
  id,
  key,
  name,
  category,
  is_active,
  jsonb_strip_nulls(jsonb_build_object(
    'environment', config -> 'environment',
    'base_url', config -> 'base_url',
    'from_email', config -> 'from_email',
    'from_name', config -> 'from_name',
    'bank_name', config -> 'bank_name',
    'account_name', config -> 'account_name',
    'bank_code', config -> 'bank_code',
    'swift_code', config -> 'swift_code',
    'instructions', config -> 'instructions',
    'host', config -> 'host',
    'port', config -> 'port',
    'secure', config -> 'secure'
  )) AS metadata,
  created_at,
  updated_at
FROM public.api_configs
WHERE public.get_my_role() IN ('super_admin', 'cemac_officer');

COMMENT ON VIEW public.api_config_metadata IS
  'Allowlisted non-secret integration metadata. Credentials remain Edge Function secrets.';
REVOKE ALL ON public.api_config_metadata FROM PUBLIC, anon;
GRANT SELECT ON public.api_config_metadata TO authenticated, service_role;

-- Private certification documents bucket. Object names must be:
-- <certification UUID>/<user-controlled filename>
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certification-docs',
  'certification-docs',
  false,
  20971520,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Scoped read certification docs" ON storage.objects;
DROP POLICY IF EXISTS "Scoped upload certification docs" ON storage.objects;
DROP POLICY IF EXISTS "Owner update certification docs" ON storage.objects;
DROP POLICY IF EXISTS "Owner delete certification docs" ON storage.objects;

CREATE POLICY "Scoped read certification docs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'certification-docs'
  AND public.can_access_certification(
    CASE
      WHEN (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      THEN ((storage.foldername(name))[1])::uuid
    END
  )
);

CREATE POLICY "Scoped upload certification docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'certification-docs'
  AND public.can_access_certification(
    CASE
      WHEN (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      THEN ((storage.foldername(name))[1])::uuid
    END
  )
  AND lower(storage.extension(name)) IN ('pdf', 'jpg', 'jpeg', 'png', 'webp')
);

CREATE POLICY "Owner update certification docs"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'certification-docs'
  AND owner_id = auth.uid()::text
  AND public.can_access_certification(
    CASE
      WHEN (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      THEN ((storage.foldername(name))[1])::uuid
    END
  )
)
WITH CHECK (
  bucket_id = 'certification-docs'
  AND owner_id = auth.uid()::text
  AND public.can_access_certification(
    CASE
      WHEN (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      THEN ((storage.foldername(name))[1])::uuid
    END
  )
  AND lower(storage.extension(name)) IN ('pdf', 'jpg', 'jpeg', 'png', 'webp')
);

CREATE POLICY "Owner delete certification docs"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'certification-docs'
  AND owner_id = auth.uid()::text
  AND public.can_access_certification(
    CASE
      WHEN (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      THEN ((storage.foldername(name))[1])::uuid
    END
  )
);

COMMIT;
