/**
 * Supabase Edge Function — create-checkout-session
 *
 * Creates a Stripe Checkout Session and returns the hosted checkout URL.
 * Embeds the authenticated user ID + plan in session metadata so the
 * stripe-webhook function can update entreprises.subscription_plan after payment.
 *
 * Required Supabase secrets (set via `supabase secrets set`):
 *   STRIPE_SECRET_KEY=sk_live_...       (or sk_test_... for testing)
 *
 * Optional:
 *   STRIPE_PRICE_SME=price_...          (Stripe Price ID for the SME / Pro plan)
 *   STRIPE_PRICE_PRO=price_...          (Stripe Price ID for the Pro plan)
 *   STRIPE_PRICE_ENTERPRISE=price_...   (Stripe Price ID for the Enterprise plan)
 *
 * Deploy:
 *   supabase functions deploy create-checkout-session
 */

import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'
import { corsHeaders } from '../_shared/cors.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-04-10',
  httpClient: Stripe.createFetchHttpClient(),
})

function normalizePlan(plan: string): 'sme' | 'enterprise' | null {
  if (plan === 'sme' || plan === 'pro') return 'sme'
  if (plan === 'enterprise') return 'enterprise'
  return null
}

// Fallback Price IDs (override with env vars)
const PRICE_MAP: Record<string, string | undefined> = {
  sme:        Deno.env.get('STRIPE_PRICE_SME') ?? Deno.env.get('STRIPE_PRICE_PRO'),
  enterprise: Deno.env.get('STRIPE_PRICE_ENTERPRISE'),
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Extract authenticated user from JWT
    const authHeader = req.headers.get('Authorization') ?? ''
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { plan, priceId, successUrl, cancelUrl } = await req.json() as {
      plan: 'sme' | 'pro' | 'enterprise'
      priceId?: string
      successUrl: string
      cancelUrl: string
    }

    const normalizedPlan = normalizePlan(plan)
    if (!normalizedPlan) {
      return new Response(
        JSON.stringify({ error: `Plan Stripe non supporté: "${plan}".` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Resolve the Price ID: client-provided → env → error
    const resolvedPriceId = priceId ?? PRICE_MAP[normalizedPlan]
    if (!resolvedPriceId) {
      return new Response(
        JSON.stringify({ error: `Aucun Price ID configuré pour le plan "${normalizedPlan}". Définissez STRIPE_PRICE_${normalizedPlan.toUpperCase()} dans les secrets Supabase.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: resolvedPriceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      payment_method_types: ['card'],
      // Collect billing address for invoicing
      billing_address_collection: 'required',
      // Allow promotion codes set up in Stripe dashboard
      allow_promotion_codes: true,
      // Embed user identity + plan so the webhook can update the DB after payment
      metadata: {
        supabase_user_id: user.id,
        plan: normalizedPlan,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan: normalizedPlan,
        },
      },
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[create-checkout-session] Error:', err)
    const message = err instanceof Error ? err.message : 'Erreur interne du serveur'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
