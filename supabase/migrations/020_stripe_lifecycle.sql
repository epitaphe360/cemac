-- CEMAC INTEGRA - Stripe subscription lifecycle and invoice correlation.
-- Forward-only: migrations 001-019 are immutable.

BEGIN;

-- Refuse to guess around the legacy billing model. Migration 009 intentionally
-- left payment_method unconstrained, while status and billing_period are closed.
DO $$
DECLARE
  status_definition text;
  period_definition text;
  payment_method_type text;
BEGIN
  IF to_regclass('public.invoices') IS NULL THEN
    RAISE EXCEPTION 'public.invoices is required before Stripe lifecycle migration';
  END IF;

  SELECT format_type(a.atttypid, a.atttypmod)
  INTO payment_method_type
  FROM pg_attribute AS a
  WHERE a.attrelid = 'public.invoices'::regclass
    AND a.attname = 'payment_method'
    AND NOT a.attisdropped;
  IF payment_method_type IS DISTINCT FROM 'text' THEN
    RAISE EXCEPTION 'invoices.payment_method must remain text (found %)', payment_method_type;
  END IF;

  SELECT pg_get_constraintdef(c.oid)
  INTO status_definition
  FROM pg_constraint AS c
  WHERE c.conrelid = 'public.invoices'::regclass
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) LIKE '%status%';
  SELECT pg_get_constraintdef(c.oid)
  INTO period_definition
  FROM pg_constraint AS c
  WHERE c.conrelid = 'public.invoices'::regclass
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) LIKE '%billing_period%';

  IF status_definition IS NULL
     OR status_definition NOT LIKE '%pending%'
     OR status_definition NOT LIKE '%paid%'
     OR status_definition NOT LIKE '%cancelled%' THEN
    RAISE EXCEPTION 'unexpected invoices.status constraint: %', status_definition;
  END IF;
  IF period_definition IS NULL
     OR period_definition NOT LIKE '%monthly%'
     OR period_definition NOT LIKE '%yearly%' THEN
    RAISE EXCEPTION 'unexpected invoices.billing_period constraint: %', period_definition;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.invoices
    WHERE payment_method NOT IN ('bank_transfer', 'mtn_momo', 'orange_money', 'stripe')
  ) THEN
    RAISE EXCEPTION 'unsupported legacy invoices.payment_method value';
  END IF;
END;
$$;

ALTER TABLE public.entreprises
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS subscription_period text,
  ADD COLUMN IF NOT EXISTS subscription_current_period_start timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription_canceled_at timestamptz;

ALTER TABLE public.entreprises
  DROP CONSTRAINT IF EXISTS entreprises_subscription_status_check,
  DROP CONSTRAINT IF EXISTS entreprises_subscription_period_check;
ALTER TABLE public.entreprises
  ADD CONSTRAINT entreprises_subscription_status_check CHECK (
    subscription_status IN (
      'inactive', 'incomplete', 'incomplete_expired', 'trialing', 'active',
      'past_due', 'canceled', 'unpaid', 'paused'
    )
  ),
  ADD CONSTRAINT entreprises_subscription_period_check CHECK (
    subscription_period IS NULL OR subscription_period IN ('monthly', 'yearly')
  ),
  ADD CONSTRAINT entreprises_subscription_period_dates_check CHECK (
    subscription_current_period_start IS NULL
    OR subscription_current_period_end IS NULL
    OR subscription_current_period_end >= subscription_current_period_start
  );

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS stripe_invoice_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS hosted_invoice_url text,
  ADD COLUMN IF NOT EXISTS stripe_invoice_pdf_url text;

