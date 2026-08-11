/**
 * CEMAC INTEGRA — Load Test
 * SLA: p95 < 2000ms | p99 < 4000ms | error rate < 1%
 * Peak: 1000 concurrent virtual users
 *
 * Run with:
 *   k6 run k6/load-test.js \
 *     -e BASE_URL=https://cemac-integra.vercel.app \
 *     -e SUPABASE_URL=https://dotzvdrbondrybjkqqzd.supabase.co \
 *     -e SUPABASE_ANON_KEY=<key>
 */
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Trend, Rate, Counter } from 'k6/metrics'

// Custom metrics
const pageLoadTime = new Trend('page_load_time_ms', true)
const errorRate = new Rate('error_rate')
const requestCount = new Counter('total_requests')

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp-up: 0 → 100 users
    { duration: '3m', target: 500 },   // Scale:  100 → 500 users
    { duration: '5m', target: 1000 },  // Peak:   500 → 1000 users
    { duration: '3m', target: 1000 },  // Hold:   1000 users sustained
    { duration: '2m', target: 0 },     // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<4000'],
    http_req_failed:   ['rate<0.01'],    // < 1% failure rate
    error_rate:        ['rate<0.01'],
    page_load_time_ms: ['p(95)<2000'],
  },
}

const BASE_URL      = __ENV.BASE_URL      || 'http://localhost:5173'
const SUPABASE_URL  = __ENV.SUPABASE_URL  || 'https://dotzvdrbondrybjkqqzd.supabase.co'
const ANON_KEY      = __ENV.SUPABASE_ANON_KEY || ''

const supabaseHeaders = {
  'Content-Type':  'application/json',
  'apikey':        ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
}

// ── Scenario functions ─────────────────────────────────────────────────────

function scenarioFrontendLoad() {
  const start = Date.now()
  const res = http.get(`${BASE_URL}/`)
  const elapsed = Date.now() - start
  pageLoadTime.add(elapsed)
  requestCount.add(1)

  const ok = check(res, {
    'frontend: status 200':          (r) => r.status === 200,
    'frontend: response < 2000ms':   (r) => r.timings.duration < 2000,
    'frontend: has DOCTYPE':         (r) =>
      r.body != null && (r.body.includes('<!DOCTYPE') || r.body.includes('<!doctype')),
  })
  errorRate.add(!ok)
  sleep(0.5)
}

function scenarioProductListing() {
  const start = Date.now()
  const res = http.get(
    `${SUPABASE_URL}/rest/v1/produits?select=id,nom,prix,categorie&limit=20`,
    { headers: supabaseHeaders },
  )
  pageLoadTime.add(Date.now() - start)
  requestCount.add(1)

  const ok = check(res, {
    'products: status 200':         (r) => r.status === 200,
    'products: returns array':      (r) => {
      try { return Array.isArray(JSON.parse(r.body)) } catch { return false }
    },
    'products: response < 1000ms': (r) => r.timings.duration < 1000,
  })
  errorRate.add(!ok)
  sleep(0.3)
}

function scenarioProductSearch() {
  const queries = ['Palm', 'Cacao', 'Coton', 'Pétrole', 'Bois']
  const q = encodeURIComponent(queries[Math.floor(Math.random() * queries.length)])
  const start = Date.now()
  const res = http.get(
    `${SUPABASE_URL}/rest/v1/produits?select=id,nom,prix&nom=ilike.*${q}*&limit=10`,
    { headers: supabaseHeaders },
  )
  pageLoadTime.add(Date.now() - start)
  requestCount.add(1)

  const ok = check(res, {
    'search: status 200':        (r) => r.status === 200,
    'search: response < 1500ms': (r) => r.timings.duration < 1500,
  })
  errorRate.add(!ok)
  sleep(0.3)
}

function scenariolCertificationList() {
  const start = Date.now()
  const res = http.get(
    `${SUPABASE_URL}/rest/v1/certifications?select=id,statut,created_at&statut=eq.approved&limit=10`,
    { headers: supabaseHeaders },
  )
  pageLoadTime.add(Date.now() - start)
  requestCount.add(1)

  const ok = check(res, {
    'certifications: status 200':   (r) => r.status === 200,
    'certifications: < 2000ms':     (r) => r.timings.duration < 2000,
  })
  errorRate.add(!ok)
  sleep(0.5)
}

function scenarioEntrepriseListing() {
  const start = Date.now()
  const res = http.get(
    `${SUPABASE_URL}/rest/v1/entreprises?select=id,raison_sociale,pays&limit=10`,
    { headers: supabaseHeaders },
  )
  pageLoadTime.add(Date.now() - start)
  requestCount.add(1)

  const ok = check(res, {
    'entreprises: status 200': (r) => r.status === 200,
    'entreprises: < 1500ms':   (r) => r.timings.duration < 1500,
  })
  errorRate.add(!ok)
  sleep(0.4)
}

// ── Main VU function ───────────────────────────────────────────────────────

export default function main() {
  const scenarios = [
    scenarioFrontendLoad,
    scenarioProductListing,
    scenarioProductSearch,
    scenariolCertificationList,
    scenarioEntrepriseListing,
  ]

  // Weight: frontend is hit more often
  const weights = [3, 3, 2, 1, 1]
  const totalWeight = weights.reduce((a, b) => a + b, 0)
  let rand = Math.random() * totalWeight
  for (let i = 0; i < scenarios.length; i++) {
    rand -= weights[i]
    if (rand <= 0) {
      scenarios[i]()
      return
    }
  }
  scenarios[0]()
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify(
      {
        metrics: {
          http_req_duration_p95: data.metrics.http_req_duration?.values?.['p(95)'],
          http_req_duration_p99: data.metrics.http_req_duration?.values?.['p(99)'],
          http_req_failed_rate:  data.metrics.http_req_failed?.values?.rate,
          total_requests:        data.metrics.total_requests?.values?.count,
        },
        thresholds_passed: !Object.values(data.metrics).some(
          (m) => m.thresholds && Object.values(m.thresholds).some((t) => !t.ok),
        ),
      },
      null,
      2,
    ),
  }
}
