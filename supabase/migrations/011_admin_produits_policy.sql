-- ============================================================
-- CEMAC INTEGRA — Migration 011 — Admin bypass for produits
-- ============================================================

-- Allow super_admin and cemac_officer to read ALL products
-- (including unpublished ones, e.g. for moderation in admin panel)

DROP POLICY IF EXISTS "produits_select_admin" ON public.produits;
CREATE POLICY "produits_select_admin" ON public.produits
  FOR SELECT USING (
    public.get_my_role() IN ('super_admin', 'cemac_officer', 'chamber_agent', 'auditor')
  );

-- Allow super_admin to update / delete any product
DROP POLICY IF EXISTS "produits_update_admin" ON public.produits;
CREATE POLICY "produits_update_admin" ON public.produits
  FOR UPDATE USING (
    public.get_my_role() IN ('super_admin', 'cemac_officer')
  );

DROP POLICY IF EXISTS "produits_delete_admin" ON public.produits;
CREATE POLICY "produits_delete_admin" ON public.produits
  FOR DELETE USING (
    public.get_my_role() IN ('super_admin', 'cemac_officer')
    OR entreprise_id IN (SELECT id FROM public.entreprises WHERE owner_id = auth.uid())
  );
