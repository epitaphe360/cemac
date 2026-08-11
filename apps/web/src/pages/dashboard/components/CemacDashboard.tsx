import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Award, ShieldCheck, CheckCircle, Clock, AlertTriangle, ArrowRight, BarChart3, Globe } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDate } from '@/lib/utils'
import type { Certification } from '@/types'

export function CemacDashboard() {
  const { t } = useTranslation()
  const profile = useAuthStore((s) => s.profile)
  
  const [stats, setStats] = useState({ commissionReview: 0, totalApproved: 0, pendingGlobal: 0 })
  const [pendingCerts, setPendingCerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      // Statistiques globales
      const { data: allCerts } = await supabase.from('certifications').select('statut')
      if (allCerts) {
        setStats({
          commissionReview: allCerts.filter(c => c.statut === 'commission_review').length,
          totalApproved: allCerts.filter(c => c.statut === 'approved').length,
          pendingGlobal: allCerts.filter(c => !['approved', 'rejected', 'draft'].includes(c.statut)).length
        })
      }

      // Dossiers à valider (commission_review)
      const { data: certsData } = await supabase
        .from('certifications')
        .select(`*, entreprise:entreprises!certifications_entreprise_id_fkey(raison_sociale, pays)`)
        .eq('statut', 'commission_review')
        .order('updated_at', { ascending: false })
        .limit(5)
      
      if (certsData) {
        setPendingCerts(certsData)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('dashboard.cemac.title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('dashboard.cemac.greeting', { name: profile?.full_name?.split(' ')[0] ?? '' })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-cemac-50 border-cemac-100">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-xl bg-cemac-100"><ShieldCheck className="h-5 w-5 text-cemac-700" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '…' : stats.commissionReview}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('dashboard.cemac.commission_pending')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-xl bg-green-50"><CheckCircle className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '…' : stats.totalApproved}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('dashboard.cemac.total_approved')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-xl bg-yellow-50"><Clock className="h-5 w-5 text-yellow-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '…' : stats.pendingGlobal}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('dashboard.cemac.pending_global')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t('dashboard.cemac.commission_files')}</CardTitle>
              <Link to="/certifications?status=commission_review" className="text-sm text-cemac-700 hover:underline flex items-center gap-1">
                {t('common.manage')} <ArrowRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}</div>
              ) : pendingCerts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">{t('dashboard.cemac.no_pending')}</p>
              ) : (
                <div className="space-y-2">
                  {pendingCerts.map((cert) => (
                    <Link key={cert.id} to={`/certifications/${cert.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100">
                        <div>
                          <p className="text-sm font-medium">{cert.produit_nom}</p>
                          <p className="text-xs text-muted-foreground">{cert.entreprise?.raison_sociale} · {cert.entreprise?.pays}</p>
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
           <Card>
            <CardHeader><CardTitle className="text-base">{t('dashboard.quick_actions')}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Link to="/admin"><Button variant="outline" className="w-full justify-start gap-3"><BarChart3 className="h-4 w-4 text-gray-600"/> {t('dashboard.cemac.admin_view')}</Button></Link>
              <Link to="/market-intelligence"><Button variant="outline" className="w-full justify-start gap-3"><Globe className="h-4 w-4 text-blue-600"/> {t('dashboard.cemac.regional_market')}</Button></Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}