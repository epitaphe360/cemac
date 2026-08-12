import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Convoy, Profile } from '@/types'
import { CEMAC_COUNTRIES, CONVOY_STATUS_LABELS, NEXT_CONVOY_STATUSES } from './logistics.constants'

const initialForm = { name: '', country: 'CM', origin: '', destination: '', agent_id: '', planned_departure: '', planned_arrival: '' }

export function ConvoysPage() {
  const { t, i18n } = useTranslation()
  const profile = useAuthStore((state) => state.profile)
  const locale = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'fr'
  const [convoys, setConvoys] = useState<Convoy[]>([])
  const [agents, setAgents] = useState<Profile[]>([])
  const [form, setForm] = useState(initialForm)

  const load = useCallback(async () => {
    const [convoysResult, agentsResult] = await Promise.all([
      supabase.from('convoys').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('role', 'logistics_agent').order('full_name'),
    ])
    setConvoys(convoysResult.data ?? [])
    setAgents(agentsResult.data ?? [])
  }, [])

  useEffect(() => {
    void load()
    const channel = supabase.channel('convoys-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'convoys' }, () => { void load() })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [load])

  const create = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!profile) return
    const { error } = await supabase.from('convoys').insert({
      name: form.name, country: form.country, origin: form.origin, destination: form.destination,
      agent_id: form.agent_id || (profile.role === 'logistics_agent' ? profile.id : null),
      planned_departure: form.planned_departure || null, planned_arrival: form.planned_arrival || null,
      created_by: profile.id,
    })
    if (error) toast.error(error.message)
    else { setForm(initialForm); toast.success(t('logistics.expeditions.convoys_page.created')); void load() }
  }

  const transition = async (convoy: Convoy, status: Convoy['status']) => {
    const extra = status === 'operational' ? { actual_departure: new Date().toISOString() }
      : status === 'completed' ? { actual_arrival: new Date().toISOString() } : {}
    const { error } = await supabase.from('convoys').update({ status, ...extra }).eq('id', convoy.id)
    if (error) toast.error(error.message)
    else void load()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('logistics.expeditions.convoys_page.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('logistics.expeditions.convoys_page.description')}</p>
      </div>
      <Card>
        <CardHeader><CardTitle>{t('logistics.expeditions.convoys_page.new')}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={create} className="grid gap-3 md:grid-cols-4">
            <Input required placeholder={t('logistics.expeditions.convoys_page.name_placeholder')} value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} />
            <select className="h-9 rounded-md border bg-white px-2" value={form.country} onChange={(e) => setForm((v) => ({ ...v, country: e.target.value }))}>
              {CEMAC_COUNTRIES.map((country) => <option key={country}>{country}</option>)}
            </select>
            <Input required placeholder={t('logistics.expeditions.form.origin')} value={form.origin} onChange={(e) => setForm((v) => ({ ...v, origin: e.target.value }))} />
            <Input required placeholder={t('logistics.expeditions.form.destination')} value={form.destination} onChange={(e) => setForm((v) => ({ ...v, destination: e.target.value }))} />
            <Input type="datetime-local" value={form.planned_departure} onChange={(e) => setForm((v) => ({ ...v, planned_departure: e.target.value }))} />
            <Input type="datetime-local" value={form.planned_arrival} onChange={(e) => setForm((v) => ({ ...v, planned_arrival: e.target.value }))} />
            {profile?.role !== 'logistics_agent' && (
              <select className="h-9 rounded-md border bg-white px-2" value={form.agent_id} onChange={(e) => setForm((v) => ({ ...v, agent_id: e.target.value }))}>
                <option value="">{t('logistics.expeditions.detail.unassigned_agent')}</option>
                {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.full_name ?? agent.email}</option>)}
              </select>
            )}
            <Button>{t('logistics.expeditions.convoys_page.new')}</Button>
          </form>
        </CardContent>
      </Card>
      <div className="space-y-3">
        {convoys.map((convoy) => (
          <Card key={convoy.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="font-semibold">{convoy.reference} · {convoy.name}</p>
                <p className="text-sm text-muted-foreground">
                  {convoy.origin} → {convoy.destination} · {CONVOY_STATUS_LABELS[convoy.status][locale]}
                </p>
              </div>
              <div className="flex gap-2">
                {NEXT_CONVOY_STATUSES[convoy.status].map((status) => (
                  <Button key={status} size="sm" variant="outline" onClick={() => void transition(convoy, status)}>
                    {CONVOY_STATUS_LABELS[status][locale]}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
