import { LoadingSpinner, PageLoader, LoadingTableFull, LoadingCard } from "@/components/shared/LoadingSpinner";
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Clock, QrCode, ArrowLeft, Shield } from 'lucide-react'
import QRCode from 'qrcode'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useTranslation } from 'react-i18next'

import { formatDate } from '@/lib/utils'
import type { Certification } from '@/types'

export function VerifyCertificationPage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const [cert, setCert] = useState<Certification | null>(null)
  const [entreprise, setEntreprise] = useState<{ raison_sociale: string; pays: string } | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    const fetch = async () => {
      const { data, error } = await supabase
        .from('certifications')
        .select('*, entreprises(raison_sociale, pays)')
        .eq('id', id)
        .single()

      if (error || !data) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setCert(data)
      if (data.entreprises) setEntreprise(data.entreprises as unknown as { raison_sociale: string; pays: string })

      // Generate QR code image from the current page URL
      const verifyUrl = `${window.location.origin}/verify/${id}`
      const url = await QRCode.toDataURL(verifyUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#1d3937', light: '#ffffff' },
      })
      setQrDataUrl(url)
      setLoading(false)
    }
    fetch()
  }, [id])

  if (loading) return <PageLoader />

  if (notFound) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(20,129,110,0.12),transparent_22%),linear-gradient(180deg,#f5faf8_0%,#edf7f4_100%)] flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4 text-center">
            <XCircle className="h-16 w-16 text-red-400" />
            <h1 className="text-xl font-bold text-gray-900">{t('verify.not_found_title')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('verify.not_found_description')}
            </p>
            <Link to="/" className="text-cemac-700 text-sm hover:underline flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> {t('verify.back_home')}
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!cert) return null

  const isApproved = cert.statut === 'approved'
  const isExpired  = cert.statut === 'expired'
  const isSuspended = cert.statut === 'suspended'
  const isValid = isApproved && !isExpired && !isSuspended

  const CERT_TYPE_LABELS: Record<string, string> = {
    made_in_cemac: t('certification.type.made_in_cemac'),
    origine_cemac: t('certification.type.origine_cemac'),
    qualite_plus:  t('certification.type.qualite_plus'),
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,212,92,0.16),transparent_18%),radial-gradient(circle_at_bottom_right,rgba(31,167,139,0.2),transparent_22%),linear-gradient(135deg,#103633_0%,#145e59_56%,#1f3d68_100%)] flex items-center justify-center p-6">
      <div className="max-w-lg w-full space-y-4">
        {/* Header badge */}
        <div className="flex items-center justify-center gap-2 text-white/85 text-sm">
          <Shield className="h-4 w-4" />
          <span>{t('verify.secure_badge')}</span>
        </div>

        <Card className="overflow-hidden shadow-2xl">
          {/* Status banner */}
          <div className={`px-6 py-4 flex items-center gap-3 ${
            isValid     ? 'bg-green-50 border-b border-green-100'
            : isExpired ? 'bg-yellow-50 border-b border-yellow-100'
            : isSuspended ? 'bg-orange-50 border-b border-orange-100'
            : 'bg-red-50 border-b border-red-100'
          }`}>
            {isValid ? (
              <CheckCircle className="h-8 w-8 text-green-500 shrink-0" />
            ) : (
              <XCircle className="h-8 w-8 text-red-400 shrink-0" />
            )}
            <div>
              <p className={`font-bold text-lg ${isValid ? 'text-green-800' : 'text-red-600'}`}>
                {isValid ? t('verify.status.valid') : isExpired ? t('verify.status.expired') : isSuspended ? t('verify.status.suspended') : t('verify.status.not_approved')}
              </p>
              <p className="text-xs text-muted-foreground">
                {isValid
                  ? t('verify.status.valid_description')
                  : t('verify.status.invalid_description')}
              </p>
            </div>
          </div>

          <CardContent className="pt-6 pb-6 space-y-5">
            {/* Infos principales */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('verify.fields.product')}</p>
                <p className="font-semibold text-gray-900 text-base mt-0.5">{cert.produit_nom}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('verify.fields.file_number')}</p>
                <p className="font-mono text-sm font-bold text-cemac-800 mt-0.5">{cert.numero_dossier}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('verify.fields.type')}</p>
                <p className="font-medium mt-0.5">{CERT_TYPE_LABELS[cert.type_certification] ?? cert.type_certification}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('verify.fields.company')}</p>
                <p className="font-medium mt-0.5">{entreprise?.raison_sociale ?? '—'}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('verify.fields.production_country')}</p>
                <p className="font-medium mt-0.5">{cert.pays_production}</p>
              </div>

              {cert.date_approbation && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('verify.fields.approval_date')}</p>
                  <p className="font-medium mt-0.5 text-green-700">{formatDate(cert.date_approbation)}</p>
                </div>
              )}

              {cert.date_expiration && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('verify.fields.expiration_date')}</p>
                  <p className={`font-medium mt-0.5 ${isExpired ? 'text-red-600' : ''}`}>{formatDate(cert.date_expiration)}</p>
                </div>
              )}

              {cert.valeur_ajoutee_locale && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('verify.fields.local_value')}</p>
                  <p className="font-medium mt-0.5">{cert.valeur_ajoutee_locale}%</p>
                </div>
              )}
            </div>

            {/* Statut badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{t('verify.fields.status')}</span>
              <StatusBadge status={cert.statut} />
            </div>

            {/* QR Code affiché ici aussi */}
            {qrDataUrl && (
              <div className="flex flex-col items-center gap-2 pt-2 border-t border-gray-100">
                <QrCode className="h-4 w-4 text-muted-foreground" />
                <img src={qrDataUrl} alt="QR Code certification" className="w-28 h-28" />
                <p className="text-xs text-muted-foreground text-center">
                  {t('verify.scan_hint')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-2 text-white/70 text-xs">
          <Clock className="h-3 w-3" />
          <span>{t('verify.checked_at', { date: new Date().toLocaleDateString(i18n.language || 'fr', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) })}</span>
        </div>

        <div className="text-center">
          <Link to="/" className="text-white/70 text-xs hover:text-white flex items-center gap-1 justify-center">
            <ArrowLeft className="h-3 w-3" /> {t('verify.brand_link')}
          </Link>
        </div>
      </div>
    </div>
  )
}
