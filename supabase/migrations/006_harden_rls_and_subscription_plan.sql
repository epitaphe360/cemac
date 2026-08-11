-- ============================================================
-- CEMAC INTEGRA — Migration 006 — Harden RLS & normalize plans
-- ============================================================

-- ------------------------------------------------------------
-- Helper functions
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_my_country()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT country FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.can_access_certification(certification_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  cert_status TEXT;
  cert_country TEXT;
  cert_owner UUID;
  my_role TEXT;
BEGIN
  SELECT c.statut, e.pays, e.owner_id
  INTO cert_status, cert_country, cert_owner
  FROM public.certifications c
  JOIN public.entreprises e ON e.id = c.entreprise_id
  WHERE c.id = certification_uuid;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  my_role := public.get_my_role();

  IF my_role IN ('super_admin', 'cemac_officer') THEN
    RETURN TRUE;
  END IF;

  IF cert_owner = auth.uid() THEN
    RETURN TRUE;
  END IF;

  IF my_role = 'chamber_agent' THEN
    RETURN cert_country IS NOT NULL AND cert_country = public.get_my_country();
  END IF;

  IF my_role = 'auditor' THEN
    RETURN cert_status IN ('under_review', 'field_validation', 'commission_review');
  END IF;

  RETURN FALSE;
END;
$$;

-- ------------------------------------------------------------
-- Certifications: replace overly broad agent policies
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "certs_select_approved" ON public.certifications;
DROP POLICY IF EXISTS "certs_select_agent" ON public.certifications;
DROP POLICY IF EXISTS "certs_update_own" ON public.certifications;

CREATE POLICY "certs_select_public_verification" ON public.certifications
  FOR SELECT USING (statut IN ('approved', 'expired', 'suspended'));

CREATE POLICY "certs_select_admin_all" ON public.certifications
  FOR SELECT USING (public.get_my_role() IN ('super_admin', 'cemac_officer'));

CREATE POLICY "certs_select_chamber_scope" ON public.certifications
  FOR SELECT USING (
    public.get_my_role() = 'chamber_agent'
    AND EXISTS (
      SELECT 1
      FROM public.entreprises e
      WHERE e.id = certifications.entreprise_id
        AND e.pays = public.get_my_country()
    )
  );

CREATE POLICY "certs_select_auditor_scope" ON public.certifications
  FOR SELECT USING (
    public.get_my_role() = 'auditor'
    AND statut IN ('under_review', 'field_validation', 'commission_review')
  );

CREATE POLICY "certs_update_owner_draft" ON public.certifications
  FOR UPDATE USING (
    entreprise_id IN (SELECT id FROM public.entreprises WHERE owner_id = auth.uid())
    AND statut = 'draft'
  )
  WITH CHECK (
    entreprise_id IN (SELECT id FROM public.entreprises WHERE owner_id = auth.uid())
    AND statut IN ('draft', 'submitted')
  );

CREATE POLICY "certs_update_chamber_takeover" ON public.certifications
  FOR UPDATE USING (
    public.get_my_role() = 'chamber_agent'
    AND statut = 'submitted'
    AND EXISTS (
      SELECT 1
      FROM public.entreprises e
      WHERE e.id = certifications.entreprise_id
        AND e.pays = public.get_my_country()
    )
  )
  WITH CHECK (
    public.get_my_role() = 'chamber_agent'
    AND statut = 'under_review'
    AND EXISTS (
      SELECT 1
      FROM public.entreprises e
      WHERE e.id = certifications.entreprise_id
        AND e.pays = public.get_my_country()
    )
  );

CREATE POLICY "certs_update_auditor_workflow" ON public.certifications
  FOR UPDATE USING (
    public.get_my_role() = 'auditor'
    AND statut IN ('under_review', 'field_validation')
  )
  WITH CHECK (
    public.get_my_role() = 'auditor'
    AND statut IN ('field_validation', 'commission_review')
  );

CREATE POLICY "certs_update_commission_decision" ON public.certifications
  FOR UPDATE USING (
    public.get_my_role() IN ('super_admin', 'cemac_officer')
    AND statut IN ('commission_review', 'approved')
  )
  WITH CHECK (
    public.get_my_role() IN ('super_admin', 'cemac_officer')
    AND statut IN ('approved', 'rejected', 'suspended')
  );

-- ------------------------------------------------------------
-- Documents: let reviewers upload, but only within their scope
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "docs_select" ON public.documents;
DROP POLICY IF EXISTS "docs_insert" ON public.documents;

CREATE POLICY "docs_select_scoped" ON public.documents
  FOR SELECT USING (public.can_access_certification(certification_id));

CREATE POLICY "docs_insert_scoped" ON public.documents
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid()
    AND public.get_my_role() IN ('super_admin', 'cemac_officer', 'chamber_agent', 'company_admin', 'auditor')
    AND public.can_access_certification(certification_id)
  );

-- ------------------------------------------------------------
-- Workflow events: keep audit trail aligned with accessible dossiers
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "workflow_select" ON public.workflow_events;
DROP POLICY IF EXISTS "workflow_insert" ON public.workflow_events;

CREATE POLICY "workflow_select_scoped" ON public.workflow_events
  FOR SELECT USING (public.can_access_certification(certification_id));

CREATE POLICY "workflow_insert_scoped" ON public.workflow_events
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND public.get_my_role() IN ('super_admin', 'cemac_officer', 'chamber_agent', 'company_admin', 'auditor')
    AND public.can_access_certification(certification_id)
  );
