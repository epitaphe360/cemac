/**
 * CEMAC INTEGRA — Smoke Test
 * Quick health check after every deployment.
 * 5 VUs × 1 minute — verifies basic system availability.
 *
 * Run with:
 *   k6 run k6/smoke-test.js \
 *     -e BASE_URL=https://cemac-integra.vercel.app \
 *     -e SUPABASE_URL=https://dotzvdrbondrybjkqqzd.supabase.co \
 *     -e SUPABASE_ANON_KEY=<key>
 */
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  vus: 5,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed:   ['rate<0.05'],
  },
}

const BASE_URL     = __ENV.BASE_URL      || 'http://localhost:5173'
const SUPABASE_URL = __ENV.SUPABASE_URL  || 'https://dotzvdrbondrybjkqqzd.supabase.co'
const ANON_KEY     = __ENV.SUPABASE_ANON_KEY || ''

const supabaseHeaders = {
  'Content-Type':  'application/json',
  'apikey':        ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
}

export default function main() {
  // 1. Frontend is reachable
  let res = http.get(`${BASE_URL}/`)
  check(res, {
    'frontend is up (200)':     (r) => r.status === 200,
    'frontend responds < 3s':   (r) => r.timings.duration < 3000,
  })
  sleep(0.3)

  // 2. Supabase REST API is reachable
  res = http.get(`${SUPABASE_URL}/rest/v1/produits?limit=1`, {
    headers: supabaseHeaders,
  })
  check(res, {
    'supabase API is up (200)':   (r) => r.status === 200,
    'supabase responds < 2s':     (r) => r.timings.duration < 2000,
    'supabase returns body':      (r) => r.body != null && r.body.length > 0,
  })
  sleep(0.3)

  // 3. Auth endpoint responds (expect 400 for invalid creds — 500 would be bad)
  res = http.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    JSON.stringify({ email: 'smoke-nonexistent@test.com', password: 'invalid' }),
    {
      headers: {
        'Content-Type': 'application/json',
        'apikey':        ANON_KEY,
      },
    },
  )
  check(res, {
    'auth endpoint responds (not 5xx)': (r) => r.status < 500,
    'auth responds < 2s':               (r) => r.timings.duration < 2000,
  })
  sleep(0.4)
}
