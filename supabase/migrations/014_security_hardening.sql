-- CEMAC INTEGRA - forward-only security remediation.
-- This migration intentionally does not remove business data.

BEGIN;

-- ---------------------------------------------------------------------------
-- Roles, profile creation and password rotation
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS password_reset_required boolean NOT NULL DEFAULT false;

-- Accounts created by the legacy demo migrations used repository-known
-- passwords. Preserve the accounts, but force an operator-visible reset state.
UPDATE public.profiles
SET password_reset_required = true,
    updated_at = now()
WHERE id::text LIKE '11111111-0000-0000-0000-%'
   OR id::text LIKE 'ad00000_-0000-0000-0000-00000000000_'
   OR id::text LIKE '0000000_-0000-0000-0000-00000000000_'
   OR email = ANY (ARRAY[
     'admin@cemac-integra.cm',
     'officer@cemac-integra.cm',
     'auditor@cemac-integra.cm'
   ]);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(btrim(NEW.raw_user_meta_data ->> 'full_name'), ''),
    'company_admin'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Creates a company profile with a fixed server-controlled role. User-controlled auth metadata is never trusted for role assignment.';

-- Clear the forced-reset marker only when GoTrue has successfully changed the
-- password hash. Browser code cannot clear this field directly.
CREATE OR REPLACE FUNCTION public.handle_password_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.encrypted_password IS DISTINCT FROM OLD.encrypted_password THEN
    UPDATE public.profiles
    SET password_reset_required = false,
        updated_at = now()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_password_changed ON auth.users;
CREATE TRIGGER on_auth_user_password_changed
  AFTER UPDATE OF encrypted_password ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_password_changed();

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT p.role
  FROM public.profiles AS p
  WHERE p.id = auth.uid()
    AND NOT p.password_reset_required;
$$;

