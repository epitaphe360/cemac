/**
 * Supabase Edge Function — stripe-webhook
 *
 * Listens for Stripe events and keeps the DB in sync.
 *
 * Events handled:
 *   checkout.session.completed   → set entreprises.subscription_plan to the purchased plan
 *   customer.subscription.deleted → revert entreprises.subscription_plan to 'free'
 *
 * Required Supabase secrets (set via `supabase secrets set`):
 *   STRIPE_SECRET_KEY=sk_live_...
 *   STRIPE_WEBHOOK_SECRET=whsec_...   (from `stripe listen` or Stripe dashboard)
 *
 * Stripe dashboard webhook URL:
 *   https://<project-ref>.supabase.co/functions/v1/stripe-webhook
 *
 * Deploy:
 *   supabase functions deploy stripe-webhook
 */

import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'
import { corsHeaders } from '../_shared/cors.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-04-10',
  httpClient: Stripe.createFetchHttpClient(),
})

function normalizePlan(plan: string | undefined): 'free' | 'sme' | 'enterprise' | 'institutional' | null {
  if (!plan) return null
  if (plan === 'pro' || plan === 'sme') return 'sme'
  if (plan === 'free' || plan === 'enterprise' || plan === 'institutional') return plan
  return null
}

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''

// Supabase admin client — bypasses RLS for trusted server operations
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const body = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  // Verify webhook signature — reject forged requests immediately
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid signature'
    console.error('[stripe-webhook] Signature verification failed:', msg)
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id
        const plan = normalizePlan(session.metadata?.plan)

        if (!userId || !plan) {
          console.warn('[stripe-webhook] checkout.session.completed: missing metadata', session.id)
          break
        }

        // Update the entreprise owned by this user
        const { error } = await supabaseAdmin
          .from('entreprises')
          .update({ subscription_plan: plan, updated_at: new Date().toISOString() })
          .eq('owner_id', userId)

        if (error) {
          console.error('[stripe-webhook] Failed to update subscription_plan:', error)
          // Return 500 so Stripe retries delivery
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        console.log(`[stripe-webhook] subscription_plan updated → "${plan}" for user ${userId}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.supabase_user_id

        if (!userId) {
          console.warn('[stripe-webhook] customer.subscription.deleted: missing metadata', subscription.id)
          break
        }

        const { error } = await supabaseAdmin
          .from('entreprises')
          .update({ subscription_plan: 'free', updated_at: new Date().toISOString() })
          .eq('owner_id', userId)

        if (error) {
          console.error('[stripe-webhook] Failed to revert subscription_plan:', error)
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        console.log(`[stripe-webhook] subscription cancelled → reverted to "free" for user ${userId}`)
        break
      }

      default:
        // Acknowledge unhandled events to prevent Stripe from retrying
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`)
    }
  } catch (err) {
    console.error('[stripe-webhook] Handler error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
