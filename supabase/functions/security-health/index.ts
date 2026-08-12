import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'
import { corsHeaders, isOriginAllowed } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}

serve(async (req: Request) => {
  if (!isOriginAllowed(req)) return json(req, { error: 'Origin not allowed' }, 403)
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(req) })
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405)

  const authorization = req.headers.get('Authorization') ?? ''
  if (!authorization.match(/^Bearer\s+\S+$/i)) return json(req, { error: 'Unauthorized' }, 401)
  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: role, error: roleError } = await client.rpc('get_my_role')
  if (roleError || role !== 'super_admin') return json(req, { error: 'Forbidden' }, 403)

  const { data: database, error } = await client.rpc('admin_security_health')
  if (error) {
    console.error('[security-health] database health RPC failed', error.code)
    return json(req, { error: 'Health check unavailable' }, 503)
  }

  const salt = Deno.env.get('RATE_LIMIT_SALT') ?? ''
  return json(req, {
    database,
    configuration: {
      allowed_origins_configured: Boolean(Deno.env.get('ALLOWED_ORIGINS')),
      rate_limit_salt_configured: salt.length >= 32,
      email_delivery_configured: Boolean(
        Deno.env.get('RESEND_API_KEY') && Deno.env.get('RESEND_FROM_EMAIL'),
      ),
    },
  })
})
