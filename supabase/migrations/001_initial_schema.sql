-- ============================================================
-- CEMAC INTEGRA — Migration 001 — Schéma initial
-- ============================================================

-- Extensions PostgreSQL nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- SCHÉMA PUBLIC — Tables core
-- ============================================================

-- Table profiles (extension de auth.users)
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
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table chambres_commerce
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

-- Table entreprises
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

-- Séquence pour numéro de dossier (doit exister avant la table certifications)
CREATE SEQUENCE IF NOT EXISTS cert_seq START 1;

-- Table certifications
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

-- Table documents
CREATE TABLE IF NOT EXISTS public.documents (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  certification_id UUID NOT NULL REFERENCES public.certifications(id) ON DELETE CASCADE,
  nom_fichier      TEXT NOT NULL,
  type_document    TEXT NOT NULL CHECK (type_document IN (
                     'statuts', 'registre_commerce', 'bilan', 'factures',
                     'rapport_audit', 'photos_produit', 'certificat_qualite',
                     'autre'
                   )),
  url              TEXT NOT NULL,
  taille           BIGINT,
  mime_type        TEXT,
  uploaded_by      UUID NOT NULL REFERENCES public.profiles(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table workflow_events (audit trail immuable)
CREATE TABLE IF NOT EXISTS public.workflow_events (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  certification_id   UUID NOT NULL REFERENCES public.certifications(id) ON DELETE CASCADE,
  statut_precedent   TEXT,
  statut_nouveau     TEXT NOT NULL,
  commentaire        TEXT,
  created_by         UUID NOT NULL REFERENCES public.profiles(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table produits (Marketplace)
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

-- ============================================================
-- INDEX DE PERFORMANCE
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
-- TRIGGERS — updated_at automatique
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

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

-- ============================================================
-- TRIGGER — Créer profil automatiquement à l'inscription
-- ============================================================

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

CREATE OR REPLACE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
