import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

interface SecurityHealth {
  database: {
    legacy_accounts_total: number
    legacy_accounts_unflagged: number
    invalid_notification_preferences: number
    contact_direct_insert_revoked: boolean
    rate_limit_rpc_ready: boolean
  }
  configuration: {
    allowed_origins_configured: boolean
    rate_limit_salt_configured: boolean
    email_delivery_configured: boolean
  }
}

function isSecurityHealth(value: unknown): value is SecurityHealth {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<SecurityHealth>
  return Boolean(
    candidate.database &&
    candidate.configuration &&
    typeof candidate.database.legacy_accounts_total === 'number' &&
    typeof candidate.database.legacy_accounts_unflagged === 'number' &&
    typeof candidate.database.invalid_notification_preferences === 'number' &&
    typeof candidate.database.contact_direct_insert_revoked === 'boolean' &&
    typeof candidate.database.rate_limit_rpc_ready === 'boolean' &&
    typeof candidate.configuration.allowed_origins_configured === 'boolean' &&
    typeof candidate.configuration.rate_limit_salt_configured === 'boolean' &&
    typeof candidate.configuration.email_delivery_configured === 'boolean'
  )
}

export function SecurityHealthPanel() {
  const [health, setHealth] = useState<SecurityHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setLoading(true)
    setError(null)
    try {
      const runtimeFunctions = (
        supabase as unknown as {
          functions?: {
            invoke?: (name: string, options: { body: object }) => Promise<{
              data: unknown
              error: unknown
            }>
          }
        }
      ).functions
      if (typeof runtimeFunctions?.invoke !== 'function') {
        throw new Error('Supabase Functions client unavailable')
      }

      const { data, error: invokeError } = await runtimeFunctions.invoke('security-health', {
        body: {},
      })
      if (requestId !== requestIdRef.current) return
      if (invokeError || !isSecurityHealth(data)) {
        setError('Le contrôle de sécurité est indisponible.')
        setHealth(null)
      } else {
        setHealth(data)
      }
    } catch {
      if (requestId !== requestIdRef.current) return
      setError('Le contrôle de sécurité est indisponible.')
      setHealth(null)
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    return () => { requestIdRef.current += 1 }
  }, [load])

  const checks = health ? [
    ['Insertion contact directe révoquée', health.database.contact_direct_insert_revoked],
    ['RPC de quotas disponible', health.database.rate_limit_rpc_ready],
    ['Origines autorisées configurées', health.configuration.allowed_origins_configured],
    ['Sel de hachage configuré', health.configuration.rate_limit_salt_configured],
    ['Envoi email configuré', health.configuration.email_delivery_configured],
    ['Préférences valides', health.database.invalid_notification_preferences === 0],
    ['Comptes legacy protégés', health.database.legacy_accounts_unflagged === 0],
  ] as const : []

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-5 w-5 text-cemac-700" />
            Santé sécurité
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Compteurs et états uniquement — aucune clé, identité ou donnée personnelle.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </CardHeader>
      <CardContent>
        {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
        {!error && loading && <p className="text-sm text-muted-foreground">Contrôle en cours…</p>}
        {health && (
          <>
            <div className="grid gap-2 sm:grid-cols-2">
              {checks.map(([label, ok]) => (
                <div key={label} className="flex items-center gap-2 rounded-md border p-3 text-sm">
                  {ok
                    ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                    : <AlertTriangle className="h-4 w-4 text-amber-600" />}
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Comptes legacy détectés : {health.database.legacy_accounts_total}. Non protégés : {health.database.legacy_accounts_unflagged}.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
