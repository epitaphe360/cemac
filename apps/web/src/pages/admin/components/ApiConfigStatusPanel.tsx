import { useEffect, useState } from 'react'
import { CheckCircle, RefreshCw, Shield, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { supabase } from '@/lib/supabase'
import type { ApiConfigMetadata } from '@/types'

export function ApiConfigStatusPanel() {
  const [items, setItems] = useState<ApiConfigMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    supabase
      .from('api_config_metadata')
      .select('*')
      .order('category')
      .order('name')
      .then(({ data, error: queryError }) => {
        if (!active) return
        if (queryError) setError(queryError.message)
        else setItems(data ?? [])
        setLoading(false)
      })
    return () => { active = false }
  }, [reloadKey])

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold">Configuration des services</h3>
          <p className="text-sm text-muted-foreground">Statut uniquement. Les clés Stripe, Resend et autres secrets ne sont jamais transmis au navigateur.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setReloadKey((key) => key + 1)}><RefreshCw className="mr-1 h-4 w-4" />Actualiser</Button>
      </div>
      {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Card key={item.id ?? item.key}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between gap-2 text-base">
                <span>{item.name ?? item.key ?? 'Service'}</span>
                {item.is_active
                  ? <span className="flex items-center gap-1 text-xs font-medium text-green-700"><CheckCircle className="h-4 w-4" />Configuré</span>
                  : <span className="flex items-center gap-1 text-xs font-medium text-gray-500"><XCircle className="h-4 w-4" />Inactif</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">{item.category ?? 'service'}</p>
              {item.metadata && <pre className="overflow-auto whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-xs">{JSON.stringify(item.metadata, null, 2)}</pre>}
            </CardContent>
          </Card>
        ))}
      </div>
      {!items.length && !error && <div className="flex items-center gap-2 rounded-md border border-dashed p-8 text-sm text-muted-foreground"><Shield className="h-5 w-5" />Aucun statut de configuration disponible.</div>}
    </div>
  )
}
