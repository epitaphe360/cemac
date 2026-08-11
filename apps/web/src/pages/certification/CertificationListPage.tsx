import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Filter, Award, CheckCircle, Clock, Building2, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatDate } from '@/lib/utils'
import { CERTIFICATION_STATUSES } from '@/lib/constants'
import type { Certification } from '@/types'

type CertRow = Certification & { entreprise?: { raison_sociale: string; pays: string } | null }

export function CertificationListPage() {
  const { t } = useTranslation()
  const profile = useAuthStore((s) => s.profile)
  const entreprise = useAuthStore((s) => s.entreprise)
  const [certifications, setCertifications] = useState<CertRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const role = profile?.role ?? 'public'
  const isCompanyAdmin = role === 'company_admin'

  useEffect(() => {
    if (isCompanyAdmin && !entreprise?.id) { setLoading(false); return }

    const fetchCerts = async () => {
      let query = supabase
        .from('certifications')
        .select('*, entreprise:entreprises(raison_sociale, pays)')
        .order('created_at', { ascending: false })

      if (isCompanyAdmin) {
        query = query.eq('entreprise_id', entreprise!.id)
      } else if (role === 'chamber_agent') {
        query = query.in('statut', ['submitted', 'under_review', 'field_validation'])
      } else if (role === 'auditor') {
        query = query.in('statut', ['under_review', 'field_validation'])
      } else if (role === 'cemac_officer') {
        query = query.in('statut', ['under_review', 'field_validation', 'commission_review'])
      }
      // super_admin: no additional filter — sees all

      const { data, error } = await query
      if (!error && data) setCertifications(data as CertRow[])
      setLoading(false)
    }

    fetchCerts()

    // Realtime subscription (company_admin only — tracks own enterprise)
    if (!isCompanyAdmin || !entreprise?.id) return

    const channel = supabase
      .channel(`certifications-${entreprise.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'certifications',
        filter: `entreprise_id=eq.${entreprise.id}`,
      }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setCertifications((prev) =>
            prev.map((c) => c.id === payload.new.id ? payload.new as Certification : c)
          )
        } else if (payload.eventType === 'INSERT') {
          setCertifications((prev) => [payload.new as Certification, ...prev])
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [entreprise, isCompanyAdmin, role])

  const filtered = certifications.filter((c) => {
    const matchSearch = c.produit_nom.toLowerCase().includes(search.toLowerCase())
      || c.numero_dossier.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || c.statut === filterStatus
    return matchSearch && matchStatus
  })

  if (loading) return <LoadingSpinner size="lg" className="mt-20" />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#173b57_0%,#115e59_55%,#d4a62f_135%)] px-6 py-7 text-white shadow-[0_20px_60px_rgba(18,66,93,0.22)] sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_24%)]" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="hero-chip mb-4 border-white/15 bg-white/10 text-white">{t('certification.list.badge')}</div>
          <h1 className="text-3xl font-black tracking-tight text-white">{t('certification.list.title')}</h1>
          <p className="mt-2 text-sm text-white/75">
            {t('certification.list.count', { count: certifications.length })}
          </p>
        </div>
        {isCompanyAdmin && (
          <Link to="/certifications/new">
            <Button className="bg-white text-cemac-900 hover:bg-white/90">
              <Plus className="h-4 w-4" />
              {t('certification.list.new_file')}
            </Button>
          </Link>
        )}
        </div>
      </div>

      {/* Filtres */}
      <div className="app-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('certification.list.search_placeholder')}
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <select
            className="h-10 rounded-xl border border-input bg-white/85 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-cemac-600"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">{t('certification.list.all_statuses')}</option>
            {Object.entries(CERTIFICATION_STATUSES).map(([, v]) => (
              <option key={v} value={v}>{v.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      {!loading && certifications.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total dossiers', value: certifications.length, icon: Award, cls: 'bg-cemac-50 text-cemac-800 border-cemac-100' },
            { label: 'Approuvés', value: certifications.filter(c => c.statut === 'approved').length, icon: CheckCircle, cls: 'bg-green-50 text-green-800 border-green-100' },
            { label: 'En cours', value: certifications.filter(c => !['approved', 'rejected', 'draft', 'suspended', 'expired'].includes(c.statut)).length, icon: Clock, cls: 'bg-blue-50 text-blue-800 border-blue-100' },
            { label: 'Brouillons', value: certifications.filter(c => c.statut === 'draft').length, icon: Award, cls: 'bg-gray-50 text-gray-600 border-gray-200' },
          ].map(s => (
            <div key={s.label} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm ${s.cls}`}>
              <s.icon className="h-4 w-4 shrink-0" />
              <div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs opacity-70 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">{t('certification.list.no_results')}</p>
          <p className="text-sm mt-1">{t('certification.list.no_results_hint')}</p>
          {isCompanyAdmin && (
            <Link to="/certifications/new">
              <Button className="mt-4">
                <Plus className="h-4 w-4" />
                {t('certification.list.submit_first')}
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((cert) => (
            <Link key={cert.id} to={`/certifications/${cert.id}`}>
              <Card className="cursor-pointer border-white/80 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_35px_rgba(10,45,39,0.1)]">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900">{cert.produit_nom}</p>
                        <StatusBadge status={cert.statut} />
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span>{cert.numero_dossier}</span>
                        <span>·</span>
                        <span className="capitalize">{cert.type_certification.replace(/_/g, ' ')}</span>
                        <span>·</span>
                        <span>{formatDate(cert.created_at)}</span>
                      </div>
                      {!isCompanyAdmin && cert.entreprise && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-cemac-700 font-medium">
                          <Building2 className="h-3 w-3" />
                          <span>{cert.entreprise.raison_sociale} · {cert.entreprise.pays}</span>
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      {cert.date_expiration && (
                        <div className="text-right text-xs">
                          <p className="text-muted-foreground">Expire le</p>
                          <p className="font-medium">{formatDate(cert.date_expiration)}</p>
                        </div>
                      )}
                      <ChevronRight className="h-4 w-4 text-gray-300" />
                    </div>
                  </div>
                  {/* Workflow progress dots */}
                  {(() => {
                    const wfSteps = ['draft', 'submitted', 'under_review', 'field_validation', 'commission_review', 'approved']
                    const wfLabels = ['Brouillon', 'Soumis', 'Révision', 'Terrain', 'Commission', 'Approuvé']
                    const isTerminal = ['rejected', 'suspended', 'expired'].includes(cert.statut)
                    const idx = wfSteps.indexOf(cert.statut)
                    return (
                      <div className="mt-3 flex items-center">
                        {wfSteps.map((step, i) => (
                          <div key={step} className="flex items-center">
                            <div
                              title={wfLabels[i]}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                isTerminal ? 'bg-red-200' :
                                i < idx ? 'bg-cemac-500' :
                                i === idx ? 'bg-cemac-700 ring-2 ring-cemac-200 ring-offset-1' :
                                'bg-gray-200'
                              }`}
                            />
                            {i < wfSteps.length - 1 && (
                              <div className={`w-6 h-0.5 ${i < idx && !isTerminal ? 'bg-cemac-300' : 'bg-gray-200'}`} />
                            )}
                          </div>
                        ))}
                        {isTerminal && (
                          <span className="ml-3 text-xs text-red-500 font-medium">
                            {cert.statut === 'rejected' ? 'Rejeté' : cert.statut === 'suspended' ? 'Suspendu' : 'Expiré'}
                          </span>
                        )}
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
