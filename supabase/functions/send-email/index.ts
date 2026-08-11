import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'
import { corsHeaders, isOriginAllowed } from '../_shared/cors.ts'

type Role =
  | 'super_admin'
  | 'cemac_officer'
  | 'chamber_agent'
  | 'auditor'
  | 'company_admin'
  | 'buyer'
  | 'logistics_agent'
  | 'public'

interface CertificationPayload {
  type: 'certification_status'
  certificationId?: string
  dossierNumber?: string
  data?: { dossier?: string }
}

interface WelcomePayload {
  type: 'welcome'
  userId: string
}

interface DirectPayload {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}

type Payload = CertificationPayload | WelcomePayload | DirectPayload

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? ''
const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? ''
const appUrl = (Deno.env.get('APP_URL') ?? 'https://cemac-integra.vercel.app').replace(/\/$/, '')

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  submitted: 'Soumis',
  under_review: "En cours d'examen",
  field_validation: 'Validation terrain',
  commission_review: 'Examen commission',
  approved: 'Approuvé',
  rejected: 'Rejeté',
  suspended: 'Suspendu',
  expired: 'Expiré',
}

function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  })
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function certificationHtml(dossier: string, product: string, status: string): string {
  const label = statusLabels[status] ?? status
  return `<!doctype html>
<html lang="fr"><body style="font-family:Arial,sans-serif;background:#f4f4f5;padding:24px">
<main style="max-width:600px;margin:auto;background:white;padding:32px;border-radius:12px">
<h1 style="color:#0f3c38">CEMAC INTEGRA</h1>
<h2>Mise à jour de votre dossier</h2>
<p>Le statut de votre demande de certification a été mis à jour.</p>
<p><strong>Dossier :</strong> ${escapeHtml(dossier)}<br>
<strong>Produit :</strong> ${escapeHtml(product)}<br>
<strong>Nouveau statut :</strong> ${escapeHtml(label)}</p>
<p><a href="${escapeHtml(appUrl)}/certifications">Consulter mon dossier</a></p>
</main></body></html>`
}

function welcomeHtml(fullName: string): string {
  return `<!doctype html>
<html lang="fr"><body style="font-family:Arial,sans-serif;background:#f4f4f5;padding:24px">
<main style="max-width:600px;margin:auto;background:white;padding:32px;border-radius:12px">
<h1 style="color:#0f3c38">Bienvenue sur CEMAC INTEGRA</h1>
<p>Bonjour ${escapeHtml(fullName)},</p>
<p>Votre compte est maintenant actif.</p>
<p><a href="${escapeHtml(appUrl)}/dashboard">Accéder à mon espace</a></p>
</main></body></html>`
}

async function authenticate(req: Request): Promise<{
  internal: boolean
  role: Role | null
  userClient: SupabaseClient | null
}> {
  const authorization = req.headers.get('Authorization') ?? ''
  const token = authorization.replace(/^Bearer\s+/i, '')

  if (!token) return { internal: false, role: null, userClient: null }
  if (serviceRoleKey && token === serviceRoleKey) {
    return { internal: true, role: null, userClient: null }
  }

  const userClient = createClient(
    supabaseUrl,
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  )
  const { data: { user }, error } = await userClient.auth.getUser(token)
  if (error || !user) return { internal: false, role: null, userClient: null }

  const { data: profile } = await admin
    .from('profiles')
    .select('role, password_reset_required')
    .eq('id', user.id)
    .maybeSingle()

  return {
    internal: false,
    role: profile && !profile.password_reset_required
      ? (profile.role as Role)
      : null,
    userClient,
  }
}

async function sendEmail(payload: DirectPayload): Promise<string> {
  if (!resendApiKey || !fromEmail) {
    throw new Error('Email delivery is not configured')
  }

  const recipients = Array.isArray(payload.to) ? payload.to : [payload.to]
  if (
    recipients.length < 1 ||
    recipients.length > 10 ||
    recipients.some((email) => email.length > 254 || !email.includes('@')) ||
    payload.subject.length < 1 ||
    payload.subject.length > 200 ||
    payload.html.length > 200_000
  ) {
    throw new Error('Invalid email payload')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: recipients,
      subject: payload.subject,
      html: payload.html,
      ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
    }),
  })

  if (!response.ok) {
    console.error('[send-email] Resend rejected request', response.status)
    throw new Error('Email provider rejected the request')
  }

  const result = await response.json() as { id?: string }
  if (!result.id) throw new Error('Email provider returned an invalid response')
  return result.id
}

