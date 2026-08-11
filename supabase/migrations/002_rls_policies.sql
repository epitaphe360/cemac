-- ============================================================
-- CEMAC INTEGRA — Migration 002 — Row Level Security (RLS)
-- ============================================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entreprises      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produits         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chambres_commerce ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_entreprise_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT id FROM public.entreprises WHERE owner_id = auth.uid() LIMIT 1;
$$;

-- ============================================================
-- POLICIES — profiles
-- ============================================================

-- Chaque utilisateur voit son propre profil
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());

-- Les admins voient tous les profils
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (public.get_my_role() IN ('super_admin', 'cemac_officer', 'chamber_agent', 'auditor'));

-- Chaque utilisateur peut modifier son propre profil
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- ============================================================
-- POLICIES — entreprises
-- ============================================================

-- L'entreprise est visible par son propriétaire
DROP POLICY IF EXISTS "entreprises_select_own" ON public.entreprises;
CREATE POLICY "entreprises_select_own" ON public.entreprises
  FOR SELECT USING (owner_id = auth.uid());

-- Lecture publique des entreprises vérifiées
DROP POLICY IF EXISTS "entreprises_select_public" ON public.entreprises;
CREATE POLICY "entreprises_select_public" ON public.entreprises
  FOR SELECT USING (is_verified = TRUE);

-- Les agents et officiers voient toutes les entreprises
DROP POLICY IF EXISTS "entreprises_select_agents" ON public.entreprises;
CREATE POLICY "entreprises_select_agents" ON public.entreprises
  FOR SELECT USING (public.get_my_role() IN ('super_admin', 'cemac_officer', 'chamber_agent', 'auditor'));

-- Création : uniquement company_admin
DROP POLICY IF EXISTS "entreprises_insert" ON public.entreprises;
CREATE POLICY "entreprises_insert" ON public.entreprises
  FOR INSERT WITH CHECK (owner_id = auth.uid() AND public.get_my_role() = 'company_admin');

-- Modification : propriétaire seulement
DROP POLICY IF EXISTS "entreprises_update_own" ON public.entreprises;
CREATE POLICY "entreprises_update_own" ON public.entreprises
  FOR UPDATE USING (owner_id = auth.uid());

-- Modification par admins
DROP POLICY IF EXISTS "entreprises_update_admin" ON public.entreprises;
CREATE POLICY "entreprises_update_admin" ON public.entreprises
  FOR UPDATE USING (public.get_my_role() IN ('super_admin', 'cemac_officer'));

-- ============================================================
-- POLICIES — certifications
-- ============================================================

-- L'entreprise voit ses propres certifications
DROP POLICY IF EXISTS "certs_select_own" ON public.certifications;
CREATE POLICY "certs_select_own" ON public.certifications
  FOR SELECT USING (
    entreprise_id IN (SELECT id FROM public.entreprises WHERE owner_id = auth.uid())
  );

-- Lecture publique des certifications approuvées
DROP POLICY IF EXISTS "certs_select_approved" ON public.certifications;
CREATE POLICY "certs_select_approved" ON public.certifications
  FOR SELECT USING (statut = 'approved');

-- Les agents voient les certifications de leur chambre
DROP POLICY IF EXISTS "certs_select_agent" ON public.certifications;
CREATE POLICY "certs_select_agent" ON public.certifications
  FOR SELECT USING (
    public.get_my_role() IN ('super_admin', 'cemac_officer', 'chamber_agent', 'auditor')
  );

-- Création par company_admin
DROP POLICY IF EXISTS "certs_insert" ON public.certifications;
CREATE POLICY "certs_insert" ON public.certifications
  FOR INSERT WITH CHECK (
    entreprise_id IN (SELECT id FROM public.entreprises WHERE owner_id = auth.uid())
  );

-- Modification : propriétaire (brouillon uniquement) + agents
DROP POLICY IF EXISTS "certs_update_own" ON public.certifications;
CREATE POLICY "certs_update_own" ON public.certifications
  FOR UPDATE USING (
    (entreprise_id IN (SELECT id FROM public.entreprises WHERE owner_id = auth.uid())
      AND statut = 'draft')
    OR public.get_my_role() IN ('super_admin', 'cemac_officer', 'chamber_agent', 'auditor')
  );

