import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: { functions: { invoke: vi.fn() } },
}))

import { isTrustedStripeUrl, paymentsEnabled } from '@/lib/payments'

describe('payment helpers', () => {
  it('keeps payments fail-closed in the test environment', () => {
    expect(paymentsEnabled).toBe(false)
  })

  it('accepts only exact HTTPS Stripe redirect hosts', () => {
    expect(isTrustedStripeUrl(
      'https://checkout.stripe.com/c/pay/cs_test_123',
      'checkout.stripe.com',
    )).toBe(true)
    expect(isTrustedStripeUrl(
      'https://checkout.stripe.com.attacker.example/cs_test_123',
      'checkout.stripe.com',
    )).toBe(false)
    expect(isTrustedStripeUrl(
      'http://checkout.stripe.com/cs_test_123',
      'checkout.stripe.com',
    )).toBe(false)
  })
})
