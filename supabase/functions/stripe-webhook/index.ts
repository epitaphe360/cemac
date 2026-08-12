import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'
import {
  configuredStripePrices,
  isUuid,
  mapStripePrice,
  type BillingPeriod,
  type PaidPlan,
  type StripePriceSelection,
} from '../_shared/stripe-validation.ts'

type SupportedEventType =
  | 'checkout.session.completed'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.paid'
  | 'invoice.payment_failed'

interface CompanyTarget {
  id: string
  owner_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

interface EventState {
  eventId: string
  eventType: SupportedEventType
  stripeObjectId: string
  company: CompanyTarget
  plan?: PaidPlan
  period?: BillingPeriod
  subscriptionStatus?: string
  customerId?: string
  subscriptionId?: string
  periodStart?: string
  periodEnd?: string
  cancelAtPeriodEnd?: boolean
  canceledAt?: string
  invoiceId?: string
  invoiceNumber?: string
  invoiceSubtotal?: number
  invoiceTax?: number
  invoiceTotal?: number
  currency?: string
  paymentIntentId?: string
  hostedInvoiceUrl?: string
  invoicePdfUrl?: string
}

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

function objectId(value: string | { id: string } | null | undefined): string | null {
  return typeof value === 'string' ? value : value?.id ?? null
}

function unixDate(value: number | null | undefined): string | undefined {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
    ? new Date(value * 1000).toISOString()
    : undefined
}

function requireId(value: unknown, prefix: string): string {
  if (typeof value !== 'string' || !new RegExp(`^${prefix}_[A-Za-z0-9_]+$`).test(value)) {
    throw new Error(`Invalid Stripe ${prefix} id`)
  }
  return value
}

function priceSelection(
  prices: StripePriceSelection[],
  items: Array<{ price?: { id?: string | null } | null; quantity?: number | null }>,
): { plan: PaidPlan; period: BillingPeriod } {
  if (items.length !== 1 || items[0].quantity !== 1) {
    throw new Error('Expected exactly one Stripe subscription line')
  }
  const mapped = mapStripePrice(prices, items[0].price?.id)
  if (!mapped) throw new Error('Stripe price is not an exact configured plan/period mapping')
  return mapped
}

async function resolveCompany(params: {
  customerId: string
  subscriptionId?: string
  entrepriseId?: unknown
  metadataUserId?: unknown
}): Promise<CompanyTarget> {
  const select = 'id, owner_id, stripe_customer_id, stripe_subscription_id'
  const byCustomer = await admin
    .from('entreprises')
    .select(select)
    .eq('stripe_customer_id', params.customerId)
    .limit(2)
  if (byCustomer.error) throw byCustomer.error
  if ((byCustomer.data?.length ?? 0) > 1) throw new Error('Stripe customer is not unique')
  let company = byCustomer.data?.[0] as CompanyTarget | undefined

  if (!company && params.subscriptionId) {
    const bySubscription = await admin
      .from('entreprises')
      .select(select)
      .eq('stripe_subscription_id', params.subscriptionId)
      .limit(2)
    if (bySubscription.error) throw bySubscription.error
    if ((bySubscription.data?.length ?? 0) > 1) throw new Error('Stripe subscription is not unique')
    company = bySubscription.data?.[0] as CompanyTarget | undefined
  }

  // Metadata is only a candidate locator for the first event. The signed event
  // must also carry a configured price, and this query independently verifies
  // the persisted entreprise owner and any existing Stripe correlations.
  if (!company && isUuid(params.entrepriseId) && isUuid(params.metadataUserId)) {
    const candidate = await admin
      .from('entreprises')
      .select(select)
      .eq('id', params.entrepriseId)
      .eq('owner_id', params.metadataUserId)
      .maybeSingle()
    if (candidate.error) throw candidate.error
    company = candidate.data as CompanyTarget | undefined
  }
  if (!company) throw new Error('Stripe object is not correlated to an entreprise')
  if (company.stripe_customer_id && company.stripe_customer_id !== params.customerId) {
    throw new Error('Stripe customer correlation mismatch')
  }
  if (
    params.subscriptionId &&
    company.stripe_subscription_id &&
    company.stripe_subscription_id !== params.subscriptionId
  ) {
    throw new Error('Stripe subscription correlation mismatch')
  }
  if (isUuid(params.metadataUserId) && params.metadataUserId !== company.owner_id) {
    throw new Error('Stripe metadata owner mismatch')
  }
  return company
}

async function subscriptionState(
  eventId: string,
  eventType: SupportedEventType,
  stripeObjectId: string,
  subscription: Stripe.Subscription,
  prices: StripePriceSelection[],
): Promise<EventState> {
  const subscriptionId = requireId(subscription.id, 'sub')
  const customerId = requireId(objectId(subscription.customer), 'cus')
  const selection = priceSelection(prices, subscription.items.data)
  const company = await resolveCompany({
    customerId,
    subscriptionId,
    entrepriseId: subscription.metadata?.entreprise_id,
    metadataUserId: subscription.metadata?.supabase_user_id,
  })
  return {
    eventId,
    eventType,
    stripeObjectId,
    company,
    ...selection,
    subscriptionStatus: subscription.status,
    customerId,
    subscriptionId,
    periodStart: unixDate(subscription.current_period_start),
    periodEnd: unixDate(subscription.current_period_end),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    canceledAt: unixDate(subscription.canceled_at),
  }
}

async function normalizeEvent(
  event: Stripe.Event,
  prices: StripePriceSelection[],
): Promise<EventState | null> {
  if (!/^evt_[A-Za-z0-9]+$/.test(event.id)) throw new Error('Invalid Stripe event id')
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const sessionId = requireId(session.id, 'cs')
    const customerId = requireId(objectId(session.customer), 'cus')
    const subscriptionId = requireId(objectId(session.subscription), 'sub')
    if (
      session.mode !== 'subscription' ||
      !['paid', 'no_payment_required'].includes(session.payment_status)
    ) {
      throw new Error('Checkout session is not a completed subscription')
    }
    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 2 })
    const selection = priceSelection(prices, lineItems.data)
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const company = await resolveCompany({
      customerId,
      subscriptionId,
      entrepriseId: session.client_reference_id,
      metadataUserId: session.metadata?.supabase_user_id,
    })
    if (
      isUuid(session.metadata?.entreprise_id) &&
      session.metadata?.entreprise_id !== company.id
    ) {
      throw new Error('Checkout metadata entreprise mismatch')
    }
    return {
      eventId: event.id,
      eventType: event.type,
      stripeObjectId: sessionId,
      company,
      ...selection,
      subscriptionStatus: subscription.status,
      customerId,
      subscriptionId,
      periodStart: unixDate(subscription.current_period_start),
      periodEnd: unixDate(subscription.current_period_end),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: unixDate(subscription.canceled_at),
    }
  }

  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    return subscriptionState(
      event.id,
      event.type,
      (event.data.object as Stripe.Subscription).id,
      event.data.object as Stripe.Subscription,
      prices,
    )
  }

  if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    const invoiceId = requireId(invoice.id, 'in')
    const customerId = requireId(objectId(invoice.customer), 'cus')
    const subscriptionId = requireId(objectId(invoice.subscription), 'sub')
    if (
      !Number.isSafeInteger(invoice.subtotal) ||
      !Number.isSafeInteger(invoice.total) ||
      invoice.subtotal < 0 ||
      invoice.total < 0 ||
      invoice.currency !== 'xaf'
    ) {
      throw new Error('Invalid Stripe invoice amounts or currency')
    }
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const selection = priceSelection(prices, subscription.items.data)
    const company = await resolveCompany({ customerId, subscriptionId })
    const tax = (invoice.total_tax_amounts as Array<{ amount: number }>).reduce(
      (sum: number, item: { amount: number }) => sum + item.amount,
      0,
    )
    if (!Number.isSafeInteger(tax) || tax < 0) throw new Error('Invalid Stripe invoice tax')
    const paymentIntentId = objectId(invoice.payment_intent) ?? undefined
    if (paymentIntentId) requireId(paymentIntentId, 'pi')
    return {
      eventId: event.id,
      eventType: event.type,
      stripeObjectId: invoiceId,
      company,
      ...selection,
      customerId,
      subscriptionId,
      periodStart: unixDate(invoice.period_start),
      periodEnd: unixDate(invoice.period_end),
      invoiceId,
      invoiceNumber: invoice.number ?? invoiceId,
      invoiceSubtotal: invoice.subtotal,
      invoiceTax: tax,
      invoiceTotal: invoice.total,
      currency: invoice.currency.toUpperCase(),
      paymentIntentId,
      hostedInvoiceUrl: invoice.hosted_invoice_url ?? undefined,
      invoicePdfUrl: invoice.invoice_pdf ?? undefined,
    }
  }
  return null
}

async function processEvent(state: EventState): Promise<boolean> {
  const { data, error } = await admin.rpc('process_stripe_event', {
    p_event_id: state.eventId,
    p_event_type: state.eventType,
    p_stripe_object_id: state.stripeObjectId,
    p_user_id: state.company.owner_id,
    p_entreprise_id: state.company.id,
    p_plan: state.plan ?? null,
    p_billing_period: state.period ?? null,
    p_subscription_status: state.subscriptionStatus ?? null,
    p_stripe_customer_id: state.customerId ?? null,
    p_stripe_subscription_id: state.subscriptionId ?? null,
    p_period_start: state.periodStart ?? null,
    p_period_end: state.periodEnd ?? null,
    p_cancel_at_period_end: state.cancelAtPeriodEnd ?? false,
    p_canceled_at: state.canceledAt ?? null,
    p_stripe_invoice_id: state.invoiceId ?? null,
    p_invoice_number: state.invoiceNumber ?? null,
    p_invoice_subtotal: state.invoiceSubtotal ?? null,
    p_invoice_tax: state.invoiceTax ?? null,
    p_invoice_total: state.invoiceTotal ?? null,
    p_currency: state.currency ?? null,
    p_payment_intent_id: state.paymentIntentId ?? null,
    p_hosted_invoice_url: state.hostedInvoiceUrl ?? null,
    p_invoice_pdf_url: state.invoicePdfUrl ?? null,
  })
  if (error) throw error
  return data === true
}

serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  if (!paymentsEnabled) return json({ error: 'Payments are disabled' }, 503)
  const prices = configuredStripePrices()
  if (
    !/^sk_(test|live)_[A-Za-z0-9]+$/.test(stripeSecretKey) ||
    !/^whsec_[A-Za-z0-9]+$/.test(webhookSecret) ||
    prices.length !== 4 ||
    new Set(prices.map((entry) => entry.priceId)).size !== 4
  ) {
    return json({ error: 'Payments are not configured' }, 503)
  }
  if (Number(req.headers.get('content-length') ?? '0') > 1_048_576) {
    return json({ error: 'Payload too large' }, 413)
  }
  const signature = req.headers.get('stripe-signature')
  if (!signature) return json({ error: 'Invalid signature' }, 400)

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      await req.text(),
      signature,
      webhookSecret,
    )
  } catch (error) {
    console.error(
      '[stripe-webhook] Signature verification failed',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return json({ error: 'Invalid signature' }, 400)
  }

  try {
    const state = await normalizeEvent(event, prices)
    if (state) await processEvent(state)
  } catch (error) {
    console.error(
      `[stripe-webhook] Failed to process ${event.id}`,
      error instanceof Error ? error.message : 'Unknown error',
    )
    return json({ error: 'Webhook processing failed' }, 500)
  }
  return json({ received: true })
})
