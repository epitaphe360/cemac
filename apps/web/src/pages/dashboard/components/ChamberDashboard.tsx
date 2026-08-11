import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ClipboardCheck, Building2, MapPin, ArrowRight, AlertCircle, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { Certification } from '@/types'

export function ChamberDashboard() {
  const { t } = useTranslation()
  const profile = useAuthStore((s) => s.profile)
  
  const [stats, setStats] = useState({ fieldValidation: 0, newSubmissions: 0, companies: 0 })
  const [nationalCerts, setNationalCerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.country) {
        setLoading(false)
        return
    }

    const fetchData = async () => {
      // Pour les stats, on compte côté client pour ce prototype, idéalement via une RPC
      const country = profile.country

      const { data: companies } = await supabase.from('entreprises').select('id').eq('pays', country || '')
      
      const { data: certs } = await supabase
        .from('certifications')
        .select(`id, statut, produit_nom, entreprise_id, entreprise:entreprises!inner(pays, raison_sociale)`)
        .eq('entreprise.pays', country || '')

      if (certs) {
        setStats({
          fieldValidation: certs.filter(c => c.statut === 'field_validation').length,
          newSubmissions: certs.filter(c => c.statut === 'submitted' || c.statut === 'under_review').length,
          companies: companies?.length || 0
        })
      }

      const { data: recentCerts } = await supabase
        .from('certifications')
        .select(`*, entreprise:entreprises!inner(raison_sociale, pays)`)
        .eq('entreprise.pays', country || '')
        .in('statut', ['submitted', 'field_validation'])
        .order('updated_at', { ascending: false })
        .limit(5)
      
      if (recentCerts) setNationalCerts(recentCerts)
      setLoading(false)
    }

    fetchData()
  }, [profile?.country])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('dashboard.chamber.title', { country: profile?.country || t('dashboard.chamber.national') })}
          </h1>
          <p className="text-muted-foreground mt-1">{t('dashboard.chamber.description')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-xl bg-orange-50"><ClipboardCheck className="h-5 w-5 text-orange-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '…' : stats.fieldValidation}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('dashboard.chamber.field_visits')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-xl bg-blue-50"><FileText className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '…' : stats.newSubmissions}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('dashboard.chamber.files_to_review')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-xl bg-gray-100"><Building2 className="h-5 w-5 text-gray-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '…' : stats.companies}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('dashboard.chamber.local_companies')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t('dashboard.chamber.inspections')}</CardTitle>
              <Link to="/certifications" className="text-sm text-cemac-700 hover:underline flex items-center gap-1">
                {t('common.view_all')} <ArrowRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}</div>
              ) : nationalCerts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">{t('dashboard.chamber.no_files')}</p>
              ) : (
                <div className="space-y-2">
                  {nationalCerts.map((cert) => (
                    <Link key={cert.id} to={`/certifications/${cert.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100">
                        <div>
                          <p className="text-sm font-medium">{cert.produit_nom}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" /> {cert.entreprise?.raison_sociale}
                          </p>
                        </div>
                        <StatusBadge status={cert.statut} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
           <Card className="bg-orange-50 border-orange-100">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2 text-orange-800">
                <AlertCircle className="h-5 w-5" />
                <h3 className="font-semibold">{t('dashboard.chamber.alert_title')}</h3>
              </div>
              <p className="text-sm text-orange-700 mb-4">
                {t('dashboard.chamber.alert_description')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}