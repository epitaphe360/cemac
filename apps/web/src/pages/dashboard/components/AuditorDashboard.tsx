import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileSearch, CheckCircle2, ArrowRight, UserCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { Certification } from '@/types'
import toast from 'react-hot-toast'

type AuditTask = Certification & { entreprise: { raison_sociale: string; pays: string } | null }

export function AuditorDashboard() {
  const { t } = useTranslation()
  const profile = useAuthStore((s) => s.profile)
  
  const [stats, setStats] = useState({ assigned: 0, completed: 0 })
  const [tasks, setTasks] = useState<AuditTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.id) {
        setLoading(false)
        return
      }
      const [activeRes, completedRes] = await Promise.all([
        supabase
        .from('certifications')
        .select(`*, entreprise:entreprises!certifications_entreprise_id_fkey(raison_sociale, pays)`)
        .eq('agent_id', profile.id)
        .eq('statut', 'under_review')
        .order('updated_at', { ascending: false }),
        supabase
          .from('certifications')
          .select('id', { count: 'exact', head: true })
          .eq('agent_id', profile.id)
          .in('statut', ['commission_review', 'approved', 'rejected']),
      ])
      
      if (activeRes.error || completedRes.error) {
        toast.error('Impossible de charger les missions d’audit')
      } else {
        setStats({
          assigned: activeRes.data?.length ?? 0,
          completed: completedRes.count ?? 0,
        })
        setTasks((activeRes.data ?? []) as AuditTask[])
      }
      setLoading(false)
    }

    fetchData()
  }, [profile?.id])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#3f2712_0%,#7c4b15_42%,#115e59_130%)] px-6 py-7 text-white shadow-[0_20px_60px_rgba(70,43,14,0.22)] sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_24%)]" />
        <div className="relative flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="hero-chip mb-4 border-white/15 bg-white/10 text-white">{t('dashboard.auditor.badge')}</div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            {t('dashboard.auditor.title')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/75">{t('dashboard.auditor.description')}</p>
        </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="metric-card">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-xl bg-orange-50"><FileSearch className="h-5 w-5 text-orange-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '…' : stats.assigned}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('dashboard.auditor.assigned')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-xl bg-green-50"><CheckCircle2 className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '…' : stats.completed}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('dashboard.auditor.completed')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="metric-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t('dashboard.auditor.active_missions')}</CardTitle>
              <Link to="/certifications" className="text-sm text-cemac-700 hover:underline flex items-center gap-1">
                {t('dashboard.auditor.all_files')} <ArrowRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}</div>
              ) : tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">{t('dashboard.auditor.no_tasks')}</p>
              ) : (
                <div className="space-y-2">
                  {tasks.map((cert) => (
                    <Link key={cert.id} to={`/certifications/${cert.id}`}>
                      <div className="flex items-center justify-between rounded-2xl border border-transparent p-3 hover:border-amber-100 hover:bg-amber-50/45">
                        <div>
                          <p className="text-sm font-medium">{cert.produit_nom}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <UserCheck className="h-3 w-3" /> {cert.entreprise?.raison_sociale}
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
      </div>
    </div>
  )
}