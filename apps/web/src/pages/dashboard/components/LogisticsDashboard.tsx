import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Truck, Map, AlertTriangle, Route, Package } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Expedition } from '@/types'
import { STATUS_LABELS } from '@/pages/logistics/logistics.constants'

interface DashboardStats {
  inTransit: number
  operationalConvoys: number
  operationalCorridors: number
  activeAlerts: number
}

export function LogisticsDashboard() {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'fr'
  const [stats, setStats] = useState<DashboardStats>({
    inTransit: 0,
    operationalConvoys: 0,
    operationalCorridors: 0,
    activeAlerts: 0,
  })
  const [recentExpeditions, setRecentExpeditions] = useState<Expedition[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [expeditionsRes, convoysRes, corridorsRes, alertsRes] = await Promise.all([
      supabase.from('expeditions').select('id, reference, status, origin_city, destination_city, updated_at').order('updated_at', { ascending: false }).limit(50),
      supabase.from('convoys').select('id', { count: 'exact', head: true }).eq('status', 'operational'),
      supabase.from('corridors').select('id', { count: 'exact', head: true }).eq('status', 'Opérationnel'),
      supabase.from('logistics_alerts').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ])
    const expeditions = expeditionsRes.data ?? []
    setStats({
      inTransit: expeditions.filter((item) => ['in_transit', 'checkpoint_hold'].includes(item.status)).length,
      operationalConvoys: convoysRes.count ?? 0,
      operationalCorridors: corridorsRes.count ?? 0,
      activeAlerts: alertsRes.count ?? 0,
    })
    setRecentExpeditions(expeditions.slice(0, 5) as Expedition[])
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
    const channel = supabase
      .channel('logistics-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expeditions' }, () => { void load() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'convoys' }, () => { void load() })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [load])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#0f3443_0%,#0f766e_52%,#e0aa2c_130%)] px-6 py-7 text-white shadow-[0_20px_60px_rgba(15,52,67,0.22)] sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_24%)]" />
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="hero-chip mb-4 border-white/15 bg-white/10 text-white">{t('dashboard.logistics.badge')}</div>
            <h1 className="text-3xl font-black tracking-tight text-white">{t('dashboard.logistics.title')}</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/75">{t('dashboard.logistics.description')}</p>
          </div>
          <div className="flex gap-2">
            <Link to="/logistics">
              <Button className="bg-white text-cemac-900 hover:bg-white/90">
                <Map className="h-4 w-4 mr-2" />
                {t('dashboard.logistics.manage_map')}
              </Button>
            </Link>
            <Link to="/logistics/convoys">
              <Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                <Truck className="h-4 w-4 mr-2" />
                {t('logistics.expeditions.convoys')}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="metric-card">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-xl bg-blue-50"><Package className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '…' : stats.inTransit}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('logistics.expeditions.kpi.in_transit')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-xl bg-green-50"><Truck className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '…' : stats.operationalConvoys}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('logistics.expeditions.kpi.operational_convoys')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-xl bg-green-50"><Route className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '…' : stats.operationalCorridors}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('dashboard.logistics.operational_corridors')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-xl bg-red-50"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '…' : stats.activeAlerts}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('dashboard.logistics.active_alerts')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="metric-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-5 w-5" /> {t('logistics.expeditions.recent_title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">…</p>
            ) : recentExpeditions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('logistics.expeditions.empty')}</p>
            ) : (
              <div className="divide-y">
                {recentExpeditions.map((expedition) => (
                  <Link key={expedition.id} to={`/logistics/${expedition.id}`} className="flex items-center justify-between py-3 text-sm hover:bg-gray-50 px-2 -mx-2 rounded-md">
                    <div>
                      <p className="font-medium">{expedition.reference}</p>
                      <p className="text-xs text-muted-foreground">{expedition.origin_city} → {expedition.destination_city}</p>
                    </div>
                    <span className="rounded-full bg-cemac-50 px-2 py-0.5 text-xs text-cemac-800">
                      {STATUS_LABELS[expedition.status][locale]}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-5 w-5" /> {t('dashboard.logistics.navigation_title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{t('dashboard.logistics.navigation_description')}</p>
            <Link to="/logistics">
              <Button variant="outline" className="w-full">{t('dashboard.logistics.open_module')}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
