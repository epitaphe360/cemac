const DEFAULT_ORIGINS = ['https://cemac-integra.vercel.app']

function allowedOrigins(): Set<string> {
  const configured = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean)

  return new Set(configured.length > 0 ? configured : DEFAULT_ORIGINS)
}

export function isOriginAllowed(req: Request): boolean {
  const origin = req.headers.get('Origin')
  // Non-browser callers do not send Origin and are controlled by authentication
  // or provider signatures instead.
  return origin === null || allowedOrigins().has(origin.replace(/\/$/, ''))
}

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin')?.replace(/\/$/, '')
  const allowOrigin = origin && allowedOrigins().has(origin) ? origin : 'null'

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, idempotency-key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
}
