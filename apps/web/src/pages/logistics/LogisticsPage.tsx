import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Filter, MapPin, Package, Plus, RefreshCw, Truck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingCard } from '@/components/shared/LoadingSpinner'
import { formatDate } from '@/lib/utils'
import type { Expedition } from '@/types'
import { EXPEDITION_STATUSES, STATUS_LABELS } from './logistics.constants'

export function LogisticsPage() {
  const { t, i18n } = useTranslation()
  const profile = useAuthStore((state) => state.profile)
  const entreprise = useAuthStore((state) => state.entreprise)
  const [expeditions, setExpeditions] = useState<Expedition[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const loadExpeditions = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('expeditions')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) toast.error(error.message)
    setExpeditions(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadExpeditions()
    const channel = supabase
      .channel('expeditions-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expeditions' }, () => {
        void loadExpeditions()
      })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [loadExpeditions])

  const filtered = useMemo(() => expeditions.filter((expedition) => {
    const needle = search.trim().toLowerCase()
    return (!status || expedition.status === status)
      && (!needle || [
        expedition.reference,
        expedition.goods_description,
        expedition.origin_city,
        expedition.destination_city,
      ].some((value) => value.toLowerCase().includes(needle)))
  }), [expeditions, search, status])

  const locale = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'fr'
  const canCreate = profile?.role === 'company_admin'
    && Boolean(entreprise)
    && ['enterprise', 'institutional'].includes(entreprise?.subscription_plan ?? '')
    && ['active', 'trialing'].includes(entreprise?.subscription_status ?? '')
  const canManageConvoys = ['logistics_agent', 'chamber_agent', 'cemac_officer', 'super_admin']
    .includes(profile?.role ?? '')
  const inTransit = expeditions.filter((item) => ['in_transit', 'checkpoint_hold'].includes(item.status)).length
  const delivered = expeditions.filter((item) => item.status === 'delivered').length
  const countries = new Set(expeditions.flatMap((item) => [item.origin_country, item.destination_country])).size

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#0f3443_0%,#0f766e_52%,#e0aa2c_130%)] px-6 py-7 text-white">
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="hero-chip mb-4 border-white/15 bg-white/10 text-white">{t('logistics.expeditions.badge')}</div>
            <h1 className="text-3xl font-black">{t('logistics.expeditions.title')}</h1>
            <p className="mt-2 text-sm text-white/75">{t('logistics.expeditions.description')}</p>
          </div>
          <div className="flex gap-2">
            {canManageConvoys && (
              <Button asChild variant="outline">
                <Link to="/logistics/convoys"><Truck className="mr-2 h-4 w-4" />{t('logistics.expeditions.convoys')}</Link>
              </Button>
            )}
            {canCreate && (
              <Button asChild className="bg-white text-cemac-900 hover:bg-white/90">
                <Link to="/logistics/new"><Plus className="mr-2 h-4 w-4" />{t('logistics.expeditions.new')}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {profile?.role === 'company_admin' && !canCreate && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4 text-sm text-amber-900">{t('logistics.expeditions.plan_required')}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="metric-card">
          <CardContent className="flex items-center gap-3 pt-6">
            <Package className="h-5 w-5 text-cemac-700" />
            <div>
              <p className="text-2xl font-bold">{loading ? '…' : expeditions.length}</p>
              <p className="text-xs text-muted-foreground">{t('logistics.expeditions.kpi.total')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent className="flex items-center gap-3 pt-6">
            <Truck className="h-5 w-5 text-cemac-700" />
            <div>
              <p className="text-2xl font-bold">{loading ? '…' : inTransit}</p>
              <p className="text-xs text-muted-foreground">{t('logistics.expeditions.kpi.in_transit')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent className="flex items-center gap-3 pt-6">
            <RefreshCw className="h-5 w-5 text-cemac-700" />
            <div>
              <p className="text-2xl font-bold">{loading ? '…' : delivered}</p>
              <p className="text-xs text-muted-foreground">{t('logistics.expeditions.kpi.delivered')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent className="flex items-center gap-3 pt-6">
            <MapPin className="h-5 w-5 text-cemac-700" />
            <div>
              <p className="text-2xl font-bold">{loading ? '…' : countries}</p>
              <p className="text-xs text-muted-foreground">{t('logistics.expeditions.kpi.countries')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Filter className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('logistics.expeditions.search_placeholder')}
                aria-label={t('logistics.expeditions.search_placeholder')}
              />
            </div>
            <select
              className="h-9 rounded-md border bg-white px-3 text-sm"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label={t('logistics.expeditions.filter_status')}
            >
              <option value="">{t('logistics.expeditions.all_statuses')}</option>
              {EXPEDITION_STATUSES.map((value) => (
                <option key={value} value={value}>{STATUS_LABELS[value][locale]}</option>
              ))}
            </select>
            <Button variant="outline" onClick={() => void loadExpeditions()} aria-label={t('logistics.expeditions.refresh')}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {loading ? <LoadingCard /> : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">{t('logistics.expeditions.empty')}</div>
          ) : (
            <div className="divide-y">
              {filtered.map((expedition) => (
                <Link
                  key={expedition.id}
                  to={`/logistics/${expedition.id}`}
                  className="grid gap-2 py-4 transition-colors hover:bg-gray-50 sm:grid-cols-[1fr_auto] sm:px-3"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{expedition.reference}</span>
                      <span className="rounded-full bg-cemac-50 px-2 py-0.5 text-xs text-cemac-800">
                        {STATUS_LABELS[expedition.status][locale]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-700">{expedition.goods_description}</p>
                    <p className="text-xs text-muted-foreground">
                      {expedition.origin_city} ({expedition.origin_country}) → {expedition.destination_city} ({expedition.destination_country})
                    </p>
                  </div>
                  <span className="self-center text-xs text-muted-foreground">{formatDate(expedition.updated_at)}</span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
