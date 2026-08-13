-- Fix public marketplace reads for anonymous users.
-- Role-scoped certification SELECT policies were evaluated for anon and called
-- get_my_role()/get_my_country(), which are revoked from anon (migration 014).

DROP POLICY IF EXISTS "certs_select_own" ON public.certifications;
CREATE POLICY "certs_select_own" ON public.certifications
  FOR SELECT TO authenticated
  USING (
    entreprise_id IN (
      SELECT id FROM public.entreprises WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "certs_select_admin_all" ON public.certifications;
CREATE POLICY "certs_select_admin_all" ON public.certifications
  FOR SELECT TO authenticated
  USING (public.get_my_role() IN ('super_admin', 'cemac_officer'));

DROP POLICY IF EXISTS "certs_select_chamber_scope" ON public.certifications;
CREATE POLICY "certs_select_chamber_scope" ON public.certifications
  FOR SELECT TO authenticated
  USING (
    public.get_my_role() = 'chamber_agent'
    AND EXISTS (
      SELECT 1
      FROM public.entreprises AS e
      WHERE e.id = certifications.entreprise_id
        AND e.pays = public.get_my_country()
    )
  );

DROP POLICY IF EXISTS "certs_select_auditor_scope" ON public.certifications;
CREATE POLICY "certs_select_auditor_scope" ON public.certifications
  FOR SELECT TO authenticated
  USING (
    public.get_my_role() = 'auditor'
    AND statut IN ('under_review', 'field_validation', 'commission_review')
  );