serve(async (req: Request) => {
  if (!isOriginAllowed(req)) return json(req, { error: 'Origin not allowed' }, 403)
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(req) })
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405)

  const contentLength = Number(req.headers.get('content-length') ?? '0')
  if (contentLength > 220_000) return json(req, { error: 'Payload too large' }, 413)

  const caller = await authenticate(req)
  if (!caller.internal && !caller.role) return json(req, { error: 'Unauthorized' }, 401)

  try {
    const payload = await req.json() as Payload

    if ('type' in payload && payload.type === 'certification_status') {
      if (
        !caller.internal &&
        !['super_admin', 'cemac_officer', 'chamber_agent', 'auditor'].includes(caller.role ?? '')
      ) {
        return json(req, { error: 'Forbidden' }, 403)
      }

      const dossier = payload.dossierNumber ?? payload.data?.dossier
      let accessibleQuery = caller.userClient
        ?.from('certifications')
        .select('id')
        .limit(1)
      accessibleQuery = payload.certificationId
        ? accessibleQuery?.eq('id', payload.certificationId)
        : accessibleQuery?.eq('numero_dossier', dossier ?? '')

      if (!caller.internal) {
        const { data: accessible } = await accessibleQuery!.maybeSingle()
        if (!accessible) return json(req, { error: 'Forbidden' }, 403)
      }

      let certificationQuery = admin
        .from('certifications')
        .select('id, numero_dossier, produit_nom, statut, entreprise:entreprises!inner(owner_id, email_contact)')
      certificationQuery = payload.certificationId
        ? certificationQuery.eq('id', payload.certificationId)
        : certificationQuery.eq('numero_dossier', dossier ?? '')

      const { data: certification, error } = await certificationQuery.maybeSingle()
      if (error || !certification) return json(req, { error: 'Certification not found' }, 404)

      const entreprise = certification.entreprise as unknown as {
        owner_id: string
        email_contact: string | null
      }
      const { data: owner } = await admin
        .from('profiles')
        .select('email')
        .eq('id', entreprise.owner_id)
        .maybeSingle()
      const recipient = entreprise.email_contact ?? owner?.email
      if (!recipient) return json(req, { error: 'Recipient not found' }, 404)

      const label = statusLabels[certification.statut] ?? certification.statut
      const id = await sendEmail({
        to: recipient,
        subject: `Dossier ${certification.numero_dossier} — ${label}`,
        html: certificationHtml(
          certification.numero_dossier,
          certification.produit_nom,
          certification.statut,
        ),
      })

      await admin.from('notifications').insert({
        user_id: entreprise.owner_id,
        type: 'certification_status',
        title: `Statut mis à jour : ${label}`,
        body: `Votre dossier ${certification.numero_dossier} est maintenant : ${label}`,
        message: `Votre dossier ${certification.numero_dossier} est maintenant : ${label}`,
        certification_id: certification.id,
      })

      return json(req, { id })
    }

    if ('type' in payload && payload.type === 'welcome') {
      if (!caller.internal && !['super_admin', 'cemac_officer'].includes(caller.role ?? '')) {
        return json(req, { error: 'Forbidden' }, 403)
      }

      const { data: profile } = await admin
        .from('profiles')
        .select('email, full_name')
        .eq('id', payload.userId)
        .maybeSingle()
      if (!profile?.email) return json(req, { error: 'Recipient not found' }, 404)

      const id = await sendEmail({
        to: profile.email,
        subject: 'Bienvenue sur CEMAC INTEGRA',
        html: welcomeHtml(profile.full_name ?? 'cher membre'),
      })
      return json(req, { id })
    }

    if (!caller.internal && !['super_admin', 'cemac_officer'].includes(caller.role ?? '')) {
      return json(req, { error: 'Forbidden' }, 403)
    }

    const direct = payload as DirectPayload
    const id = await sendEmail(direct)
    return json(req, { id })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error'
    console.error('[send-email]', message)
    const status = message === 'Invalid email payload' ? 400 : 500
    return json(req, { error: status === 400 ? message : 'Email delivery failed' }, status)
  }
})