CREATE OR REPLACE FUNCTION public.get_my_country()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT p.country FROM public.profiles AS p WHERE p.id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_entreprise_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT e.id
  FROM public.entreprises AS e
  WHERE e.owner_id = auth.uid()
  ORDER BY e.created_at, e.id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.can_access_certification(certification_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
  cert_status text;
  cert_country text;
  cert_owner uuid;
  my_role text;
BEGIN
  SELECT c.statut, e.pays, e.owner_id
    INTO cert_status, cert_country, cert_owner
  FROM public.certifications AS c
  JOIN public.entreprises AS e ON e.id = c.entreprise_id
  WHERE c.id = certification_uuid;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  my_role := public.get_my_role();
  RETURN CASE
    WHEN cert_owner = auth.uid() THEN true
    WHEN my_role IN ('super_admin', 'cemac_officer') THEN true
    WHEN my_role = 'chamber_agent' THEN
      cert_country IS NOT NULL AND cert_country = public.get_my_country()
    WHEN my_role = 'auditor' THEN
      cert_status IN ('under_review', 'field_validation', 'commission_review')
    ELSE false
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.auditor_can_access_entreprise(entreprise_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT
    public.get_my_role() = 'auditor'
    AND EXISTS (
      SELECT 1
      FROM public.certifications AS c
      WHERE c.entreprise_id = entreprise_uuid
        AND c.statut IN ('under_review', 'field_validation', 'commission_review')
    );
$$;

CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  target_user_id uuid,
  target_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF public.get_my_role() <> 'super_admin' THEN
    RAISE EXCEPTION 'only super_admin may change user roles'
      USING ERRCODE = '42501';
  END IF;

  IF target_role NOT IN (
    'super_admin', 'cemac_officer', 'chamber_agent', 'company_admin',
    'auditor', 'buyer', 'logistics_agent', 'public'
  ) THEN
    RAISE EXCEPTION 'invalid application role'
      USING ERRCODE = '22023';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'administrators cannot change their own role'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.profiles
  SET role = target_role,
      updated_at = now()
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile not found' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_api_configs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_invoices_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.protect_profile_security_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF auth.role() = 'authenticated'
     AND current_user <> 'postgres'
     AND (
       NEW.role IS DISTINCT FROM OLD.role
       OR NEW.password_reset_required IS DISTINCT FROM OLD.password_reset_required
       OR NEW.id IS DISTINCT FROM OLD.id
       OR NEW.email IS DISTINCT FROM OLD.email
       OR (
         OLD.role IN ('super_admin', 'cemac_officer', 'chamber_agent', 'auditor')
         AND NEW.country IS DISTINCT FROM OLD.country
       )
     )
  THEN
    RAISE EXCEPTION 'profile security fields can only be changed by a trusted backend'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_security_fields ON public.profiles;
CREATE TRIGGER protect_profile_security_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_security_fields();

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

  IF NEW.subscription_plan IS DISTINCT FROM OLD.subscription_plan THEN
    RAISE EXCEPTION 'subscription_plan can only be changed by the payment backend'
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

DROP TRIGGER IF EXISTS protect_entreprise_security_fields ON public.entreprises;
CREATE TRIGGER protect_entreprise_security_fields
  BEFORE UPDATE ON public.entreprises
  FOR EACH ROW EXECUTE FUNCTION public.protect_entreprise_security_fields();

CREATE OR REPLACE FUNCTION public.protect_certification_security_fields()
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
  IF caller_role IS NULL THEN
    RAISE EXCEPTION 'a valid profile role is required' USING ERRCODE = '42501';
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.entreprise_id IS DISTINCT FROM OLD.entreprise_id
     OR NEW.numero_dossier IS DISTINCT FROM OLD.numero_dossier
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'certification identity fields are immutable'
      USING ERRCODE = '42501';
  END IF;

  IF caller_role = 'company_admin'
     AND (
       NEW.agent_id IS DISTINCT FROM OLD.agent_id
       OR NEW.chambre_id IS DISTINCT FROM OLD.chambre_id
       OR NEW.notes_agent IS DISTINCT FROM OLD.notes_agent
       OR NEW.notes_commission IS DISTINCT FROM OLD.notes_commission
       OR NEW.date_approbation IS DISTINCT FROM OLD.date_approbation
       OR NEW.date_expiration IS DISTINCT FROM OLD.date_expiration
       OR NEW.qr_code_data IS DISTINCT FROM OLD.qr_code_data
       OR NEW.qr_code_url IS DISTINCT FROM OLD.qr_code_url
     )
  THEN
    RAISE EXCEPTION 'certification decision fields require an authorized reviewer'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_certification_security_fields ON public.certifications;
CREATE TRIGGER protect_certification_security_fields
  BEFORE UPDATE ON public.certifications
  FOR EACH ROW EXECUTE FUNCTION public.protect_certification_security_fields();

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_password_changed() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_api_configs_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_invoices_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_profile_security_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_entreprise_security_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_certification_security_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_my_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_my_country() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_my_entreprise_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_access_certification(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.auditor_can_access_entreprise(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_update_user_role(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_country() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_entreprise_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_access_certification(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.auditor_can_access_entreprise(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_user_role(uuid, text) TO authenticated, service_role;

-- Column privileges stop self-service role/reset/email mutation even if a future
-- policy is accidentally broadened.
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (
  full_name, avatar_url, phone, country, language,
  notification_preferences, updated_at
) ON public.profiles TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS policy normalization
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.get_my_role() IN ('super_admin', 'cemac_officer'));

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND (
      notification_preferences IS NULL
      OR (
        jsonb_typeof(notification_preferences) = 'object'
        AND octet_length(notification_preferences::text) <= 10000
      )
    )
  );

ALTER TABLE public.entreprises ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "entreprises_select_agents" ON public.entreprises;
DROP POLICY IF EXISTS "entreprises_select_admin" ON public.entreprises;
DROP POLICY IF EXISTS "entreprises_select_chamber_scope" ON public.entreprises;
DROP POLICY IF EXISTS "entreprises_select_auditor_scope" ON public.entreprises;
CREATE POLICY "entreprises_select_admin" ON public.entreprises
  FOR SELECT TO authenticated
  USING (public.get_my_role() IN ('super_admin', 'cemac_officer'));
CREATE POLICY "entreprises_select_chamber_scope" ON public.entreprises
  FOR SELECT TO authenticated
  USING (
    public.get_my_role() = 'chamber_agent'
    AND pays = public.get_my_country()
  );
CREATE POLICY "entreprises_select_auditor_scope" ON public.entreprises
  FOR SELECT TO authenticated
  USING (public.auditor_can_access_entreprise(id));

DROP POLICY IF EXISTS "entreprises_update_own" ON public.entreprises;
CREATE POLICY "entreprises_update_own" ON public.entreprises
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS "entreprises_update_admin" ON public.entreprises;
CREATE POLICY "entreprises_update_admin" ON public.entreprises
  FOR UPDATE TO authenticated
  USING (public.get_my_role() IN ('super_admin', 'cemac_officer'))
  WITH CHECK (public.get_my_role() IN ('super_admin', 'cemac_officer'));

ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "certs_insert" ON public.certifications;
CREATE POLICY "certs_insert" ON public.certifications
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_my_role() = 'company_admin'
    AND EXISTS (
      SELECT 1 FROM public.entreprises AS e
      WHERE e.id = certifications.entreprise_id AND e.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "certs_update_own" ON public.certifications;
DROP POLICY IF EXISTS "certs_update_owner_draft" ON public.certifications;
CREATE POLICY "certs_update_owner_draft" ON public.certifications
  FOR UPDATE TO authenticated
  USING (
    public.get_my_role() = 'company_admin'
    AND statut = 'draft'
    AND EXISTS (
      SELECT 1 FROM public.entreprises AS e
      WHERE e.id = certifications.entreprise_id AND e.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    public.get_my_role() = 'company_admin'
    AND statut IN ('draft', 'submitted')
    AND EXISTS (
      SELECT 1 FROM public.entreprises AS e
      WHERE e.id = certifications.entreprise_id AND e.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "certs_update_chamber_takeover" ON public.certifications;
CREATE POLICY "certs_update_chamber_takeover" ON public.certifications
  FOR UPDATE TO authenticated
  USING (
    public.get_my_role() = 'chamber_agent'
    AND statut = 'submitted'
    AND EXISTS (
      SELECT 1 FROM public.entreprises AS e
      WHERE e.id = certifications.entreprise_id
        AND e.pays = public.get_my_country()
    )
  )
  WITH CHECK (
    public.get_my_role() = 'chamber_agent'
    AND statut = 'under_review'
    AND EXISTS (
      SELECT 1 FROM public.entreprises AS e
      WHERE e.id = certifications.entreprise_id
        AND e.pays = public.get_my_country()
    )
  );

DROP POLICY IF EXISTS "certs_update_auditor_workflow" ON public.certifications;
CREATE POLICY "certs_update_auditor_workflow" ON public.certifications
  FOR UPDATE TO authenticated
  USING (
    public.get_my_role() = 'auditor'
    AND statut IN ('under_review', 'field_validation')
  )
  WITH CHECK (
    public.get_my_role() = 'auditor'
    AND statut IN ('field_validation', 'commission_review')
  );

DROP POLICY IF EXISTS "certs_update_commission_decision" ON public.certifications;
CREATE POLICY "certs_update_commission_decision" ON public.certifications
  FOR UPDATE TO authenticated
  USING (
    public.get_my_role() IN ('super_admin', 'cemac_officer')
    AND statut IN ('commission_review', 'approved')
  )
  WITH CHECK (
    public.get_my_role() IN ('super_admin', 'cemac_officer')
    AND statut IN ('approved', 'rejected', 'suspended')
  );

ALTER TABLE public.produits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "produits_insert" ON public.produits;
CREATE POLICY "produits_insert" ON public.produits
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.entreprises AS e
      WHERE e.id = produits.entreprise_id AND e.owner_id = auth.uid()
    )
    AND public.get_my_role() = 'company_admin'
    AND (
      certification_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.certifications AS c
        WHERE c.id = produits.certification_id
          AND c.entreprise_id = produits.entreprise_id
          AND c.statut = 'approved'
      )
    )
    AND (
      NOT is_published
      OR EXISTS (
        SELECT 1 FROM public.certifications AS c
        WHERE c.id = produits.certification_id
          AND c.entreprise_id = produits.entreprise_id
          AND c.statut = 'approved'
      )
    )
  );

DROP POLICY IF EXISTS "produits_update_own" ON public.produits;
CREATE POLICY "produits_update_own" ON public.produits
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.entreprises AS e
      WHERE e.id = produits.entreprise_id AND e.owner_id = auth.uid()
    )
    AND public.get_my_role() = 'company_admin'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.entreprises AS e
      WHERE e.id = produits.entreprise_id AND e.owner_id = auth.uid()
    )
    AND public.get_my_role() = 'company_admin'
    AND (
      (
        certification_id IS NULL
        AND NOT is_published
      )
      OR EXISTS (
        SELECT 1 FROM public.certifications AS c
        WHERE c.id = produits.certification_id
          AND c.entreprise_id = produits.entreprise_id
          AND c.statut = 'approved'
      )
    )
  );

DROP POLICY IF EXISTS "produits_update_admin" ON public.produits;
CREATE POLICY "produits_update_admin" ON public.produits
  FOR UPDATE TO authenticated
  USING (public.get_my_role() IN ('super_admin', 'cemac_officer'))
  WITH CHECK (public.get_my_role() IN ('super_admin', 'cemac_officer'));

DROP POLICY IF EXISTS "produits_select_admin" ON public.produits;
CREATE POLICY "produits_select_admin" ON public.produits
  FOR SELECT TO authenticated
  USING (public.get_my_role() IN ('super_admin', 'cemac_officer'));

DROP POLICY IF EXISTS "produits_delete_admin" ON public.produits;
CREATE POLICY "produits_delete_admin" ON public.produits
  FOR DELETE TO authenticated
  USING (
    public.get_my_role() IN ('super_admin', 'cemac_officer')
    OR (
      public.get_my_role() = 'company_admin'
      AND EXISTS (
        SELECT 1 FROM public.entreprises AS e
        WHERE e.id = produits.entreprise_id AND e.owner_id = auth.uid()
      )
    )
  );

-- Existing FOR ALL policies were missing WITH CHECK, making inserts possible
-- outside the intended administrative scope.
ALTER TABLE public.corridors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "corridors_admin_write" ON public.corridors;
CREATE POLICY "corridors_admin_write" ON public.corridors
  FOR ALL TO authenticated
  USING (public.get_my_role() IN ('super_admin', 'cemac_officer', 'chamber_agent'))
  WITH CHECK (public.get_my_role() IN ('super_admin', 'cemac_officer', 'chamber_agent'));

ALTER TABLE public.logistics_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "alerts_admin_write" ON public.logistics_alerts;
CREATE POLICY "alerts_admin_write" ON public.logistics_alerts
  FOR ALL TO authenticated
  USING (public.get_my_role() IN ('super_admin', 'cemac_officer', 'chamber_agent'))
  WITH CHECK (public.get_my_role() IN ('super_admin', 'cemac_officer', 'chamber_agent'));

-- ---------------------------------------------------------------------------
-- Notifications and public contact intake
-- ---------------------------------------------------------------------------

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_insert_service" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

REVOKE INSERT, DELETE, TRUNCATE ON public.notifications FROM anon, authenticated;
REVOKE UPDATE ON public.notifications FROM anon, authenticated;
GRANT SELECT ON public.notifications TO authenticated;
GRANT UPDATE (read) ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contacts_insert_public" ON public.contact_requests;
CREATE POLICY "contacts_insert_public" ON public.contact_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(btrim(full_name)) BETWEEN 2 AND 120
    AND char_length(email) BETWEEN 3 AND 254
    AND email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    AND char_length(message) BETWEEN 10 AND 5000
    AND (company IS NULL OR char_length(company) <= 200)
    AND (country IS NULL OR char_length(country) <= 80)
    AND (reason IS NULL OR char_length(reason) <= 80)
  );

DROP POLICY IF EXISTS "contacts_select_admin" ON public.contact_requests;
CREATE POLICY "contacts_select_admin" ON public.contact_requests
  FOR SELECT TO authenticated
  USING (public.get_my_role() IN ('super_admin', 'cemac_officer'));

REVOKE ALL ON public.contact_requests FROM anon, authenticated;
GRANT INSERT (
  full_name, email, company, country, reason, message
) ON public.contact_requests TO anon, authenticated;
GRANT SELECT ON public.contact_requests TO authenticated;
GRANT ALL ON public.contact_requests TO service_role;

-- ---------------------------------------------------------------------------
-- API configuration: configuration is not a secret store
-- ---------------------------------------------------------------------------

-- Remove all known credential-shaped fields, including the leaked Resend key,
-- while retaining non-secret endpoints and display settings.
UPDATE public.api_configs
SET config = config - ARRAY[
      'api_key', 'api_secret', 'client_secret', 'merchant_key',
      'subscription_key', 'password', 'secret', 'token',
      'access_token', 'private_key'
    ],
    is_active = false,
    updated_at = now()
WHERE config ?| ARRAY[
        'api_key', 'api_secret', 'client_secret', 'merchant_key',
        'subscription_key', 'password', 'secret', 'token',
        'access_token', 'private_key'
      ]
   OR category IN ('payment', 'email');

COMMENT ON TABLE public.api_configs IS
  'Non-secret integration metadata only. Runtime credentials belong in Supabase Edge Function secrets.';

REVOKE ALL ON public.api_configs FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.api_configs TO service_role;

-- ---------------------------------------------------------------------------
-- Storage: uploads must be owned by the authenticated user folder
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Authenticated upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
DROP POLICY IF EXISTS "Owner delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Owner update product images" ON storage.objects;

CREATE POLICY "Authenticated upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp')
);

CREATE POLICY "Public read product images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Owner update product images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'product-images'
  AND owner_id = auth.uid()::text
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'product-images'
  AND owner_id = auth.uid()::text
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp')
);

CREATE POLICY "Owner delete product images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'product-images'
  AND owner_id = auth.uid()::text
  AND (storage.foldername(name))[1] = auth.uid()::text
);

COMMIT;
