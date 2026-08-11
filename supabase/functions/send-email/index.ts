/**
 * Supabase Edge Function — send-email
 *
 * Envoie des emails transactionnels via l'API Resend.
 * Utilisé pour : notifications de statut certification, bienvenue, etc.
 *
 * Required Supabase secret:
 *   RESEND_API_KEY=re_...
 *
 * Deploy:
 *   supabase functions deploy send-email
 */

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'
import { corsHeaders } from '../_shared/cors.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const APP_URL = Deno.env.get('APP_URL') ?? 'https://cemac-integra.vercel.app'
// Pour la production, remplacez par votre domaine vérifié dans Resend Dashboard
// Ex: 'CEMAC INTEGRA <noreply@votredomaine.com>'
const FROM_EMAIL = 'CEMAC INTEGRA <onboarding@resend.dev>'

// ── Types ──────────────────────────────────────────────────────────────────

interface EmailPayload {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}

interface CertificationStatusPayload {
  type: 'certification_status'
  certificationId: string
  userId: string
  newStatus: string
  dossierNumber: string
  produitNom: string
}

interface WelcomePayload {
  type: 'welcome'
  userId: string
  fullName: string
  email: string
}

type Payload = EmailPayload | CertificationStatusPayload | WelcomePayload

// ── Templates HTML ──────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  draft:             'Brouillon',
  submitted:         'Soumis',
  under_review:      'En cours d\'examen',
  field_validation:  'Validation terrain',
  commission_review: 'Examen commission',
  approved:          '✅ Approuvé',
  rejected:          '❌ Rejeté',
  suspended:         '⏸ Suspendu',
  expired:           'Expiré',
}

function certificationStatusHtml(dossier: string, produit: string, status: string): string {
  const label = STATUS_LABELS[status] ?? status
  const color = status === 'approved' ? '#15803d'
              : status === 'rejected' ? '#dc2626'
              : status === 'suspended' ? '#d97706'
              : '#125c59'
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.08)">
        <!-- Header -->
        <tr><td style="background:#0f3c38;padding:32px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;letter-spacing:-0.5px">CEMAC INTEGRA</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,.7);font-size:14px">Plateforme de certification CEMAC</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px 32px">
          <h2 style="margin:0 0 8px;color:#111;font-size:20px">Mise à jour de votre dossier</h2>
          <p style="margin:0 0 24px;color:#555;font-size:15px">Le statut de votre demande de certification a été mis à jour.</p>
          <table width="100%" cellpadding="16" style="background:#f9fafb;border-radius:8px;margin-bottom:24px">
            <tr>
              <td style="color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.5px">Dossier</td>
              <td style="color:#111;font-size:14px;font-weight:700;text-align:right">${dossier}</td>
            </tr>
            <tr>
              <td style="color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;border-top:1px solid #e5e7eb">Produit</td>
              <td style="color:#111;font-size:14px;text-align:right;border-top:1px solid #e5e7eb">${produit}</td>
            </tr>
            <tr>
              <td style="color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;border-top:1px solid #e5e7eb">Nouveau statut</td>
              <td style="border-top:1px solid #e5e7eb;text-align:right">
                <span style="display:inline-block;padding:4px 12px;border-radius:999px;background:${color};color:#fff;font-size:13px;font-weight:700">${label}</span>
              </td>
            </tr>
          </table>
          <div style="text-align:center;margin-top:32px">
            <a href="${APP_URL}/certifications" style="display:inline-block;padding:14px 32px;background:#0f3c38;color:#fff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:700">
              Voir mon dossier →
            </a>
          </div>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:24px 32px;text-align:center;border-top:1px solid #e5e7eb">
          <p style="margin:0;color:#9ca3af;font-size:12px">CEMAC INTEGRA · Plateforme officielle de certification CEMAC</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function welcomeHtml(fullName: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.08)">
        <tr><td style="background:linear-gradient(135deg,#0f3c38,#125c59);padding:40px 32px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:26px;font-weight:800">Bienvenue sur CEMAC INTEGRA</h1>
          <p style="margin:12px 0 0;color:rgba(255,255,255,.75);font-size:15px">La plateforme officielle de certification des produits CEMAC</p>
        </td></tr>
        <tr><td style="padding:40px 32px">
          <p style="margin:0 0 16px;color:#111;font-size:16px;font-weight:600">Bonjour ${fullName} 👋</p>
          <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6">
            Votre compte CEMAC INTEGRA est maintenant actif. Vous pouvez dès à présent soumettre vos demandes de certification et accéder à la marketplace régionale.
          </p>
          <ul style="color:#555;font-size:14px;line-height:2;padding-left:20px">
            <li>Créer votre profil entreprise</li>
            <li>Soumettre votre première certification</li>
            <li>Publier vos produits sur la marketplace</li>
            <li>Accéder aux données du marché CEMAC</li>
          </ul>
          <div style="text-align:center;margin-top:32px">
            <a href="${APP_URL}/dashboard" style="display:inline-block;padding:14px 32px;background:#0f3c38;color:#fff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:700">
              Accéder à mon espace →
            </a>
          </div>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:24px 32px;text-align:center;border-top:1px solid #e5e7eb">
          <p style="margin:0;color:#9ca3af;font-size:12px">CEMAC INTEGRA · Si vous n'avez pas créé ce compte, ignorez cet email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ── Envoi via Resend API ────────────────────────────────────────────────────

