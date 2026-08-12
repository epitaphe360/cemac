import { assert, assertEquals, assertMatch } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { validateContactPayload } from './contact-validation.ts'
import { hashRateLimitIdentity } from './rate-limit.ts'
import {
  mapStripePrice,
  parseCheckoutPayload,
  parsePortalPayload,
  priceFor,
  type StripePriceSelection,
} from './stripe-validation.ts'

Deno.test('contact validation normalizes valid input and preserves honeypot', () => {
  const result = validateContactPayload({
    name: '  Ada Test  ',
    email: ' ADA@EXAMPLE.COM ',
    message: 'Une demande suffisamment longue.',
    website: 'bot.example',
  })
  assert(result)
  assertEquals(result.name, 'Ada Test')
  assertEquals(result.email, 'ada@example.com')
  assertEquals(result.website, 'bot.example')
})

Deno.test('contact validation rejects unknown fields and malformed payloads', () => {
  assertEquals(validateContactPayload({
    name: 'Ada',
    email: 'ada@example.com',
    message: 'Une demande suffisamment longue.',
    admin: true,
  }), null)
  assertEquals(validateContactPayload({
    name: 'A',
    email: 'invalid',
    message: 'court',
  }), null)
})

Deno.test('rate-limit identity is salted and irreversible in storage', async () => {
  const hash = await hashRateLimitIdentity(
    'contact:email:user@example.com',
    '0123456789abcdef0123456789abcdef',
  )
  assertMatch(hash, /^[a-f0-9]{64}$/)
  assert(!hash.includes('user@example.com'))
  assertEquals(
    hash,
    await hashRateLimitIdentity(
      'contact:email:user@example.com',
      '0123456789abcdef0123456789abcdef',
    ),
  )
})

const stripePrices: StripePriceSelection[] = [
  { plan: 'sme', period: 'monthly', priceId: 'price_smeMonthly1' },
  { plan: 'sme', period: 'yearly', priceId: 'price_smeYearly1' },
  { plan: 'enterprise', period: 'monthly', priceId: 'price_enterpriseMonthly1' },
  { plan: 'enterprise', period: 'yearly', priceId: 'price_enterpriseYearly1' },
]

Deno.test('Stripe checkout validation is strict and supports both periods', () => {
  assertEquals(parseCheckoutPayload({
    plan: 'sme',
    period: 'yearly',
    entrepriseId: 'c9a6467d-03f1-4f0f-a97c-ce63d91c9017',
    successUrl: 'https://app.example/settings?checkout=success',
    cancelUrl: 'https://app.example/settings?checkout=cancel',
  })?.period, 'yearly')
  assertEquals(parseCheckoutPayload({
    plan: 'sme',
    period: 'monthly',
    successUrl: 'https://app.example/settings',
    cancelUrl: 'https://app.example/settings',
    priceId: 'price_attacker',
  }), null)
  assertEquals(parseCheckoutPayload({
    plan: 'institutional',
    period: 'monthly',
    successUrl: 'https://app.example/settings',
    cancelUrl: 'https://app.example/settings',
  }), null)
})

Deno.test('Stripe prices map only exact unique server configuration', () => {
  assertEquals(priceFor(stripePrices, 'enterprise', 'yearly'), 'price_enterpriseYearly1')
  assertEquals(mapStripePrice(stripePrices, 'price_smeMonthly1'), {
    plan: 'sme',
    period: 'monthly',
  })
  assertEquals(mapStripePrice([
    ...stripePrices,
    { plan: 'enterprise', period: 'monthly', priceId: 'price_smeMonthly1' },
  ], 'price_smeMonthly1'), null)
})

Deno.test('Stripe portal rejects unknown fields and invalid ownership ids', () => {
  assertEquals(parsePortalPayload({
    returnUrl: 'https://app.example/settings',
    customer: 'cus_attacker',
  }), null)
  assertEquals(parsePortalPayload({
    entrepriseId: 'not-a-uuid',
    returnUrl: 'https://app.example/settings',
  }), null)
})
