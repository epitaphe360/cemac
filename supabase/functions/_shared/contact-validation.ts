export interface ContactPayload {
  name: string
  email: string
  company?: string
  country?: string
  reason?: string
  message: string
  website?: string
}

function cleanOptional(value: unknown, max: number): string | null | undefined {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') return undefined
  const cleaned = value.trim()
  return cleaned.length <= max ? cleaned : undefined
}

export function validateContactPayload(value: unknown): ContactPayload | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const input = value as Record<string, unknown>
  const allowed = new Set(['name', 'email', 'company', 'country', 'reason', 'message', 'website'])
  if (Object.keys(input).some((key) => !allowed.has(key))) return null
  if (typeof input.name !== 'string' || typeof input.email !== 'string' || typeof input.message !== 'string') return null

  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  const message = input.message.trim()
  const company = cleanOptional(input.company, 200)
  const country = cleanOptional(input.country, 80)
  const reason = cleanOptional(input.reason, 80)
  const website = cleanOptional(input.website, 200)
  if ([company, country, reason, website].some((field) => field === undefined)) return null
  if (
    name.length < 2 || name.length > 120 ||
    email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    message.length < 10 || message.length > 5000
  ) return null

  return {
    name,
    email,
    message,
    company: company ?? undefined,
    country: country ?? undefined,
    reason: reason ?? undefined,
    website: website ?? undefined,
  }
}
