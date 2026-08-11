-- ============================================================
-- CEMAC INTEGRA — Script SQL complet IDEMPOTENT
-- Peut être exécuté plusieurs fois sans erreur
-- Supabase Dashboard > SQL Editor > New query > Run
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT,
  avatar_url    TEXT,
  role          TEXT NOT NULL DEFAULT 'public' CHECK (role IN (
                  'super_admin', 'cemac_officer', 'chamber_agent',
                  'company_admin', 'auditor', 'buyer', 'logistics_agent', 'public'
                )),
  phone         TEXT,
  country       TEXT,
  language      TEXT NOT NULL DEFAULT 'fr',
  notification_preferences JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB;

CREATE TABLE IF NOT EXISTS public.chambres_commerce (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom         TEXT NOT NULL,
  pays        TEXT NOT NULL,
  ville       TEXT NOT NULL,
  email       TEXT,
  telephone   TEXT,
  agent_count INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.entreprises (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  raison_sociale       TEXT NOT NULL,
  sigle                TEXT,
  secteur_activite     TEXT,
  pays                 TEXT NOT NULL,
  ville                TEXT,
  adresse              TEXT,
  telephone            TEXT,
  email_contact        TEXT,
  site_web             TEXT,
  numero_contribuable  TEXT,
  description          TEXT,
  logo_url             TEXT,
  subscription_plan    TEXT NOT NULL DEFAULT 'free' CHECK (subscription_plan IN ('free', 'sme', 'enterprise', 'institutional')),
  is_verified          BOOLEAN NOT NULL DEFAULT FALSE,
  chambre_id           UUID REFERENCES public.chambres_commerce(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS cert_seq START 1;

CREATE TABLE IF NOT EXISTS public.certifications (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id         UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  numero_dossier        TEXT NOT NULL UNIQUE DEFAULT 'CI-' || to_char(NOW(), 'YYYY') || '-' || LPAD(nextval('cert_seq')::TEXT, 5, '0'),
  type_certification    TEXT NOT NULL DEFAULT 'made_in_cemac' CHECK (type_certification IN ('made_in_cemac', 'origine_cemac', 'qualite_plus')),
  statut                TEXT NOT NULL DEFAULT 'draft' CHECK (statut IN (
                          'draft', 'submitted', 'under_review', 'field_validation',
                          'commission_review', 'approved', 'rejected', 'suspended', 'expired'
                        )),
  produit_nom           TEXT NOT NULL,
  produit_description   TEXT,
  pays_production       TEXT NOT NULL,
  valeur_ajoutee_locale DECIMAL(5,2),
  qr_code_data          TEXT,
  qr_code_url           TEXT,
  date_soumission       TIMESTAMPTZ,
  date_approbation      TIMESTAMPTZ,
  date_expiration       TIMESTAMPTZ,
  agent_id              UUID REFERENCES public.profiles(id),
  chambre_id            UUID REFERENCES public.chambres_commerce(id),
  notes_agent           TEXT,
  notes_commission      TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.documents (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  certification_id UUID NOT NULL REFERENCES public.certifications(id) ON DELETE CASCADE,
  nom_fichier      TEXT NOT NULL,
  type_document    TEXT NOT NULL CHECK (type_document IN (
                     'statuts', 'registre_commerce', 'bilan', 'factures',
                     'rapport_audit', 'photos_produit', 'certificat_qualite', 'autre'
                   )),
  url              TEXT NOT NULL,
  taille           BIGINT,
  mime_type        TEXT,
  uploaded_by      UUID NOT NULL REFERENCES public.profiles(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workflow_events (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  certification_id   UUID NOT NULL REFERENCES public.certifications(id) ON DELETE CASCADE,
  statut_precedent   TEXT,
  statut_nouveau     TEXT NOT NULL,
  commentaire        TEXT,
  created_by         UUID NOT NULL REFERENCES public.profiles(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.produits (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entreprise_id       UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
  certification_id    UUID REFERENCES public.certifications(id),
  nom                 TEXT NOT NULL,
  description         TEXT,
  categorie           TEXT,
  sous_categorie      TEXT,
  prix_unitaire       DECIMAL(12,2),
  devise              TEXT NOT NULL DEFAULT 'XAF',
  unite               TEXT,
  quantite_disponible INTEGER,
  pays_origine        TEXT NOT NULL,
  images              TEXT[] DEFAULT '{}',
  tags                TEXT[] DEFAULT '{}',
  is_published        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.corridors (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route      TEXT NOT NULL,
  mode       TEXT NOT NULL DEFAULT 'Route' CHECK (mode IN ('Route', 'Maritime', 'Aérien', 'Ferroviaire', 'Mixte')),
  days       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'Opérationnel' CHECK (status IN ('Opérationnel', 'Ralenti', 'Bloqué', 'En maintenance')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.logistics_alerts (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country    TEXT NOT NULL,
  message    TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'danger')),
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEX
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_entreprises_owner     ON public.entreprises(owner_id);
CREATE INDEX IF NOT EXISTS idx_entreprises_pays      ON public.entreprises(pays);
CREATE INDEX IF NOT EXISTS idx_certifications_ent    ON public.certifications(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_certifications_statut ON public.certifications(statut);
CREATE INDEX IF NOT EXISTS idx_certifications_num    ON public.certifications(numero_dossier);
CREATE INDEX IF NOT EXISTS idx_documents_cert        ON public.documents(certification_id);
CREATE INDEX IF NOT EXISTS idx_workflow_cert         ON public.workflow_events(certification_id);
CREATE INDEX IF NOT EXISTS idx_produits_entreprise   ON public.produits(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_produits_published    ON public.produits(is_published) WHERE is_published = TRUE;

-- ============================================================
-- FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'company_admin')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_entreprise_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT id FROM public.entreprises WHERE owner_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_country()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT country FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.can_access_certification(certification_uuid UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE
  cert_status  TEXT;
  cert_country TEXT;
  cert_owner   UUID;
  my_role      TEXT;
BEGIN
  SELECT c.statut, e.pays, e.owner_id
    INTO cert_status, cert_country, cert_owner
    FROM public.certifications c
    JOIN public.entreprises e ON e.id = c.entreprise_id
   WHERE c.id = certification_uuid;
  IF NOT FOUND THEN RETURN FALSE; END IF;
  my_role := public.get_my_role();
  IF my_role IN ('super_admin', 'cemac_officer') THEN RETURN TRUE; END IF;
  IF cert_owner = auth.uid() THEN RETURN TRUE; END IF;
  IF my_role = 'chamber_agent' THEN
    RETURN cert_country IS NOT NULL AND cert_country = public.get_my_country();
  END IF;
  IF my_role = 'auditor' THEN
    RETURN cert_status IN ('under_review', 'field_validation', 'commission_review');
  END IF;
  RETURN FALSE;
END;
$$;

-- ============================================================
-- TRIGGERS (DROP IF EXISTS avant chaque CREATE)
-- ============================================================

DROP TRIGGER IF EXISTS trg_profiles_updated_at        ON public.profiles;
DROP TRIGGER IF EXISTS trg_entreprises_updated_at     ON public.entreprises;
DROP TRIGGER IF EXISTS trg_certifications_updated_at  ON public.certifications;
DROP TRIGGER IF EXISTS trg_produits_updated_at        ON public.produits;
DROP TRIGGER IF EXISTS trg_corridors_updated_at       ON public.corridors;
DROP TRIGGER IF EXISTS trg_logistics_alerts_updated_at ON public.logistics_alerts;
DROP TRIGGER IF EXISTS trg_on_auth_user_created       ON auth.users;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_entreprises_updated_at
  BEFORE UPDATE ON public.entreprises
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_certifications_updated_at
  BEFORE UPDATE ON public.certifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_produits_updated_at
  BEFORE UPDATE ON public.produits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_corridors_updated_at
  BEFORE UPDATE ON public.corridors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_logistics_alerts_updated_at
  BEFORE UPDATE ON public.logistics_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entreprises       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produits          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chambres_commerce ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corridors         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_alerts  ENABLE ROW LEVEL SECURITY;

-- ── profiles ──
DROP POLICY IF EXISTS "profiles_select_own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"   ON public.profiles;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT USING (public.get_my_role() IN ('super_admin','cemac_officer','chamber_agent','auditor'));
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());

-- ── entreprises ──
DROP POLICY IF EXISTS "entreprises_select_own"    ON public.entreprises;
DROP POLICY IF EXISTS "entreprises_select_public" ON public.entreprises;
DROP POLICY IF EXISTS "entreprises_select_admin"  ON public.entreprises;
DROP POLICY IF EXISTS "entreprises_insert_own"    ON public.entreprises;
DROP POLICY IF EXISTS "entreprises_update_own"    ON public.entreprises;

CREATE POLICY "entreprises_select_own"
  ON public.entreprises FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "entreprises_select_public"
  ON public.entreprises FOR SELECT USING (is_verified = TRUE);
CREATE POLICY "entreprises_select_admin"
  ON public.entreprises FOR SELECT USING (public.get_my_role() IN ('super_admin','cemac_officer','chamber_agent','auditor'));
CREATE POLICY "entreprises_insert_own"
  ON public.entreprises FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "entreprises_update_own"
  ON public.entreprises FOR UPDATE USING (owner_id = auth.uid());

-- ── certifications ──
DROP POLICY IF EXISTS "certs_select_own"                 ON public.certifications;
DROP POLICY IF EXISTS "certs_select_approved"            ON public.certifications;
DROP POLICY IF EXISTS "certs_select_agent"               ON public.certifications;
DROP POLICY IF EXISTS "certs_insert_own"                 ON public.certifications;
DROP POLICY IF EXISTS "certs_update_own"                 ON public.certifications;
DROP POLICY IF EXISTS "certs_select_public_verification" ON public.certifications;
DROP POLICY IF EXISTS "certs_select_admin_all"           ON public.certifications;
DROP POLICY IF EXISTS "certs_select_chamber_scope"       ON public.certifications;
DROP POLICY IF EXISTS "certs_select_auditor_scope"       ON public.certifications;
DROP POLICY IF EXISTS "certs_update_owner_draft"         ON public.certifications;
DROP POLICY IF EXISTS "certs_update_chamber_takeover"    ON public.certifications;
DROP POLICY IF EXISTS "certs_update_auditor_workflow"    ON public.certifications;
DROP POLICY IF EXISTS "certs_update_commission_decision" ON public.certifications;

CREATE POLICY "certs_select_own"
  ON public.certifications FOR SELECT
  USING (entreprise_id IN (SELECT id FROM public.entreprises WHERE owner_id = auth.uid()));

CREATE POLICY "certs_select_public_verification"
  ON public.certifications FOR SELECT
  USING (statut IN ('approved','expired','suspended'));

CREATE POLICY "certs_select_admin_all"
  ON public.certifications FOR SELECT
  USING (public.get_my_role() IN ('super_admin','cemac_officer'));

CREATE POLICY "certs_select_chamber_scope"
  ON public.certifications FOR SELECT
  USING (
    public.get_my_role() = 'chamber_agent'
    AND EXISTS (
      SELECT 1 FROM public.entreprises e
      WHERE e.id = certifications.entreprise_id
        AND e.pays = public.get_my_country()
    )
  );

CREATE POLICY "certs_select_auditor_scope"
  ON public.certifications FOR SELECT
  USING (
    public.get_my_role() = 'auditor'
    AND statut IN ('under_review','field_validation','commission_review')
  );

CREATE POLICY "certs_insert_own"
  ON public.certifications FOR INSERT
  WITH CHECK (entreprise_id IN (SELECT id FROM public.entreprises WHERE owner_id = auth.uid()));

CREATE POLICY "certs_update_owner_draft"
  ON public.certifications FOR UPDATE
  USING (
    entreprise_id IN (SELECT id FROM public.entreprises WHERE owner_id = auth.uid())
    AND statut = 'draft'
  )
  WITH CHECK (
    entreprise_id IN (SELECT id FROM public.entreprises WHERE owner_id = auth.uid())
    AND statut IN ('draft','submitted')
  );

CREATE POLICY "certs_update_chamber_takeover"
  ON public.certifications FOR UPDATE
  USING (
    public.get_my_role() = 'chamber_agent'
    AND statut = 'submitted'
    AND EXISTS (SELECT 1 FROM public.entreprises e WHERE e.id = certifications.entreprise_id AND e.pays = public.get_my_country())
  )
  WITH CHECK (
    public.get_my_role() = 'chamber_agent'
    AND statut = 'under_review'
    AND EXISTS (SELECT 1 FROM public.entreprises e WHERE e.id = certifications.entreprise_id AND e.pays = public.get_my_country())
  );

CREATE POLICY "certs_update_auditor_workflow"
  ON public.certifications FOR UPDATE
  USING  (public.get_my_role() = 'auditor' AND statut IN ('under_review','field_validation'))
  WITH CHECK (public.get_my_role() = 'auditor' AND statut IN ('field_validation','commission_review'));

CREATE POLICY "certs_update_commission_decision"
  ON public.certifications FOR UPDATE
  USING  (public.get_my_role() IN ('super_admin','cemac_officer') AND statut IN ('commission_review','approved'))
  WITH CHECK (public.get_my_role() IN ('super_admin','cemac_officer') AND statut IN ('approved','rejected','suspended'));

-- ── documents ──
DROP POLICY IF EXISTS "docs_select"        ON public.documents;
DROP POLICY IF EXISTS "docs_insert"        ON public.documents;
DROP POLICY IF EXISTS "docs_select_scoped" ON public.documents;
DROP POLICY IF EXISTS "docs_insert_scoped" ON public.documents;

CREATE POLICY "docs_select_scoped"
  ON public.documents FOR SELECT
  USING (public.can_access_certification(certification_id));

CREATE POLICY "docs_insert_scoped"
  ON public.documents FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND public.can_access_certification(certification_id)
  );

-- ── workflow_events ──
DROP POLICY IF EXISTS "workflow_select" ON public.workflow_events;
DROP POLICY IF EXISTS "workflow_insert" ON public.workflow_events;

CREATE POLICY "workflow_select"
  ON public.workflow_events FOR SELECT
  USING (public.can_access_certification(certification_id));

CREATE POLICY "workflow_insert"
  ON public.workflow_events FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND public.can_access_certification(certification_id)
  );

-- ── produits ──
DROP POLICY IF EXISTS "produits_select_published" ON public.produits;
DROP POLICY IF EXISTS "produits_select_own"       ON public.produits;
DROP POLICY IF EXISTS "produits_insert_own"       ON public.produits;
DROP POLICY IF EXISTS "produits_update_own"       ON public.produits;
DROP POLICY IF EXISTS "produits_delete_own"       ON public.produits;

CREATE POLICY "produits_select_published"
  ON public.produits FOR SELECT USING (is_published = TRUE);
CREATE POLICY "produits_select_own"
  ON public.produits FOR SELECT
  USING (entreprise_id IN (SELECT id FROM public.entreprises WHERE owner_id = auth.uid()));
CREATE POLICY "produits_insert_own"
  ON public.produits FOR INSERT
  WITH CHECK (entreprise_id IN (SELECT id FROM public.entreprises WHERE owner_id = auth.uid()));
CREATE POLICY "produits_update_own"
  ON public.produits FOR UPDATE
  USING (entreprise_id IN (SELECT id FROM public.entreprises WHERE owner_id = auth.uid()));
CREATE POLICY "produits_delete_own"
  ON public.produits FOR DELETE
  USING (entreprise_id IN (SELECT id FROM public.entreprises WHERE owner_id = auth.uid()));

-- ── chambres_commerce ──
DROP POLICY IF EXISTS "chambres_select_all"  ON public.chambres_commerce;
DROP POLICY IF EXISTS "chambres_admin_write" ON public.chambres_commerce;

CREATE POLICY "chambres_select_all"
  ON public.chambres_commerce FOR SELECT USING (true);
CREATE POLICY "chambres_admin_write"
  ON public.chambres_commerce FOR ALL
  USING (public.get_my_role() IN ('super_admin','cemac_officer'));

-- ── corridors ──
DROP POLICY IF EXISTS "corridors_select_all"  ON public.corridors;
DROP POLICY IF EXISTS "corridors_admin_write" ON public.corridors;

CREATE POLICY "corridors_select_all"
  ON public.corridors FOR SELECT USING (true);
CREATE POLICY "corridors_admin_write"
  ON public.corridors FOR ALL
  USING (public.get_my_role() IN ('super_admin','cemac_officer','chamber_agent'));

-- ── logistics_alerts ──
DROP POLICY IF EXISTS "alerts_select_active"    ON public.logistics_alerts;
DROP POLICY IF EXISTS "alerts_admin_select_all" ON public.logistics_alerts;
DROP POLICY IF EXISTS "alerts_admin_write"      ON public.logistics_alerts;

CREATE POLICY "alerts_select_active"
  ON public.logistics_alerts FOR SELECT USING (is_active = true);
CREATE POLICY "alerts_admin_select_all"
  ON public.logistics_alerts FOR SELECT
  USING (public.get_my_role() IN ('super_admin','cemac_officer','chamber_agent'));
CREATE POLICY "alerts_admin_write"
  ON public.logistics_alerts FOR ALL
  USING (public.get_my_role() IN ('super_admin','cemac_officer','chamber_agent'));

-- ============================================================
-- STORAGE BUCKET
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Public read product images"         ON storage.objects;
DROP POLICY IF EXISTS "Owner delete product images"        ON storage.objects;

CREATE POLICY "Authenticated upload product images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Public read product images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'product-images');

CREATE POLICY "Owner delete product images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- SEED — Corridors & Alertes
-- ============================================================

INSERT INTO public.corridors (route, mode, days, status) VALUES
  ('Douala → Bangui',            'Route',    '5-7j',  'Opérationnel'),
  ('Pointe-Noire → N''Djamena',  'Mixte',    '8-10j', 'Opérationnel'),
  ('Libreville → Yaoundé',       'Route',    '3-4j',  'Opérationnel'),
  ('Malabo → Douala',            'Maritime', '1-2j',  'Ralenti'),
  ('Bangui → Yaoundé',           'Route',    '4-6j',  'Opérationnel')
ON CONFLICT DO NOTHING;

INSERT INTO public.logistics_alerts (country, message, type) VALUES
  ('🇹🇩 Tchad',        'Nouveaux frais de transit appliqués depuis le 1er janv. 2026', 'info'),
  ('🇨🇫 Centrafrique', 'Délais rallongés au poste frontalier de Garoua-Boulaï',        'warning'),
  ('🇬🇦 Gabon',        'Mise à jour de la nomenclature tarifaire 2026',                'info')
ON CONFLICT DO NOTHING;
