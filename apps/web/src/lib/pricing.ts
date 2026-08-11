import type { PricingPlanView } from './cms-types'

export type PublicPlanId = 'free' | 'sme' | 'enterprise'
export type BillingPeriod = 'monthly' | 'yearly'

export function isPublicPlanId(value: unknown): value is PublicPlanId {
  return value === 'free' || value === 'sme' || value === 'enterprise'
}

export function formatPlanPrice(
  amount: number | null,
  period: BillingPeriod = 'monthly',
  currency = 'XAF',
  locale = 'fr-FR',
): string {
  if (amount === null) return 'Sur devis'
  if (amount === 0) return 'Gratuit'
  return `${amount.toLocaleString(locale)} ${currency} / ${period === 'yearly' ? 'an' : 'mois'}`
}

export function findPricingPlan(
  plans: readonly PricingPlanView[],
  planId: string | null | undefined,
): PricingPlanView | null {
  if (!planId) return null
  return plans.find((plan) => plan.id === planId) ?? null
}

export function getPlanPrice(
  plans: readonly PricingPlanView[],
  planId: string,
  period?: BillingPeriod,
): number | null
/** @deprecated Chargez les offres CMS et utilisez la surcharge avec `plans`. */
export function getPlanPrice(
  planId: PublicPlanId | 'institutional',
  period?: BillingPeriod,
): number | null
export function getPlanPrice(
  plansOrPlanId: readonly PricingPlanView[] | PublicPlanId | 'institutional',
  planIdOrPeriod: string = 'monthly',
  period: BillingPeriod = 'monthly',
): number | null {
  // Compatibility for callers outside this migration's ownership. Deliberately
  // return no price rather than reintroducing a stale business-price fallback.
  if (!Array.isArray(plansOrPlanId)) return null

  const plan = findPricingPlan(plansOrPlanId, planIdOrPeriod)
  if (!plan) return null
  return period === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
}

export function getUpgradePlans(plans: readonly PricingPlanView[]) {
  return plans
    .filter((plan) => plan.id !== 'free' && plan.id !== 'institutional')
    .map((plan) => ({
      id: plan.id,
      label: plan.name,
      price: formatPlanPrice(plan.monthlyPrice, 'monthly', plan.currency),
      description: plan.description,
      highlights: plan.features
        .filter((feature) => feature.included && feature.label)
        .slice(0, 4)
        .map((feature) => feature.label as string),
    }))
}