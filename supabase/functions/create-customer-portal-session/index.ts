import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'
import { corsHeaders, isOriginAllowed } from '../_shared/cors.ts'
import { clientIp, enforceRateLimits } from '../_shared/rate-limit.ts'
import {
  parsePortalPayload,
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

function json(req: Request, body: unknown, status = 200, retryAfter?: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      'Content-Type': 'application/json',
      ...(retryAfter ? { 'Retry-After': String(retryAfter) } : {}),
    },
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
  if (Number(req.headers.get('content-length') ?? '0') > 8_192) {
    return json(req, { error: 'Payload too large' }, 413)
  }

  const authorization = req.headers.get('Authorization') ?? ''
  const token = authorization.replace(/^Bearer\s+/i, '')
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  )
  const { data: { user }, error: userError } = await userClient.auth.getUser(token)
  if (userError || !user) return json(req, { error: 'Unauthorized' }, 401)

  try {
    const payload = parsePortalPayload(await req.json())
    if (!payload) return json(req, { error: 'Invalid portal request' }, 400)
    const returnUrl = validatedReturnUrl(payload.returnUrl, req.headers.get('Origin'))
    if (!returnUrl) return json(req, { error: 'Invalid return URL' }, 400)

    const { data: profile, error: profileError } = await userClient
      .from('profiles')
      .select('role, password_reset_required')
      .eq('id', user.id)
      .maybeSingle()
    if (
      profileError ||
      !profile ||
      profile.role !== 'company_admin' ||
      profile.password_reset_required
    ) {
      return json(req, { error: 'Company administrator required' }, 403)
    }

    let companyQuery = userClient
      .from('entreprises')
      .select('id, stripe_customer_id')
      .eq('owner_id', user.id)
      .limit(2)
    if (payload.entrepriseId) companyQuery = companyQuery.eq('id', payload.entrepriseId)
    const { data: companies, error: companyError } = await companyQuery
    if (companyError) throw companyError
    if (!companies?.length) return json(req, { error: 'Entreprise not found' }, 404)
    if (companies.length !== 1) {
      return json(req, { error: 'entrepriseId is required for this account' }, 409)
    }
    const company = companies[0]
    if (!company.stripe_customer_id || !/^cus_[A-Za-z0-9]+$/.test(company.stripe_customer_id)) {
      return json(req, { error: 'No Stripe customer for this entreprise' }, 409)
    }

    const rateLimit = await enforceRateLimits(admin, [
      { scope: 'stripe-portal-user', identity: user.id, limit: 10, windowSeconds: 600 },
      { scope: 'stripe-portal-ip', identity: clientIp(req), limit: 30, windowSeconds: 600 },
    ])
    if (!rateLimit.allowed) {
      return json(req, { error: 'Too many requests' }, 429, rateLimit.retryAfter)
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: company.stripe_customer_id,
      return_url: returnUrl,
    })
    if (!/^https:\/\/billing\.stripe\.com\//.test(session.url)) {
      throw new Error('Stripe returned an invalid portal URL')
    }
    return json(req, { url: session.url })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return json(req, { error: 'Invalid JSON payload' }, 400)
    }
    console.error(
      '[create-customer-portal-session]',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return json(req, { error: 'Unable to create customer portal session' }, 500)
  }
})
