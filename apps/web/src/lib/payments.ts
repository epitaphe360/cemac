import { supabase } from '@/lib/supabase'
import type { BillingPeriod } from '@/lib/pricing'

export type PaidPlan = 'sme' | 'enterprise'

export const paymentsEnabled = import.meta.env.VITE_PAYMENTS_ENABLED === 'true'

export function isTrustedStripeUrl(value: unknown, host: string): value is string {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === host
  } catch {
    return false
  }
}

function trustedStripeRedirect(value: unknown, host: string): string {
  if (!isTrustedStripeUrl(value, host)) {
    throw new Error('URL de paiement non fiable.')
  }
  return new URL(value).toString()
}

export async function createCheckoutUrl(
  plan: PaidPlan,
  period: BillingPeriod,
  entrepriseId: string,
): Promise<string> {
  if (!paymentsEnabled) throw new Error('Les paiements en ligne sont désactivés.')
  const returnBase = `${window.location.origin}/settings`
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: {
      plan,
      period,
      entrepriseId,
      successUrl: `${returnBase}?tab=plan&checkout=success`,
      cancelUrl: `${returnBase}?tab=plan&checkout=cancelled`,
    },
    headers: { 'Idempotency-Key': crypto.randomUUID() },
  })
  if (error) throw new Error(error.message || 'Impossible de démarrer le paiement.')
  return trustedStripeRedirect((data as { url?: unknown } | null)?.url, 'checkout.stripe.com')
}

export async function createCustomerPortalUrl(entrepriseId: string): Promise<string> {
  if (!paymentsEnabled) throw new Error('Les paiements en ligne sont désactivés.')
  const { data, error } = await supabase.functions.invoke('create-customer-portal-session', {
    body: {
      entrepriseId,
      returnUrl: `${window.location.origin}/settings?tab=plan`,
    },
  })
  if (error) throw new Error(error.message || 'Impossible d’ouvrir le portail de facturation.')
  return trustedStripeRedirect((data as { url?: unknown } | null)?.url, 'billing.stripe.com')
}

export function redirectToPayment(url: string): void {
  window.location.assign(url)
}