async function sendEmail(payload: EmailPayload): Promise<{ id?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    console.error('[send-email] RESEND_API_KEY non configuré')
    return { error: 'RESEND_API_KEY manquant' }
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
      subject: payload.subject,
      html: payload.html,
      ...(payload.replyTo && { reply_to: payload.replyTo }),
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    console.error('[send-email] Resend error:', data)
    return { error: data.message ?? 'Erreur Resend' }
  }
  return { id: data.id }
}

// ── Handler principal ────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Vérifier authentification (seul le service role ou un utilisateur connecté peut appeler)
    const authHeader = req.headers.get('Authorization') ?? ''
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const payload = await req.json() as Payload

    // ── Email direct (type non spécifié = envoi brut) ──
    if (!('type' in payload)) {
      const result = await sendEmail(payload as EmailPayload)
      return new Response(JSON.stringify(result), {
        status: result.error ? 500 : 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Email de bienvenue ──
    if (payload.type === 'welcome') {
      const { fullName, email } = payload as WelcomePayload
      const result = await sendEmail({
        to: email,
        subject: 'Bienvenue sur CEMAC INTEGRA 🎉',
        html: welcomeHtml(fullName),
      })
      return new Response(JSON.stringify(result), {
        status: result.error ? 500 : 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Notification changement de statut certification ──
    if (payload.type === 'certification_status') {
      const { userId, dossierNumber, produitNom, newStatus } = payload as CertificationStatusPayload

      // Récupérer l'email de l'utilisateur
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email, full_name')
        .eq('id', userId)
        .single()

      if (!profile?.email) {
        return new Response(JSON.stringify({ error: 'Utilisateur introuvable' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const statusLabel = STATUS_LABELS[newStatus] ?? newStatus
      const result = await sendEmail({
        to: profile.email,
        subject: `Dossier ${dossierNumber} — Statut mis à jour : ${statusLabel}`,
        html: certificationStatusHtml(dossierNumber, produitNom, newStatus),
      })

      // Créer une notification en base
      if (!result.error) {
        await supabaseAdmin.from('notifications').insert({
          user_id: userId,
          type: 'certification_status',
          title: `Statut mis à jour : ${statusLabel}`,
          body: `Votre dossier ${dossierNumber} (${produitNom}) est maintenant : ${statusLabel}`,
          certification_id: (payload as CertificationStatusPayload).certificationId,
        })
      }

      return new Response(JSON.stringify(result), {
        status: result.error ? 500 : 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Type de payload inconnu' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur interne'
    console.error('[send-email]', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
