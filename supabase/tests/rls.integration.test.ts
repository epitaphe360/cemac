/**
 * Local-only RLS / RPC integration suite.
 *
 * Credentials come from `supabase status -o env` (or the same vars exported by CI).
 * Refuses to run against any supabase.co host.
 */
import { execFileSync } from 'node:child_process'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { beforeAll, describe, expect, it } from 'vitest'

type LocalEnv = {
  url: string
  anonKey: string
  serviceRoleKey: string
  dbUrl?: string
}

function parseStatusEnv(raw: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

function loadLocalEnv(): LocalEnv {
  const fromProcess: LocalEnv = {
    url: process.env.SUPABASE_URL || process.env.API_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || process.env.ANON_KEY || '',
    serviceRoleKey:
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || '',
    dbUrl: process.env.DB_URL || process.env.DATABASE_URL || undefined,
  }

  if (fromProcess.url && fromProcess.anonKey && fromProcess.serviceRoleKey) {
    return fromProcess
  }

  let raw: string
  try {
    raw = execFileSync('npx', ['supabase', 'status', '-o', 'env'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } catch (err) {
    throw new Error(
      `Unable to load local Supabase credentials. Start the stack with \`npx supabase start\`, then re-run. ${(err as Error).message}`,
    )
  }

  const parsed = parseStatusEnv(raw)
  return {
    url: parsed.API_URL || parsed.SUPABASE_URL || '',
    anonKey: parsed.ANON_KEY || parsed.SUPABASE_ANON_KEY || '',
    serviceRoleKey: parsed.SERVICE_ROLE_KEY || parsed.SUPABASE_SERVICE_ROLE_KEY || '',
    dbUrl: parsed.DB_URL || parsed.DATABASE_URL,
  }
}

function assertLocalOnly(url: string): void {
  if (!url) {
    throw new Error('Missing Supabase URL for RLS integration tests')
  }
  if (/supabase\.co/i.test(url)) {
    throw new Error(
      `Refusing to run RLS integration tests against a hosted supabase.co URL (${url}). Use the ephemeral local stack only.`,
    )
  }
}

function hex64(seed: string): string {
  // Deterministic 64-char hex for consume_rate_limit identifier_hash validation.
  let out = ''
  for (let i = 0; out.length < 64; i += 1) {
    out += seed.charCodeAt(i % seed.length).toString(16).padStart(2, '0')
  }
  return out.slice(0, 64)
}

function assertExpeditionsRlsEnabled(): void {
  const sql =
    "SELECT relrowsecurity::text FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'expeditions';"
  const container = 'supabase_db_cemac-integra'
  try {
    const out = execFileSync(
      'docker',
      ['exec', container, 'psql', '-U', 'postgres', '-d', 'postgres', '-tAc', sql],
      { encoding: 'utf8' },
    ).trim()
    if (out !== 't') {
      throw new Error(`expeditions.relrowsecurity expected t, got ${JSON.stringify(out)}`)
    }
    return
  } catch (dockerErr) {
    // Fallback when docker exec is unavailable: DB_URL via psql if present.
    const dbUrl = process.env.DB_URL || process.env.DATABASE_URL
    if (!dbUrl) {
      throw new Error(
        `Unable to verify expeditions RLS (docker exec failed and DB_URL missing): ${(dockerErr as Error).message}`,
      )
    }
    const out = execFileSync('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-tAc', sql], {
      encoding: 'utf8',
    }).trim()
    if (out !== 't') {
      throw new Error(`expeditions.relrowsecurity expected t, got ${JSON.stringify(out)}`)
    }
  }
}

describe('RLS / RPC integration (local ephemeral Supabase)', () => {
  let env: LocalEnv
  let anon: SupabaseClient
  let service: SupabaseClient
  let companyUserId: string
  let companyEmail: string
  let companyPassword: string
  let companyClient: SupabaseClient

  beforeAll(async () => {
    env = loadLocalEnv()
    assertLocalOnly(env.url)

    if (!env.anonKey || !env.serviceRoleKey) {
      throw new Error('Missing ANON_KEY / SERVICE_ROLE_KEY for local Supabase stack')
    }

    anon = createClient(env.url, env.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    service = createClient(env.url, env.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    companyEmail = `rls-company-${Date.now()}@example.com`
    companyPassword = 'TestRls@2026!Secure'
    const { data: created, error: createErr } = await service.auth.admin.createUser({
      email: companyEmail,
      password: companyPassword,
      email_confirm: true,
      user_metadata: { full_name: 'RLS Company Admin' },
    })
    if (createErr || !created.user) {
      throw new Error(`Failed to create company_admin test user: ${createErr?.message}`)
    }
    companyUserId = created.user.id

    // handle_new_user assigns company_admin; ensure it for fail-closed assertions.
    const { error: roleErr } = await service
      .from('profiles')
      .update({ role: 'company_admin', password_reset_required: false })
      .eq('id', companyUserId)
    if (roleErr) {
      throw new Error(`Failed to set company_admin role: ${roleErr.message}`)
    }

    companyClient = createClient(env.url, env.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { error: signInErr } = await companyClient.auth.signInWithPassword({
      email: companyEmail,
      password: companyPassword,
    })
    if (signInErr) {
      throw new Error(`Failed to sign in company_admin: ${signInErr.message}`)
    }
  }, 60_000)

  it('consume_rate_limit requires service_role', async () => {
    const params = {
      p_scope: 'ci:rls',
      p_identifier_hash: hex64('anon-denied'),
      p_limit: 5,
      p_window_seconds: 60,
    }

    const anonResult = await anon.rpc('consume_rate_limit', params)
    expect(anonResult.error).toBeTruthy()

    const authResult = await companyClient.rpc('consume_rate_limit', {
      ...params,
      p_identifier_hash: hex64('auth-denied'),
    })
    expect(authResult.error).toBeTruthy()

    const serviceResult = await service.rpc('consume_rate_limit', {
      ...params,
      p_identifier_hash: hex64('service-ok'),
    })
    expect(serviceResult.error).toBeNull()
    expect(serviceResult.data).toMatchObject({
      allowed: true,
    })
  })

  it('company_admin cannot escalate role via direct update', async () => {
    const { error } = await companyClient
      .from('profiles')
      .update({ role: 'super_admin' })
      .eq('id', companyUserId)

    expect(error).toBeTruthy()

    const { data: profile, error: readErr } = await service
      .from('profiles')
      .select('role')
      .eq('id', companyUserId)
      .single()

    expect(readErr).toBeNull()
    expect(profile?.role).toBe('company_admin')
  })

  it('CMS public read is published-only for anon', async () => {
    const draftSlug = `rls-draft-${Date.now()}`
    const { data: draft, error: insertErr } = await service
      .from('team_members')
      .insert({
        slug: draftSlug,
        full_name: 'Draft Only',
        role: { fr: 'Brouillon', en: 'Draft' },
        country_label: { fr: 'Cameroun', en: 'Cameroon' },
        initials: 'DO',
        sort_order: 9999,
        is_published: false,
      })
      .select('id, slug, is_published')
      .single()

    expect(insertErr).toBeNull()
    expect(draft?.is_published).toBe(false)

    const { data: publishedRows, error: pubErr } = await anon
      .from('team_members')
      .select('id, slug, is_published')

    expect(pubErr).toBeNull()
    expect(Array.isArray(publishedRows)).toBe(true)
    expect(publishedRows!.every((row) => row.is_published === true)).toBe(true)
    expect(publishedRows!.some((row) => row.id === draft!.id)).toBe(false)

    const { data: draftViaAnon, error: draftErr } = await anon
      .from('team_members')
      .select('id')
      .eq('id', draft!.id)

    expect(draftErr).toBeNull()
    expect(draftViaAnon ?? []).toHaveLength(0)

    await service.from('team_members').delete().eq('id', draft!.id)
  })

  it('anon can read published marketplace products with nested certifications', async () => {
    const { data, error } = await anon
      .from('produits')
      .select(`
        id,
        nom,
        is_published,
        entreprise:entreprises (
          id,
          is_verified,
          certifications ( id, statut, type_certification )
        )
      `)
      .eq('is_published', true)
      .limit(5)

    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
  })

  it('expeditions table exists and has RLS enabled', async () => {
    const { error } = await service.from('expeditions').select('id').limit(1)
    expect(error).toBeNull()

    const { data: anonRows, error: anonErr } = await anon.from('expeditions').select('id').limit(5)
    // Anon has no SELECT grant / no public policy — either error or empty is fail-closed.
    if (!anonErr) {
      expect(anonRows ?? []).toHaveLength(0)
    } else {
      expect(anonErr).toBeTruthy()
    }

    assertExpeditionsRlsEnabled()
  })
})
