import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Download, FilePlus, MapPin, Pencil, Plus, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { jsPDF } from 'jspdf'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingCard } from '@/components/shared/LoadingSpinner'
import { formatDate } from '@/lib/utils'
import type { Expedition, ExpeditionDocument, ExpeditionEvent, Profile } from '@/types'
import { DOCUMENT_MIME_TYPES, MAX_DOCUMENT_SIZE, NEXT_STATUSES, STATUS_LABELS } from './logistics.constants'

export function ExpeditionDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const profile = useAuthStore((state) => state.profile)
  const [expedition, setExpedition] = useState<Expedition | null>(null)
  const [events, setEvents] = useState<ExpeditionEvent[]>([])
  const [documents, setDocuments] = useState<ExpeditionDocument[]>([])
  const [agents, setAgents] = useState<Profile[]>([])
  const [checkpoint, setCheckpoint] = useState({ title: '', location: '', description: '' })
  const [loading, setLoading] = useState(true)

  const locale = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'fr'

  const load = useCallback(async () => {
    const [expeditionResult, eventsResult, documentsResult] = await Promise.all([
      supabase.from('expeditions').select('*').eq('id', id).single(),
      supabase.from('expedition_events').select('*').eq('expedition_id', id).order('created_at', { ascending: false }),
      supabase.from('expedition_documents').select('*').eq('expedition_id', id).order('created_at', { ascending: false }),
    ])
    if (expeditionResult.error) {
      toast.error(t('logistics.expeditions.detail.inaccessible'))
      navigate('/logistics')
      return
    }
    setExpedition(expeditionResult.data)
    setEvents(eventsResult.data ?? [])
    setDocuments(documentsResult.data ?? [])
    setLoading(false)
  }, [id, navigate, t])

  useEffect(() => {
    void load()
    if (['super_admin', 'cemac_officer', 'chamber_agent'].includes(profile?.role ?? '')) {
      void supabase.from('profiles').select('*').eq('role', 'logistics_agent').order('full_name').then(({ data }) => setAgents(data ?? []))
    }
    const channel = supabase.channel(`expedition-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expeditions', filter: `id=eq.${id}` }, () => { void load() })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'expedition_events', filter: `expedition_id=eq.${id}` }, () => { void load() })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [id, load, profile?.role])

  const updateStatus = async (status: Expedition['status']) => {
    const { error } = await supabase.from('expeditions').update({ status }).eq('id', id)
    if (error) toast.error(error.message)
    else toast.success(t('logistics.expeditions.detail.status_updated'))
  }

  const assignAgent = async (assigned_agent_id: string) => {
    const { error } = await supabase.from('expeditions').update({ assigned_agent_id: assigned_agent_id || null }).eq('id', id)
    if (error) toast.error(error.message)
    else toast.success(t('logistics.expeditions.detail.agent_assigned'))
  }

  const addCheckpoint = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!profile) return
    const { error } = await supabase.from('expedition_events').insert({
      expedition_id: id, event_type: 'checkpoint', title: checkpoint.title,
      location: checkpoint.location || null, description: checkpoint.description || null,
      created_by: profile.id,
    })
    if (error) toast.error(error.message)
    else {
      setCheckpoint({ title: '', location: '', description: '' })
      toast.success(t('logistics.expeditions.detail.checkpoint_added'))
      void load()
    }
  }

  const persistFile = async (file: File | Blob, fileName: string, documentType: ExpeditionDocument['document_type']) => {
    if (!profile) return
    if (file.size > MAX_DOCUMENT_SIZE || !DOCUMENT_MIME_TYPES.includes(file.type as typeof DOCUMENT_MIME_TYPES[number])) {
      toast.error(t('logistics.expeditions.detail.file_rejected'))
      return
    }
    const extension = fileName.split('.').pop()?.toLowerCase() || 'bin'
    const path = `${id}/${crypto.randomUUID()}.${extension}`
    const upload = await supabase.storage.from('expedition-docs').upload(path, file, { contentType: file.type })
    if (upload.error) return toast.error(upload.error.message)
    const metadata = await supabase.from('expedition_documents').insert({
      expedition_id: id, document_type: documentType, file_name: fileName,
      storage_path: path, mime_type: file.type as ExpeditionDocument['mime_type'],
      file_size: file.size, uploaded_by: profile.id,
    })
    if (metadata.error) {
      await supabase.storage.from('expedition-docs').remove([path])
      return toast.error(metadata.error.message)
    }
    toast.success(t('logistics.expeditions.detail.document_saved'))
    void load()
  }

  const generateEur1 = async () => {
    if (!expedition) return
    const pdf = new jsPDF()
    pdf.setFontSize(16)
    pdf.text('PROJET NON OFFICIEL — EUR.1', 105, 20, { align: 'center' })
    pdf.setFontSize(10)
    pdf.text(`Expédition : ${expedition.reference}`, 20, 38)
    pdf.text(`Trajet : ${expedition.origin_city} (${expedition.origin_country}) → ${expedition.destination_city} (${expedition.destination_country})`, 20, 48)
    pdf.text(`Marchandises : ${expedition.goods_description}`, 20, 58, { maxWidth: 170 })
    pdf.text('Document préparatoire sans valeur douanière.', 20, 85)
    const blob = pdf.output('blob')
    await persistFile(blob, `EUR1-${expedition.reference}.pdf`, 'eur1')
  }

  const download = async (document: ExpeditionDocument) => {
    const { data, error } = await supabase.storage.from('expedition-docs').createSignedUrl(document.storage_path, 60)
    if (error) toast.error(error.message)
    else window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  if (loading || !expedition) return <LoadingCard />
  const isCompany = profile?.role === 'company_admin'
  const staff = ['logistics_agent', 'chamber_agent', 'cemac_officer', 'super_admin'].includes(profile?.role ?? '')
  const nextStatuses = NEXT_STATUSES[expedition.status].filter((status) => !isCompany || expedition.status === 'draft')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{t('logistics.expeditions.detail.label')}</p>
          <h1 className="text-3xl font-bold">{expedition.reference}</h1>
          <p className="mt-1">{STATUS_LABELS[expedition.status][locale]}</p>
        </div>
        <div className="flex gap-2">
          {isCompany && expedition.status === 'draft' && (
            <Button asChild variant="outline">
              <Link to={`/logistics/${id}/edit`}><Pencil className="mr-2 h-4 w-4" />{t('logistics.expeditions.detail.edit')}</Link>
            </Button>
          )}
          <Button onClick={() => void generateEur1()}><ShieldCheck className="mr-2 h-4 w-4" />{t('logistics.expeditions.detail.generate_eur1')}</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>{t('logistics.expeditions.detail.details')}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">{t('logistics.expeditions.detail.route')}</p>
              <p>{expedition.origin_city} ({expedition.origin_country}) → {expedition.destination_city} ({expedition.destination_country})</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('logistics.expeditions.detail.goods')}</p>
              <p>{expedition.goods_description}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('logistics.expeditions.detail.cargo')}</p>
              <p>{expedition.gross_weight_kg ?? '—'} kg · {expedition.package_count ?? '—'} colis</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('logistics.expeditions.detail.declared_value')}</p>
              <p>{expedition.declared_value ?? '—'} {expedition.currency}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t('logistics.expeditions.detail.operations')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {nextStatuses.map((status) => (
              <Button key={status} className="w-full" variant="outline" onClick={() => void updateStatus(status)}>
                {STATUS_LABELS[status][locale]}
              </Button>
            ))}
            {agents.length > 0 && (
              <select className="h-10 w-full rounded-md border bg-white px-2 text-sm" value={expedition.assigned_agent_id ?? ''} onChange={(event) => void assignAgent(event.target.value)}>
                <option value="">{t('logistics.expeditions.detail.unassigned_agent')}</option>
                {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.full_name ?? agent.email}</option>)}
              </select>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t('logistics.expeditions.detail.documents')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <label className="flex cursor-pointer items-center justify-center rounded-md border border-dashed p-4 text-sm">
              <FilePlus className="mr-2 h-4 w-4" />{t('logistics.expeditions.detail.upload')}
              <input className="sr-only" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) void persistFile(file, file.name, 'other') }} />
            </label>
            {documents.map((document) => (
              <button key={document.id} onClick={() => void download(document)} className="flex w-full items-center justify-between rounded-md border p-3 text-left text-sm">
                <span>{document.file_name}<small className="ml-2 text-muted-foreground">{document.document_type}</small></span>
                <Download className="h-4 w-4" />
              </button>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t('logistics.expeditions.detail.timeline')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {staff && (
              <form onSubmit={addCheckpoint} className="space-y-2 rounded-md border p-3">
                <Input required placeholder={t('logistics.expeditions.detail.checkpoint_placeholder')} value={checkpoint.title} onChange={(e) => setCheckpoint((value) => ({ ...value, title: e.target.value }))} />
                <Input placeholder={t('logistics.expeditions.detail.location_placeholder')} value={checkpoint.location} onChange={(e) => setCheckpoint((value) => ({ ...value, location: e.target.value }))} />
                <Input placeholder={t('logistics.expeditions.detail.note_placeholder')} value={checkpoint.description} onChange={(e) => setCheckpoint((value) => ({ ...value, description: e.target.value }))} />
                <Button size="sm"><Plus className="mr-1 h-4 w-4" />{t('logistics.expeditions.detail.add_checkpoint')}</Button>
              </form>
            )}
            {events.map((event) => (
              <div key={event.id} className="border-l-2 border-cemac-200 pl-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  <p className="text-sm font-medium">{event.title}</p>
                </div>
                <p className="text-xs text-muted-foreground">{event.location ? `${event.location} · ` : ''}{formatDate(event.created_at)}</p>
                {event.description && <p className="mt-1 text-sm">{event.description}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
