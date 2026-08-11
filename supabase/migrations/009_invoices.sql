-- ============================================================
-- 009 — Table factures (invoices) avec taxes dynamiques par pays CEMAC
-- ============================================================

CREATE TABLE IF NOT EXISTS public.invoices (
  id              uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number  text          NOT NULL UNIQUE,
  user_id         uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id      uuid          REFERENCES public.entreprises(id) ON DELETE SET NULL,
  plan_name       text          NOT NULL,
  amount_ht       numeric(12,2) NOT NULL DEFAULT 0,
  tax_rate        numeric(5,2)  NOT NULL DEFAULT 0,
  tax_amount      numeric(12,2) NOT NULL DEFAULT 0,
  amount_ttc      numeric(12,2) NOT NULL DEFAULT 0,
  currency        text          NOT NULL DEFAULT 'XAF',
  country         text          NOT NULL DEFAULT 'CM',
  payment_method  text          NOT NULL DEFAULT 'bank_transfer',
  payment_ref     text,
  status          text          NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','paid','cancelled')),
  billing_period  text          NOT NULL DEFAULT 'monthly'
                                CHECK (billing_period IN ('monthly','yearly')),
  issued_at       timestamptz   NOT NULL DEFAULT now(),
  due_at          timestamptz   NOT NULL DEFAULT (now() + interval '30 days'),
  paid_at         timestamptz,
  notes           text,
  pdf_url         text,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invoices_user_id_idx  ON public.invoices (user_id);
CREATE INDEX IF NOT EXISTS invoices_status_idx   ON public.invoices (status);
CREATE INDEX IF NOT EXISTS invoices_country_idx  ON public.invoices (country);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_invoices_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS
'BEGIN NEW.updated_at = now(); RETURN NEW; END;';

DROP TRIGGER IF EXISTS set_invoices_updated_at ON public.invoices;
CREATE TRIGGER set_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.handle_invoices_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Utilisateur voit ses propres factures ; super_admin voit tout
DROP POLICY IF EXISTS "invoices_select" ON public.invoices;
CREATE POLICY "invoices_select"
  ON public.invoices FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Seul super_admin peut créer des factures
DROP POLICY IF EXISTS "invoices_insert_admin" ON public.invoices;
CREATE POLICY "invoices_insert_admin"
  ON public.invoices FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Seul super_admin peut modifier (marquer payé, annuler)
DROP POLICY IF EXISTS "invoices_update_admin" ON public.invoices;
CREATE POLICY "invoices_update_admin"
  ON public.invoices FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );
