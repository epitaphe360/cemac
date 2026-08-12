import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'
import { corsHeaders, isOriginAllowed } from '../_shared/cors.ts'
import { clientIp, enforceRateLimits } from '../_shared/rate-limit.ts'
import {
  configuredStripePrices,
  parseCheckoutPayload,
  priceFor,
  validatedReturnUrl,
} from '../_shared/stripe-validation.ts'

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? ''
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

function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  })
}

serve(async (req: Request) => {
  if (!isOriginAllowed(req)) return json(req, { error: 'Origin not allowed' }, 403)
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(req) })
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405)
  if (!paymentsEnabled) return json(req, { error: 'Payments are disabled' }, 503)
  if (!/^sk_(test|live)_[A-Za-z0-9]+$/.test(stripeSecretKey)) {
    return json(req, { error: 'Payments are not configured' }, 503)
  }

  const contentLength = Number(req.headers.get('content-length') ?? '0')
  if (contentLength > 16_384) return json(req, { error: 'Payload too large' }, 413)

  const authorization = req.headers.get('Authorization') ?? ''
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  )

  const token = authorization.replace(/^Bearer\s+/i, '')
  const { data: { user }, error: userError } = await supabase.auth.getUser(token)
  if (userError || !user) return json(req, { error: 'Unauthorized' }, 401)

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, password_reset_required')
      .eq('id', user.id)
      .maybeSingle()
    if (profileError || !profile) return json(req, { error: 'Profile not found' }, 403)
    if (profile.password_reset_required || profile.role !== 'company_admin') {
      return json(req, { error: 'Company administrator required' }, 403)
    }

    const body = parseCheckoutPayload(await req.json())
    if (!body) return json(req, { error: 'Invalid checkout request' }, 400)

    const price = priceFor(configuredStripePrices(), body.plan, body.period)
    if (!price) {
      return json(req, { error: 'Plan is not configured' }, 503)
    }

    const requestOrigin = req.headers.get('Origin')
    const successUrl = validatedReturnUrl(body.successUrl, requestOrigin)
    const cancelUrl = validatedReturnUrl(body.cancelUrl, requestOrigin)
    if (!successUrl || !cancelUrl) {
      return json(req, { error: 'Invalid return URL' }, 400)
    }

    let companyQuery = supabase
      .from('entreprises')
      .select('id, stripe_customer_id')
      .eq('owner_id', user.id)
      .limit(2)
    if (body.entrepriseId) companyQuery = companyQuery.eq('id', body.entrepriseId)

    const { data: companies, error: companyError } = await companyQuery
    if (companyError) throw companyError
    if (!companies || companies.length === 0) {
      return json(req, { error: 'Entreprise not found' }, 404)
    }
    if (companies.length > 1) {
      return json(req, { error: 'entrepriseId is required for this account' }, 409)
    }
    const company = companies[0]

    const rateLimit = await enforceRateLimits(admin, [
      {
        scope: 'stripe-checkout-user',
        identity: user.id,
        limit: 8,
        windowSeconds: 600,
      },
      {
        scope: 'stripe-checkout-ip',
        identity: clientIp(req),
        limit: 20,
        windowSeconds: 600,
      },
    ])
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: {
          ...corsHeaders(req),
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimit.retryAfter),
        },
      })
    }

    const suppliedKey = req.headers.get('Idempotency-Key')
    if (!suppliedKey) {
      return json(req, { error: 'Idempotency-Key is required' }, 400)
    }
    if (!/^[A-Za-z0-9._:-]{8,128}$/.test(suppliedKey)) {
      return json(req, { error: 'Invalid idempotency key' }, 400)
    }
    const idempotencyKey =
      `checkout:${user.id}:${company.id}:${body.plan}:${body.period}:${suppliedKey}`

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'subscription',
        line_items: [{ price, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: company.id,
        customer: company.stripe_customer_id || undefined,
        customer_email: company.stripe_customer_id ? undefined : user.email,
        billing_address_collection: 'required',
        allow_promotion_codes: true,
        metadata: {
          supabase_user_id: user.id,
          entreprise_id: company.id,
          plan: body.plan,
          billing_period: body.period,
        },
        subscription_data: {
          metadata: {
            supabase_user_id: user.id,
            entreprise_id: company.id,
            plan: body.plan,
            billing_period: body.period,
          },
        },
      },
      { idempotencyKey },
    )

    if (!session.url) throw new Error('Stripe did not return a checkout URL')
    return json(req, { url: session.url })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return json(req, { error: 'Invalid JSON payload' }, 400)
    }
    console.error(
      '[create-checkout-session]',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return json(req, { error: 'Unable to create checkout session' }, 500)
  }
})
