import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'
import { corsHeaders, isOriginAllowed } from '../_shared/cors.ts'
import { clientIp, enforceRateLimits } from '../_shared/rate-limit.ts'
import {
  type ContactPayload,
  validateContactPayload,
} from '../_shared/contact-validation.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function json(req: Request, body: unknown, status = 200, extraHeaders = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  })
}

serve(async (req: Request) => {
  if (!isOriginAllowed(req)) return json(req, { error: 'Origin not allowed' }, 403)
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(req) })
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405)
  if (!supabaseUrl || !serviceRoleKey) return json(req, { error: 'Service unavailable' }, 503)

  const contentLength = Number(req.headers.get('content-length') ?? '0')
  if (contentLength > 12_000) return json(req, { error: 'Payload too large' }, 413)

  let payload: ContactPayload | null
  try {
    payload = validateContactPayload(await req.json())
  } catch {
    payload = null
  }
  if (!payload) return json(req, { error: 'Invalid contact request' }, 400)

  // Bots filling the visually hidden field receive the same success semantics,
  // but neither consume counters nor create database records.
  if (payload.website) return json(req, { accepted: true }, 202)

  try {
    const result = await enforceRateLimits(admin, [
      { scope: 'contact:ip:15m', identity: clientIp(req), limit: 5, windowSeconds: 900 },
      { scope: 'contact:ip:day', identity: clientIp(req), limit: 20, windowSeconds: 86_400 },
      { scope: 'contact:email:hour', identity: payload.email, limit: 3, windowSeconds: 3_600 },
    ])
    if (!result.allowed) {
      return json(
        req,
        { error: 'Too many requests', retryAfter: result.retryAfter },
        429,
        { 'Retry-After': String(result.retryAfter) },
      )
    }

    const { error } = await admin.from('contact_requests').insert({
      full_name: payload.name,
      email: payload.email,
      company: payload.company ?? null,
      country: payload.country ?? null,
      reason: payload.reason ?? null,
      message: payload.message,
    })
    if (error) throw new Error(`Database rejected contact request: ${error.code}`)
    return json(req, { accepted: true }, 202)
  } catch (error) {
    console.error('[submit-contact]', error instanceof Error ? error.message : 'internal error')
    return json(req, { error: 'Service unavailable' }, 503)
  }
})