CREATE UNIQUE INDEX IF NOT EXISTS invoices_stripe_invoice_id_uidx
  ON public.invoices (stripe_invoice_id)
  WHERE stripe_invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS invoices_stripe_subscription_id_idx
  ON public.invoices (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

ALTER TABLE public.invoices
  DROP CONSTRAINT IF EXISTS invoices_status_check,
  DROP CONSTRAINT IF EXISTS invoices_payment_method_check;
ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_status_check
    CHECK (status IN ('pending', 'paid', 'cancelled', 'failed')),
  ADD CONSTRAINT invoices_payment_method_check
    CHECK (payment_method IN ('bank_transfer', 'mtn_momo', 'orange_money', 'stripe'));

-- Browser-originated writes cannot alter any payment authority field. Trusted
-- SECURITY DEFINER functions and service-role operations do not execute as an
-- authenticated PostgREST caller and remain able to process Stripe events.
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

  IF TG_OP = 'INSERT' THEN
    IF NEW.subscription_plan IS DISTINCT FROM 'free'
       OR NEW.stripe_customer_id IS NOT NULL
       OR NEW.stripe_subscription_id IS NOT NULL
       OR NEW.subscription_status IS DISTINCT FROM 'inactive'
       OR NEW.subscription_period IS NOT NULL
       OR NEW.subscription_current_period_start IS NOT NULL
       OR NEW.subscription_current_period_end IS NOT NULL
       OR NEW.subscription_cancel_at_period_end
       OR NEW.subscription_canceled_at IS NOT NULL
    THEN
      RAISE EXCEPTION 'subscription fields can only be initialized by a trusted backend'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  caller_role := public.get_my_role();
  IF current_user <> 'postgres'
     AND (
       NEW.subscription_plan IS DISTINCT FROM OLD.subscription_plan
       OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
       OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id
       OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
       OR NEW.subscription_period IS DISTINCT FROM OLD.subscription_period
       OR NEW.subscription_current_period_start IS DISTINCT FROM OLD.subscription_current_period_start
       OR NEW.subscription_current_period_end IS DISTINCT FROM OLD.subscription_current_period_end
       OR NEW.subscription_cancel_at_period_end IS DISTINCT FROM OLD.subscription_cancel_at_period_end
       OR NEW.subscription_canceled_at IS DISTINCT FROM OLD.subscription_canceled_at
     )
  THEN
    RAISE EXCEPTION 'subscription fields can only be changed by a trusted backend'
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
  BEFORE INSERT OR UPDATE ON public.entreprises
  FOR EACH ROW EXECUTE FUNCTION public.protect_entreprise_security_fields();

DROP FUNCTION IF EXISTS public.process_stripe_event(
  text, text, text, uuid, uuid, text, text, text
);

CREATE FUNCTION public.process_stripe_event(
  p_event_id text,
  p_event_type text,
  p_stripe_object_id text,
  p_user_id uuid,
  p_entreprise_id uuid,
  p_plan text DEFAULT NULL,
  p_billing_period text DEFAULT NULL,
  p_subscription_status text DEFAULT NULL,
  p_stripe_customer_id text DEFAULT NULL,
  p_stripe_subscription_id text DEFAULT NULL,
  p_period_start timestamptz DEFAULT NULL,
  p_period_end timestamptz DEFAULT NULL,
  p_cancel_at_period_end boolean DEFAULT false,
  p_canceled_at timestamptz DEFAULT NULL,
  p_stripe_invoice_id text DEFAULT NULL,
  p_invoice_number text DEFAULT NULL,
  p_invoice_subtotal numeric DEFAULT NULL,
  p_invoice_tax numeric DEFAULT NULL,
  p_invoice_total numeric DEFAULT NULL,
  p_currency text DEFAULT NULL,
  p_payment_intent_id text DEFAULT NULL,
  p_hosted_invoice_url text DEFAULT NULL,
  p_invoice_pdf_url text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  inserted_event_id text;
  target public.entreprises%ROWTYPE;
  notification_title text;
  notification_body text;
  invoice_status text;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'service_role required' USING ERRCODE = '42501';
  END IF;
  IF p_event_id IS NULL
     OR p_event_id !~ '^evt_[A-Za-z0-9]{6,250}$'
     OR p_event_type NOT IN (
       'checkout.session.completed',
       'customer.subscription.created',
       'customer.subscription.updated',
       'customer.subscription.deleted',
       'invoice.paid',
       'invoice.payment_failed'
     )
     OR p_stripe_object_id IS NULL
     OR char_length(p_stripe_object_id) > 255
     OR p_user_id IS NULL
     OR p_entreprise_id IS NULL THEN
    RAISE EXCEPTION 'invalid Stripe event envelope' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO target
  FROM public.entreprises
  WHERE id = p_entreprise_id AND owner_id = p_user_id
  FOR UPDATE;
  IF target.id IS NULL THEN
    RAISE EXCEPTION 'Stripe event target does not match an entreprise owner'
      USING ERRCODE = 'P0001';
  END IF;
  IF p_stripe_customer_id IS NOT NULL
     AND target.stripe_customer_id IS NOT NULL
     AND target.stripe_customer_id <> p_stripe_customer_id THEN
    RAISE EXCEPTION 'Stripe customer does not match entreprise'
      USING ERRCODE = 'P0001';
  END IF;
  IF p_stripe_subscription_id IS NOT NULL
     AND target.stripe_subscription_id IS NOT NULL
     AND target.stripe_subscription_id <> p_stripe_subscription_id
     AND p_event_type <> 'checkout.session.completed' THEN
    RAISE EXCEPTION 'Stripe subscription does not match entreprise'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.stripe_webhook_events (
    event_id, event_type, stripe_object_id, user_id, entreprise_id
  ) VALUES (
    p_event_id, p_event_type, p_stripe_object_id, p_user_id, p_entreprise_id
  )
  ON CONFLICT (event_id) DO NOTHING
  RETURNING event_id INTO inserted_event_id;
  IF inserted_event_id IS NULL THEN
    RETURN false;
  END IF;

  IF p_event_type IN (
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated'
  ) THEN
    IF p_plan IS NULL
       OR p_plan NOT IN ('sme', 'enterprise')
       OR p_billing_period IS NULL
       OR p_billing_period NOT IN ('monthly', 'yearly')
       OR p_subscription_status IS NULL
       OR p_subscription_status NOT IN (
         'incomplete', 'incomplete_expired', 'trialing', 'active',
         'past_due', 'canceled', 'unpaid', 'paused'
       )
       OR p_stripe_customer_id IS NULL
       OR p_stripe_customer_id !~ '^cus_[A-Za-z0-9]+$'
       OR p_stripe_subscription_id IS NULL
       OR p_stripe_subscription_id !~ '^sub_[A-Za-z0-9]+$' THEN
      RAISE EXCEPTION 'invalid Stripe subscription state' USING ERRCODE = '22023';
    END IF;

    UPDATE public.entreprises
    SET subscription_plan = CASE
          WHEN p_subscription_status IN ('active', 'trialing', 'past_due') THEN p_plan
          ELSE subscription_plan
        END,
        subscription_status = p_subscription_status,
        subscription_period = p_billing_period,
        stripe_customer_id = p_stripe_customer_id,
        stripe_subscription_id = p_stripe_subscription_id,
        subscription_current_period_start = p_period_start,
        subscription_current_period_end = p_period_end,
        subscription_cancel_at_period_end = COALESCE(p_cancel_at_period_end, false),
        subscription_canceled_at = p_canceled_at,
        updated_at = now()
    WHERE id = target.id;
    notification_title := CASE
      WHEN p_event_type = 'checkout.session.completed' THEN 'Paiement confirmé'
      ELSE 'Abonnement mis à jour'
    END;
    notification_body := format(
      'Votre abonnement %s (%s) est %s.',
      upper(p_plan),
      CASE WHEN p_billing_period = 'yearly' THEN 'annuel' ELSE 'mensuel' END,
      p_subscription_status
    );
  ELSIF p_event_type = 'customer.subscription.deleted' THEN
    IF p_stripe_subscription_id IS NULL
       OR p_stripe_subscription_id !~ '^sub_[A-Za-z0-9]+$' THEN
      RAISE EXCEPTION 'invalid deleted subscription id' USING ERRCODE = '22023';
    END IF;
    UPDATE public.entreprises
    SET subscription_plan = 'free',
        subscription_status = 'canceled',
        stripe_subscription_id = NULL,
        subscription_cancel_at_period_end = false,
        subscription_canceled_at = COALESCE(p_canceled_at, now()),
        updated_at = now()
    WHERE id = target.id;
    notification_title := 'Abonnement résilié';
    notification_body := 'Votre abonnement Stripe a été résilié et votre compte est revenu au plan gratuit.';
  ELSE
    IF p_plan IS NULL
       OR p_plan NOT IN ('sme', 'enterprise')
       OR p_billing_period IS NULL
       OR p_billing_period NOT IN ('monthly', 'yearly')
       OR p_stripe_invoice_id IS NULL
       OR p_stripe_invoice_id !~ '^in_[A-Za-z0-9]+$'
       OR p_invoice_total IS NULL
       OR p_invoice_total < 0
       OR p_invoice_subtotal IS NULL
       OR p_invoice_subtotal < 0
       OR p_invoice_tax IS NULL
       OR p_invoice_tax < 0
       OR p_currency IS NULL
       OR p_currency !~ '^[A-Z]{3}$' THEN
      RAISE EXCEPTION 'invalid Stripe invoice state' USING ERRCODE = '22023';
    END IF;
    invoice_status := CASE WHEN p_event_type = 'invoice.paid' THEN 'paid' ELSE 'failed' END;

    INSERT INTO public.invoices (
      invoice_number, user_id, company_id, plan_name, amount_ht, tax_rate,
      tax_amount, amount_ttc, currency, country, payment_method, payment_ref,
      status, billing_period, issued_at, due_at, paid_at, stripe_invoice_id,
      stripe_subscription_id, stripe_payment_intent_id, hosted_invoice_url,
      stripe_invoice_pdf_url
    ) VALUES (
      COALESCE(NULLIF(p_invoice_number, ''), p_stripe_invoice_id),
      target.owner_id, target.id, p_plan, p_invoice_subtotal,
      CASE WHEN p_invoice_subtotal > 0
        THEN round((p_invoice_tax / p_invoice_subtotal) * 100, 2) ELSE 0 END,
      p_invoice_tax, p_invoice_total, p_currency, target.pays, 'stripe',
      p_payment_intent_id, invoice_status, p_billing_period,
      COALESCE(p_period_start, now()), COALESCE(p_period_end, now()),
      CASE WHEN invoice_status = 'paid' THEN now() ELSE NULL END,
      p_stripe_invoice_id, p_stripe_subscription_id, p_payment_intent_id,
      p_hosted_invoice_url, p_invoice_pdf_url
    )
    ON CONFLICT (stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL DO UPDATE
    SET invoice_number = EXCLUDED.invoice_number,
        status = EXCLUDED.status,
        amount_ht = EXCLUDED.amount_ht,
        tax_rate = EXCLUDED.tax_rate,
        tax_amount = EXCLUDED.tax_amount,
        amount_ttc = EXCLUDED.amount_ttc,
        paid_at = EXCLUDED.paid_at,
        payment_ref = EXCLUDED.payment_ref,
        hosted_invoice_url = EXCLUDED.hosted_invoice_url,
        stripe_invoice_pdf_url = EXCLUDED.stripe_invoice_pdf_url,
        updated_at = now();

    IF p_event_type = 'invoice.paid' THEN
      UPDATE public.entreprises
      SET subscription_plan = p_plan,
          subscription_status = 'active',
          updated_at = now()
      WHERE id = target.id;
      notification_title := 'Facture payée';
      notification_body := format('La facture %s a été payée.', COALESCE(p_invoice_number, p_stripe_invoice_id));
    ELSE
      UPDATE public.entreprises
      SET subscription_status = 'past_due', updated_at = now()
      WHERE id = target.id;
      notification_title := 'Échec de paiement';
      notification_body := format(
        'Le paiement de la facture %s a échoué. Mettez à jour votre moyen de paiement.',
        COALESCE(p_invoice_number, p_stripe_invoice_id)
      );
    END IF;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, message)
  VALUES (
    target.owner_id,
    CASE
      WHEN p_event_type IN ('checkout.session.completed', 'invoice.paid') THEN 'payment_confirmed'
      WHEN p_event_type = 'invoice.payment_failed' THEN 'payment_failed'
      ELSE 'subscription'
    END,
    notification_title, notification_body, notification_body
  );
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.process_stripe_event(
  text, text, text, uuid, uuid, text, text, text, text, text, timestamptz,
  timestamptz, boolean, timestamptz, text, text, numeric, numeric, numeric,
  text, text, text, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_stripe_event(
  text, text, text, uuid, uuid, text, text, text, text, text, timestamptz,
  timestamptz, boolean, timestamptz, text, text, numeric, numeric, numeric,
  text, text, text, text
) TO service_role;

COMMENT ON COLUMN public.entreprises.subscription_status IS
  'Stripe lifecycle status; protected from browser-originated writes.';
COMMENT ON COLUMN public.invoices.stripe_invoice_id IS
  'Unique Stripe invoice correlation id; no Stripe payload is retained.';

COMMIT;
