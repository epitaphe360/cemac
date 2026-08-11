import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Truck, Map, AlertTriangle, Route } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function LogisticsDashboard() {
  const { t } = useTranslation()
  const [stats, setStats] = useState({ operational: 0, alerts: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Dans une vraie implémentation, on lit depuis la base de données (corridors_logistiques)
    // Ici on mock pour le prototype
    setTimeout(() => {
      setStats({
        operational: 3,
        alerts: 2
      })
      setLoading(false)
    }, 500)
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#0f3443_0%,#0f766e_52%,#e0aa2c_130%)] px-6 py-7 text-white shadow-[0_20px_60px_rgba(15,52,67,0.22)] sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_24%)]" />
        <div className="relative flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="hero-chip mb-4 border-white/15 bg-white/10 text-white">{t('dashboard.logistics.badge')}</div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            {t('dashboard.logistics.title')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/75">{t('dashboard.logistics.description')}</p>
        </div>
        <Link to="/logistics">
          <Button className="bg-white text-cemac-900 hover:bg-white/90">
            <Map className="h-4 w-4 mr-2" />
            {t('dashboard.logistics.manage_map')}
          </Button>
        </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="metric-card">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-xl bg-green-50"><Route className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '…' : stats.operational}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('dashboard.logistics.operational_corridors')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-xl bg-red-50"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '…' : stats.alerts}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('dashboard.logistics.active_alerts')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="metric-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-5 w-5" /> {t('dashboard.logistics.navigation_title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground mb-4">
               {t('dashboard.logistics.navigation_description')}
             </p>
             <Link to="/logistics">
               <Button variant="outline" className="w-full">{t('dashboard.logistics.open_module')}</Button>
             </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}