-- ============================================================
-- POLICIES — documents
-- ============================================================

DROP POLICY IF EXISTS "docs_select" ON public.documents;
CREATE POLICY "docs_select" ON public.documents
  FOR SELECT USING (
    certification_id IN (
      SELECT id FROM public.certifications
      WHERE entreprise_id IN (SELECT id FROM public.entreprises WHERE owner_id = auth.uid())
    )
    OR public.get_my_role() IN ('super_admin', 'cemac_officer', 'chamber_agent', 'auditor')
  );

DROP POLICY IF EXISTS "docs_insert" ON public.documents;
CREATE POLICY "docs_insert" ON public.documents
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid()
    AND certification_id IN (
      SELECT c.id FROM public.certifications c
      JOIN public.entreprises e ON e.id = c.entreprise_id
      WHERE e.owner_id = auth.uid()
    )
  );

-- ============================================================
-- POLICIES — workflow_events
-- ============================================================

DROP POLICY IF EXISTS "workflow_select" ON public.workflow_events;
CREATE POLICY "workflow_select" ON public.workflow_events
  FOR SELECT USING (
    certification_id IN (
      SELECT id FROM public.certifications
      WHERE entreprise_id IN (SELECT id FROM public.entreprises WHERE owner_id = auth.uid())
    )
    OR public.get_my_role() IN ('super_admin', 'cemac_officer', 'chamber_agent', 'auditor')
  );

DROP POLICY IF EXISTS "workflow_insert" ON public.workflow_events;
CREATE POLICY "workflow_insert" ON public.workflow_events
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND public.get_my_role() IN ('super_admin', 'cemac_officer', 'chamber_agent', 'company_admin', 'auditor')
  );

-- ============================================================
-- POLICIES — produits (marketplace)
-- ============================================================

-- Lecture publique des produits publiés
DROP POLICY IF EXISTS "produits_select_public" ON public.produits;
CREATE POLICY "produits_select_public" ON public.produits
  FOR SELECT USING (is_published = TRUE);

-- L'entreprise voit ses propres produits
DROP POLICY IF EXISTS "produits_select_own" ON public.produits;
CREATE POLICY "produits_select_own" ON public.produits
  FOR SELECT USING (
    entreprise_id IN (SELECT id FROM public.entreprises WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "produits_insert" ON public.produits;
CREATE POLICY "produits_insert" ON public.produits
  FOR INSERT WITH CHECK (
    entreprise_id IN (SELECT id FROM public.entreprises WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "produits_update_own" ON public.produits;
CREATE POLICY "produits_update_own" ON public.produits
  FOR UPDATE USING (
    entreprise_id IN (SELECT id FROM public.entreprises WHERE owner_id = auth.uid())
  );

-- ============================================================
-- POLICIES — chambres_commerce (lecture publique)
-- ============================================================

DROP POLICY IF EXISTS "chambres_select_all" ON public.chambres_commerce;
CREATE POLICY "chambres_select_all" ON public.chambres_commerce
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "chambres_insert_admin" ON public.chambres_commerce;
CREATE POLICY "chambres_insert_admin" ON public.chambres_commerce
  FOR INSERT WITH CHECK (public.get_my_role() = 'super_admin');

-- ============================================================
-- DONNÉES INITIALES — Chambres de commerce CEMAC
-- ============================================================

INSERT INTO public.chambres_commerce (nom, pays, ville, email) VALUES
  ('Chambre de Commerce, d''Industrie, des Mines et de l''Artisanat', 'CM', 'Yaoundé', 'ccima@ccima.net'),
  ('Chambre de Commerce de Douala', 'CM', 'Douala', NULL),
  ('Chambre de Commerce, d''Agriculture, d''Industrie et des Mines', 'GA', 'Libreville', NULL),
  ('Chambre de Commerce, d''Industrie, d''Agriculture et des Métiers', 'CG', 'Brazzaville', NULL),
  ('Chambre de Commerce du Tchad', 'TD', 'N''Djamena', NULL),
  ('Chambre de Commerce de Centrafrique', 'CF', 'Bangui', NULL),
  ('Chambre de Commerce de Guinée Équatoriale', 'GQ', 'Malabo', NULL)
ON CONFLICT DO NOTHING;
