import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'
import { corsHeaders, isOriginAllowed } from '../_shared/cors.ts'

type PaidPlan = 'sme' | 'enterprise'

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? ''
const paymentsEnabled = Deno.env.get('PAYMENTS_ENABLED') === 'true'
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-04-10',
  httpClient: Stripe.createFetchHttpClient(),
})

const priceMap: Record<PaidPlan, string | undefined> = {
  sme: Deno.env.get('STRIPE_PRICE_SME') ?? Deno.env.get('STRIPE_PRICE_PRO'),
  enterprise: Deno.env.get('STRIPE_PRICE_ENTERPRISE'),
}

function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  })
}

function normalizePlan(value: unknown): PaidPlan | null {
  if (value === 'sme' || value === 'pro') return 'sme'
  if (value === 'enterprise') return 'enterprise'
  return null
}

function validatedReturnUrl(value: unknown, req: Request): string | null {
  if (typeof value !== 'string' || value.length > 2048) return null
  try {
    const url = new URL(value)
    const requestOrigin = req.headers.get('Origin')?.replace(/\/$/, '')
    if (requestOrigin && url.origin === requestOrigin) return url.toString()

    const allowed = (Deno.env.get('ALLOWED_ORIGINS') ??
      'https://cemac-integra.vercel.app')
      .split(',')
      .map((origin) => origin.trim().replace(/\/$/, ''))
    return allowed.includes(url.origin) ? url.toString() : null
  } catch {
    return null
  }
}

serve(async (req: Request) => {
  if (!isOriginAllowed(req)) return json(req, { error: 'Origin not allowed' }, 403)
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(req) })
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405)
  if (!paymentsEnabled) return json(req, { error: 'Payments are disabled' }, 503)
  if (!stripeSecretKey) return json(req, { error: 'Payments are not configured' }, 503)

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
      .select('password_reset_required')
      .eq('id', user.id)
      .maybeSingle()
    if (profileError || !profile) return json(req, { error: 'Profile not found' }, 403)
    if (profile.password_reset_required) {
      return json(req, { error: 'Password reset required' }, 403)
    }

    const body = await req.json() as {
      plan?: string
      entrepriseId?: string
      successUrl?: string
      cancelUrl?: string
    }
    const plan = normalizePlan(body.plan)
    if (!plan) return json(req, { error: 'Unsupported plan' }, 400)

    const price = priceMap[plan]
    if (!price || !/^price_[A-Za-z0-9]+$/.test(price)) {
      return json(req, { error: 'Plan is not configured' }, 503)
    }

    const successUrl = validatedReturnUrl(body.successUrl, req)
    const cancelUrl = validatedReturnUrl(body.cancelUrl, req)
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

    const suppliedKey = req.headers.get('Idempotency-Key')
    if (!suppliedKey) {
      return json(req, { error: 'Idempotency-Key is required' }, 400)
    }
    if (!/^[A-Za-z0-9._:-]{8,128}$/.test(suppliedKey)) {
      return json(req, { error: 'Invalid idempotency key' }, 400)
    }
    const idempotencyKey =
      `checkout:${user.id}:${company.id}:${plan}:${suppliedKey}`

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
          plan,
        },
        subscription_data: {
          metadata: {
            supabase_user_id: user.id,
            entreprise_id: company.id,
            plan,
          },
        },
      },
      { idempotencyKey },
    )

    if (!session.url) throw new Error('Stripe did not return a checkout URL')
    return json(req, { url: session.url })
  } catch (error) {
    console.error(
      '[create-checkout-session]',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return json(req, { error: 'Unable to create checkout session' }, 500)
  }
})
