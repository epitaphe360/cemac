-- CEMAC INTEGRA - Stripe state and transactional webhook idempotency.

BEGIN;

ALTER TABLE public.entreprises
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

CREATE UNIQUE INDEX IF NOT EXISTS entreprises_stripe_customer_id_uidx
  ON public.entreprises (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS entreprises_stripe_subscription_id_uidx
  ON public.entreprises (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id               text PRIMARY KEY,
  event_type             text NOT NULL,
  stripe_object_id       text,
  user_id                uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  entreprise_id          uuid REFERENCES public.entreprises(id) ON DELETE SET NULL,
  processed_at           timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.stripe_webhook_events IS
  'Minimal Stripe delivery ledger. No payment payloads or secrets are retained.';

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.stripe_webhook_events FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.stripe_webhook_events TO service_role;

CREATE OR REPLACE FUNCTION public.process_stripe_event(
  p_event_id text,
  p_event_type text,
  p_stripe_object_id text,
  p_user_id uuid,
  p_entreprise_id uuid,
  p_plan text,
  p_stripe_customer_id text,
  p_stripe_subscription_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  inserted_event_id text;
  affected_count integer;
  notification_title text;
  notification_body text;
BEGIN
  IF p_event_id IS NULL OR char_length(p_event_id) > 255 THEN
    RAISE EXCEPTION 'invalid Stripe event id' USING ERRCODE = '22023';
  END IF;

  IF p_event_type NOT IN (
    'checkout.session.completed',
    'customer.subscription.deleted'
  ) THEN
    RAISE EXCEPTION 'unsupported Stripe event type' USING ERRCODE = '22023';
  END IF;

  IF p_user_id IS NULL OR p_entreprise_id IS NULL THEN
    RAISE EXCEPTION 'Stripe metadata is incomplete' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.stripe_webhook_events (
    event_id,
    event_type,
    stripe_object_id,
    user_id,
    entreprise_id
  )
  VALUES (
    p_event_id,
    p_event_type,
    p_stripe_object_id,
    p_user_id,
    p_entreprise_id
  )
  ON CONFLICT (event_id) DO NOTHING
  RETURNING event_id INTO inserted_event_id;

  -- A duplicate Stripe delivery is acknowledged without replaying side effects.
  IF inserted_event_id IS NULL THEN
    RETURN false;
  END IF;

  IF p_event_type = 'checkout.session.completed' THEN
    IF p_plan NOT IN ('sme', 'enterprise') THEN
      RAISE EXCEPTION 'invalid paid subscription plan' USING ERRCODE = '22023';
    END IF;

    UPDATE public.entreprises
    SET subscription_plan = p_plan,
        stripe_customer_id = NULLIF(p_stripe_customer_id, ''),
        stripe_subscription_id = NULLIF(p_stripe_subscription_id, ''),
        updated_at = now()
    WHERE id = p_entreprise_id
      AND owner_id = p_user_id;

    GET DIAGNOSTICS affected_count = ROW_COUNT;
    notification_title := 'Paiement confirmé';
    notification_body := format(
      'Votre abonnement %s est maintenant actif.',
      upper(p_plan)
    );
  ELSE
    UPDATE public.entreprises
    SET subscription_plan = 'free',
        stripe_subscription_id = NULL,
        updated_at = now()
    WHERE id = p_entreprise_id
      AND owner_id = p_user_id
      AND (
        p_stripe_subscription_id IS NULL
        OR stripe_subscription_id = p_stripe_subscription_id
      );

    GET DIAGNOSTICS affected_count = ROW_COUNT;
    notification_title := 'Abonnement résilié';
    notification_body := 'Votre abonnement a été résilié et votre compte est revenu au plan gratuit.';
  END IF;

  IF affected_count <> 1 THEN
    -- Raising rolls back the ledger insert too, allowing Stripe to retry.
    RAISE EXCEPTION 'Stripe event target did not resolve to exactly one entreprise'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, message)
  VALUES (
    p_user_id,
    CASE
      WHEN p_event_type = 'checkout.session.completed' THEN 'payment_confirmed'
      ELSE 'system'
    END,
    notification_title,
    notification_body,
    notification_body
  );

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.process_stripe_event(
  text, text, text, uuid, uuid, text, text, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_stripe_event(
  text, text, text, uuid, uuid, text, text, text
) TO service_role;

COMMIT;
