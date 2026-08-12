import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Package, Truck, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { STATUS_LABELS } from '@/pages/logistics/logistics.constants'
import type { Expedition } from '@/types'

export function LogisticsExpeditionsPanel() {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'fr'
  const [expeditions, setExpeditions] = useState<Expedition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void supabase
      .from('expeditions')
      .select('id, reference, status, origin_city, destination_city, updated_at')
      .order('updated_at', { ascending: false })
      .limit(8)
      .then(({ data }) => {
        setExpeditions((data ?? []) as Expedition[])
        setLoading(false)
      })
  }, [])

  const inTransit = expeditions.filter((item) => ['in_transit', 'checkpoint_hold'].includes(item.status)).length
  const delivered = expeditions.filter((item) => item.status === 'delivered').length

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="h-4 w-4 text-cemac-700" />
          {t('admin.logistics.expeditions_title')}
        </CardTitle>
        <Button asChild variant="outline" size="sm">
          <Link to="/logistics">
            <ExternalLink className="h-3.5 w-3.5 mr-1" />
            {t('admin.logistics.open_module')}
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Package className="h-3.5 w-3.5" />{t('admin.logistics.expeditions_total')}</div>
            <p className="mt-1 text-xl font-bold">{loading ? '…' : expeditions.length}</p>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Truck className="h-3.5 w-3.5" />{t('admin.logistics.expeditions_in_transit')}</div>
            <p className="mt-1 text-xl font-bold">{loading ? '…' : inTransit}</p>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Package className="h-3.5 w-3.5" />{t('admin.logistics.expeditions_delivered')}</div>
            <p className="mt-1 text-xl font-bold">{loading ? '…' : delivered}</p>
          </div>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">…</p>
        ) : expeditions.length === 0 ? (
          <p className="text-sm text-center text-muted-foreground py-4">{t('admin.logistics.no_expeditions')}</p>
        ) : (
          <div className="divide-y">
            {expeditions.map((expedition) => (
              <Link
                key={expedition.id}
                to={`/logistics/${expedition.id}`}
                className="flex items-center justify-between py-2.5 text-sm hover:bg-gray-50 px-2 -mx-2 rounded-md"
              >
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
  )
}
