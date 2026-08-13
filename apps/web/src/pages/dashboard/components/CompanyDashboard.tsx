import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Award, ShoppingBag, Clock, CheckCircle, Plus, ArrowRight, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDate } from '@/lib/utils'
import type { Certification } from '@/types'
import toast from 'react-hot-toast'

interface Stats {
  totalCertifications: number
  approved: number
  pending: number
  products: number
}

export function CompanyDashboard() {
  const { t } = useTranslation()
  const entreprise = useAuthStore((s) => s.entreprise)
  const profile = useAuthStore((s) => s.profile)

  const [stats, setStats] = useState<Stats>({ totalCertifications: 0, approved: 0, pending: 0, products: 0 })
  const [recentCerts, setRecentCerts] = useState<Certification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!entreprise?.id) { setLoading(false); return }

    const fetchData = async () => {
      const [certsStatsRes, certsRecentRes, productsRes] = await Promise.all([
        supabase
          .from('certifications')
          .select('statut')
          .eq('entreprise_id', entreprise.id),
        supabase
          .from('certifications')
          .select('*')
          .eq('entreprise_id', entreprise.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('produits')
          .select('id', { count: 'exact', head: true })
          .eq('entreprise_id', entreprise.id),
      ])

      if (certsStatsRes.error || certsRecentRes.error || productsRes.error) {
        toast.error('Impossible de charger toutes les données du tableau de bord')
      }
      if (certsRecentRes.data) setRecentCerts(certsRecentRes.data)
      if (certsStatsRes.data) {
        const allCerts = certsStatsRes.data
        setStats({
          totalCertifications: allCerts.length,
          approved: allCerts.filter((c) => c.statut === 'approved').length,
          pending: allCerts.filter((c) => !['approved', 'rejected', 'draft'].includes(c.statut)).length,
          products: productsRes.count ?? 0,
        })
      }
      setLoading(false)
    }

    fetchData()
  }, [entreprise?.id])

  const statCards = [
    { label: t('dashboard.stats.certifications'), value: stats.totalCertifications, icon: Award, color: 'text-cemac-700', bg: 'bg-cemac-50' },
    { label: t('dashboard.stats.approved'),        value: stats.approved,            icon: CheckCircle, color: 'text-cemac-600', bg: 'bg-cemac-50' },
    { label: t('dashboard.stats.pending'),         value: stats.pending,             icon: Clock, color: 'text-gold-700', bg: 'bg-gold-50' },
    { label: t('dashboard.stats.products'),        value: stats.products,            icon: ShoppingBag, color: 'text-cemac-800', bg: 'bg-cemac-100' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* En-tête */}
      <div className="page-hero">
        <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="hero-chip mb-4 border-white/15 bg-white/10 text-white">{t('dashboard.company.badge')}</div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            {t('dashboard.welcome')}, {profile?.full_name?.split(' ')[0]}
          </h1>
          {entreprise && (
            <p className="mt-2 max-w-2xl text-sm text-white/75">{entreprise.raison_sociale} · {entreprise.pays} · {t('dashboard.company.summary')}</p>
          )}
        </div>
        <Link to="/certifications/new">
          <Button className="bg-white text-cemac-900 hover:bg-white/90">
            <Plus className="h-4 w-4" />
            {t('certification.new')}
          </Button>
        </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="metric-card hover:-translate-y-1">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className={`p-3 rounded-xl ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '…' : value}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Certifications récentes */}
        <div className="lg:col-span-2">
          <Card className="metric-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t('dashboard.company.recent_certifications')}</CardTitle>
              <Link to="/certifications" className="text-sm text-cemac-700 hover:underline flex items-center gap-1">
                {t('common.view_all')} <ArrowRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : recentCerts.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Award className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">{t('dashboard.company.no_certifications')}</p>
                  <Link to="/certifications/new">
                    <Button variant="link" className="mt-2">
                      {t('dashboard.company.first_application')} →
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentCerts.map((cert) => (
                    <Link key={cert.id} to={`/certifications/${cert.id}`}>
                      <div className="rounded-2xl border border-transparent p-3 transition-colors hover:border-cemac-100 hover:bg-cemac-50/60">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{cert.produit_nom}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {cert.numero_dossier} · {formatDate(cert.created_at)}
                            </p>
                          </div>
                          <StatusBadge status={cert.statut} className="ml-3 shrink-0" />
                        </div>
                        {/* Workflow mini-dots */}
                        {(() => {
                          const wfSteps = ['draft', 'submitted', 'under_review', 'field_validation', 'commission_review', 'approved']
                          const isTerminal = ['rejected', 'suspended'].includes(cert.statut)
                          const idx = wfSteps.indexOf(cert.statut)
                          return (
                            <div className="mt-2 flex items-center">
                              {wfSteps.map((step, i) => (
                                <div key={step} className="flex items-center">
                                  <div className={`w-1.5 h-1.5 rounded-full ${
                                    isTerminal ? 'bg-red-200' :
                                    i < idx ? 'bg-cemac-400' :
                                    i === idx ? 'bg-cemac-700' :
                                    'bg-gray-200'
                                  }`} />
                                  {i < wfSteps.length - 1 && (
                                    <div className={`w-5 h-px ${i < idx && !isTerminal ? 'bg-cemac-300' : 'bg-gray-200'}`} />
                                  )}
                                </div>
                              ))}
                            </div>
                          )
                        })()}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions rapides */}
        <div className="space-y-4">
          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="text-base">{t('dashboard.quick_actions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/certifications/new">
                <Button variant="outline" className="w-full justify-start gap-3">
                  <Award className="h-4 w-4 text-cemac-700" />
                  {t('certification.new')}
                </Button>
              </Link>
              <Link to="/marketplace">
                <Button variant="outline" className="w-full justify-start gap-3">
                  <ShoppingBag className="h-4 w-4 text-cemac-600" />
                  {t('dashboard.company.publish_product')}
                </Button>
              </Link>
              <Link to="/market-intelligence">
                <Button variant="outline" className="w-full justify-start gap-3">
                  <TrendingUp className="h-4 w-4 text-gold-600" />
                  {t('dashboard.company.market_analysis')}
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Abonnement */}
          {entreprise && entreprise.subscription_plan === 'free' && (
            <Card className="border-0 bg-gradient-to-br from-cemac-700 via-cemac-800 to-cemac-950 text-white shadow-[0_16px_45px_rgba(16,105,91,0.3)]">
              <CardContent className="pt-6">
                <p className="font-semibold text-sm mb-1">{t('dashboard.company.upgrade_title')}</p>
                <p className="text-xs text-cemac-200 mb-4">
                  {t('dashboard.company.upgrade_description')}
                </p>
                <Button variant="gold" size="sm" className="w-full" asChild>
                  <Link to="/settings?tab=plan">
                  {t('dashboard.company.upgrade_cta')}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
