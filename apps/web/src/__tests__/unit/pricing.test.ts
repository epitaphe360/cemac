import { describe, expect, it } from 'vitest'
import type { PricingPlanView } from '@/lib/cms-types'
import {
  findPricingPlan,
  formatPlanPrice,
  getPlanPrice,
  getUpgradePlans,
} from '@/lib/pricing'

const plans: PricingPlanView[] = [
  {
    id: 'free',
    name: 'Starter CMS',
    description: 'Découverte',
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: 'XAF',
    badge: null,
    cta: { label: 'Commencer', href: '/auth/register' },
    features: [],
    sortOrder: 10,
  },
  {
    id: 'sme',
    name: 'Pro CMS',
    description: 'PME',
    monthlyPrice: 31_000,
    yearlyPrice: 300_000,
    currency: 'XAF',
    badge: null,
    cta: { label: 'Souscrire', href: '/auth/register?plan=sme' },
    features: [
      { id: 'feature-1', key: 'one', label: 'Fonction CMS', included: true, sortOrder: 10 },
    ],
    sortOrder: 20,
  },
]

describe('pricing helpers with CMS data', () => {
  it('reads monthly and yearly prices from the supplied plans', () => {
    expect(getPlanPrice(plans, 'sme')).toBe(31_000)
    expect(getPlanPrice(plans, 'sme', 'yearly')).toBe(300_000)
  })

  it('does not provide a hard-coded compatibility fallback', () => {
    expect(getPlanPrice('sme')).toBeNull()
  })

  it('builds upgrade cards from loaded content', () => {
    expect(getUpgradePlans(plans)).toEqual([
      expect.objectContaining({
        id: 'sme',
        label: 'Pro CMS',
        price: '31 000 XAF / mois',
        highlights: ['Fonction CMS'],
      }),
    ])
  })

  it('handles missing plans and quote-based prices explicitly', () => {
    expect(findPricingPlan(plans, 'enterprise')).toBeNull()
    expect(formatPlanPrice(null)).toBe('Sur devis')
  })
})
