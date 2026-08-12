export type PaidPlan = 'sme' | 'enterprise'
export type BillingPeriod = 'monthly' | 'yearly'

export interface CheckoutPayload {
  plan: PaidPlan
  period: BillingPeriod
  entrepriseId?: string
  successUrl: string
  cancelUrl: string
}

export interface StripePriceSelection {
  plan: PaidPlan
  period: BillingPeriod
  priceId: string
}

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const PRICE_ID = /^price_[A-Za-z0-9]+$/

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID.test(value)
}

function exactObject(
  value: unknown,
  allowedKeys: readonly string[],
): value is Record<string, unknown> {
  return Boolean(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.keys(value).every((key) => allowedKeys.includes(key)),
  )
}

export function parseCheckoutPayload(value: unknown): CheckoutPayload | null {
  if (!exactObject(value, ['plan', 'period', 'entrepriseId', 'successUrl', 'cancelUrl'])) {
    return null
  }
  if (
    (value.plan !== 'sme' && value.plan !== 'enterprise') ||
    (value.period !== 'monthly' && value.period !== 'yearly') ||
    (value.entrepriseId !== undefined && !isUuid(value.entrepriseId)) ||
    typeof value.successUrl !== 'string' ||
    typeof value.cancelUrl !== 'string' ||
    value.successUrl.length > 2048 ||
    value.cancelUrl.length > 2048
  ) {
    return null
  }
  return {
    plan: value.plan,
    period: value.period,
    entrepriseId: value.entrepriseId,
    successUrl: value.successUrl,
    cancelUrl: value.cancelUrl,
  }
}

export function parsePortalPayload(
  value: unknown,
): { entrepriseId?: string; returnUrl: string } | null {
  if (!exactObject(value, ['entrepriseId', 'returnUrl'])) return null
  if (
    (value.entrepriseId !== undefined && !isUuid(value.entrepriseId)) ||
    typeof value.returnUrl !== 'string' ||
    value.returnUrl.length > 2048
  ) {
    return null
  }
  return { entrepriseId: value.entrepriseId, returnUrl: value.returnUrl }
}

export function validatedReturnUrl(value: string, requestOrigin: string | null): string | null {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' && url.hostname !== 'localhost') return null
    const origin = requestOrigin?.replace(/\/$/, '')
    const allowed = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
      .split(',')
      .map((item) => item.trim().replace(/\/$/, ''))
      .filter(Boolean)
    if ((origin && url.origin === origin) || allowed.includes(url.origin)) return url.toString()
  } catch {
    // Invalid URL.
  }
  return null
}

export function configuredStripePrices(): StripePriceSelection[] {
  const definitions: Array<[PaidPlan, BillingPeriod, string | undefined]> = [
    ['sme', 'monthly', Deno.env.get('STRIPE_PRICE_SME_MONTHLY')],
    ['sme', 'yearly', Deno.env.get('STRIPE_PRICE_SME_YEARLY')],
    ['enterprise', 'monthly', Deno.env.get('STRIPE_PRICE_ENTERPRISE_MONTHLY')],
    ['enterprise', 'yearly', Deno.env.get('STRIPE_PRICE_ENTERPRISE_YEARLY')],
  ]
  return definitions.flatMap(([plan, period, priceId]) =>
    priceId && PRICE_ID.test(priceId) ? [{ plan, period, priceId }] : []
  )
}

export function priceFor(
  prices: StripePriceSelection[],
  plan: PaidPlan,
  period: BillingPeriod,
): string | null {
  return prices.find((entry) => entry.plan === plan && entry.period === period)?.priceId ?? null
}

export function mapStripePrice(
  prices: StripePriceSelection[],
  priceId: unknown,
): Omit<StripePriceSelection, 'priceId'> | null {
  if (typeof priceId !== 'string') return null
  const matches = prices.filter((entry) => entry.priceId === priceId)
  if (matches.length !== 1) return null
  return { plan: matches[0].plan, period: matches[0].period }
}

export function strictString(
  value: unknown,
  pattern: RegExp,
  maxLength = 255,
): string | null {
  return typeof value === 'string' && value.length <= maxLength && pattern.test(value)
    ? value
    : null
}
