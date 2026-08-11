import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

type PaidPlan = 'sme' | 'enterprise'

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? ''
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
const paymentsEnabled = Deno.env.get('PAYMENTS_ENABLED') === 'true'
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-04-10',
  httpClient: Stripe.createFetchHttpClient(),
})
const admin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false, autoRefreshToken: false } },
)

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function normalizePlan(value: string | undefined): PaidPlan | null {
  if (value === 'sme' || value === 'pro') return 'sme'
  if (value === 'enterprise') return 'enterprise'
  return null
}

function objectId(value: string | { id: string } | null): string | null {
  return typeof value === 'string' ? value : value?.id ?? null
}

function validUuid(value: string | undefined): value is string {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  )
}

async function processEvent(params: {
  eventId: string
  eventType: 'checkout.session.completed' | 'customer.subscription.deleted'
  stripeObjectId: string
  userId: string
  entrepriseId: string
  plan: PaidPlan | null
  customerId: string | null
  subscriptionId: string | null
}): Promise<boolean> {
  const { data, error } = await admin.rpc('process_stripe_event', {
    p_event_id: params.eventId,
    p_event_type: params.eventType,
    p_stripe_object_id: params.stripeObjectId,
    p_user_id: params.userId,
    p_entreprise_id: params.entrepriseId,
    p_plan: params.plan,
    p_stripe_customer_id: params.customerId,
    p_stripe_subscription_id: params.subscriptionId,
  })
  if (error) throw error
  return data === true
}

serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  if (!paymentsEnabled) return json({ error: 'Payments are disabled' }, 503)
  if (!stripeSecretKey || !webhookSecret) {
    return json({ error: 'Payments are not configured' }, 503)
  }

  const contentLength = Number(req.headers.get('content-length') ?? '0')
  if (contentLength > 1_048_576) return json({ error: 'Payload too large' }, 413)

  const signature = req.headers.get('stripe-signature')
  if (!signature) return json({ error: 'Invalid signature' }, 400)

  let event: Stripe.Event
  try {
    const body = await req.text()
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (error) {
    console.error(
      '[stripe-webhook] Signature verification failed',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return json({ error: 'Invalid signature' }, 400)
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id
      const entrepriseId = session.metadata?.entreprise_id
      const plan = normalizePlan(session.metadata?.plan)

      if (
        !validUuid(userId) ||
        !validUuid(entrepriseId) ||
        !plan ||
        session.mode !== 'subscription' ||
        !['paid', 'no_payment_required'].includes(session.payment_status)
      ) {
        throw new Error('Completed checkout has invalid trusted metadata or payment state')
      }

      await processEvent({
        eventId: event.id,
        eventType: event.type,
        stripeObjectId: session.id,
        userId,
        entrepriseId,
        plan,
        customerId: objectId(session.customer),
        subscriptionId: objectId(session.subscription),
      })
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.supabase_user_id
      const entrepriseId = subscription.metadata?.entreprise_id
      if (!validUuid(userId) || !validUuid(entrepriseId)) {
        throw new Error('Deleted subscription has invalid trusted metadata')
      }

      await processEvent({
        eventId: event.id,
        eventType: event.type,
        stripeObjectId: subscription.id,
        userId,
        entrepriseId,
        plan: null,
        customerId: objectId(subscription.customer),
        subscriptionId: subscription.id,
      })
    }
  } catch (error) {
    console.error(
      `[stripe-webhook] Failed to process ${event.id}`,
      error instanceof Error ? error.message : 'Unknown error',
    )
    // A non-2xx response asks Stripe to retry. The SQL function rolls back its
    // idempotency record whenever the business update fails.
    return json({ error: 'Webhook processing failed' }, 500)
  }

  return json({ received: true })
})
