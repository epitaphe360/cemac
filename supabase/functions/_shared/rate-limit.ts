import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

export interface RateLimitRule {
  scope: string
  limit: number
  windowSeconds: number
  identity: string
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfter: number
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function hashRateLimitIdentity(
  identity: string,
  salt = Deno.env.get('RATE_LIMIT_SALT') ?? '',
): Promise<string> {
  if (salt.length < 32) throw new Error('RATE_LIMIT_SALT must contain at least 32 characters')
  const input = new TextEncoder().encode(`${salt}\0${identity.trim().toLowerCase()}`)
  const digest = await crypto.subtle.digest('SHA-256', input)
  return bytesToHex(new Uint8Array(digest))
}

export function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || req.headers.get('x-real-ip')?.trim() || 'unknown'
}

export async function consumeRateLimit(
  admin: SupabaseClient,
  rule: RateLimitRule,
): Promise<RateLimitResult> {
  const identifierHash = await hashRateLimitIdentity(`${rule.scope}:${rule.identity}`)
  const { data, error } = await admin.rpc('consume_rate_limit', {
    p_scope: rule.scope,
    p_identifier_hash: identifierHash,
    p_limit: rule.limit,
    p_window_seconds: rule.windowSeconds,
  })
  if (error) throw new Error(`Rate limit unavailable: ${error.code ?? 'unknown'}`)

  const result = data as {
    allowed?: unknown
    remaining?: unknown
    retry_after?: unknown
  } | null
  if (
    typeof result?.allowed !== 'boolean' ||
    typeof result.remaining !== 'number' ||
    typeof result.retry_after !== 'number'
  ) {
    throw new Error('Rate limit returned an invalid response')
  }
  return {
    allowed: result.allowed,
    remaining: result.remaining,
    retryAfter: result.retry_after,
  }
}

export async function enforceRateLimits(
  admin: SupabaseClient,
  rules: RateLimitRule[],
): Promise<RateLimitResult> {
  let remaining = Number.MAX_SAFE_INTEGER
  for (const rule of rules) {
    const result = await consumeRateLimit(admin, rule)
    remaining = Math.min(remaining, result.remaining)
    if (!result.allowed) return { ...result, remaining }
  }
  return { allowed: true, remaining, retryAfter: 0 }
}
