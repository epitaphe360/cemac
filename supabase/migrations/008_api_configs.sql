-- ============================================================
-- 008 — Table centralisée de configuration des APIs
-- ============================================================

-- Table api_configs : stockage sécurisé des clés et paramètres API
CREATE TABLE IF NOT EXISTS public.api_configs (
  id           uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key          text        NOT NULL UNIQUE,          -- identifiant unique ex: 'mtn_momo'
  name         text        NOT NULL,                 -- nom affiché
  category     text        NOT NULL DEFAULT 'other', -- 'payment' | 'email' | 'sms' | 'other'
  config       jsonb       NOT NULL DEFAULT '{}',    -- champs de configuration (clés, endpoints…)
  is_active    boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Index sur la catégorie pour les requêtes filtrées
CREATE INDEX IF NOT EXISTS api_configs_category_idx ON public.api_configs (category);

-- Mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION public.handle_api_configs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_api_configs_updated_at ON public.api_configs;
CREATE TRIGGER set_api_configs_updated_at
  BEFORE UPDATE ON public.api_configs
  FOR EACH ROW EXECUTE FUNCTION public.handle_api_configs_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.api_configs ENABLE ROW LEVEL SECURITY;

-- Lecture : super_admin uniquement
DROP POLICY IF EXISTS "api_configs_select_super_admin" ON public.api_configs;
CREATE POLICY "api_configs_select_super_admin"
  ON public.api_configs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Insertion : super_admin uniquement
DROP POLICY IF EXISTS "api_configs_insert_super_admin" ON public.api_configs;
CREATE POLICY "api_configs_insert_super_admin"
  ON public.api_configs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Mise à jour : super_admin uniquement
DROP POLICY IF EXISTS "api_configs_update_super_admin" ON public.api_configs;
CREATE POLICY "api_configs_update_super_admin"
  ON public.api_configs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Suppression : super_admin uniquement
DROP POLICY IF EXISTS "api_configs_delete_super_admin" ON public.api_configs;
CREATE POLICY "api_configs_delete_super_admin"
  ON public.api_configs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- ── Données initiales (squelettes vides) ─────────────────────────────────────

INSERT INTO public.api_configs (key, name, category, config, is_active) VALUES
  ('mtn_momo',      'MTN Mobile Money',  'payment', '{"api_key":"","api_secret":"","subscription_key":"","environment":"sandbox","base_url":"https://sandbox.momodeveloper.mtn.com"}', false),
  ('orange_money',  'Orange Money',      'payment', '{"client_id":"","client_secret":"","merchant_key":"","environment":"sandbox"}', false),
  ('bank_transfer', 'Virement Bancaire', 'payment', '{"bank_name":"","account_name":"","account_number":"","bank_code":"","swift_code":"","iban":"","instructions":""}', false),
  ('resend',        'Resend (Email)',     'email',   '{"api_key":"","from_email":"","from_name":"CEMAC INTEGRA"}', false)
ON CONFLICT (key) DO NOTHING;
