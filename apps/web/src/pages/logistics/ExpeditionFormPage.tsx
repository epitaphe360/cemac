import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingCard } from '@/components/shared/LoadingSpinner'
import type { Certification, Convoy, Expedition } from '@/types'
import { CEMAC_COUNTRIES } from './logistics.constants'

type FormState = Pick<Expedition,
  'certification_id' | 'convoy_id' | 'origin_country' | 'origin_city' |
  'destination_country' | 'destination_city' | 'goods_description' |
  'expected_departure' | 'expected_arrival' | 'notes'
> & { gross_weight_kg: string; package_count: string; declared_value: string; currency: string }

const emptyForm: FormState = {
  certification_id: '', convoy_id: null, origin_country: 'CM', origin_city: '',
  destination_country: 'GA', destination_city: '', goods_description: '',
  gross_weight_kg: '', package_count: '', declared_value: '', currency: 'XAF',
  expected_departure: null, expected_arrival: null, notes: null,
}

export function ExpeditionFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const profile = useAuthStore((state) => state.profile)
  const entreprise = useAuthStore((state) => state.entreprise)
  const [form, setForm] = useState(emptyForm)
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [convoys, setConvoys] = useState<Convoy[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(Boolean(id))

  useEffect(() => {
    if (!entreprise?.id) {
      if (id) setLoading(false)
      return
    }
    void Promise.all([
      supabase.from('certifications').select('*').eq('entreprise_id', entreprise.id).eq('statut', 'approved').order('created_at', { ascending: false }),
      supabase.from('convoys').select('*').in('status', ['planned', 'operational']).order('planned_departure'),
      id ? supabase.from('expeditions').select('*').eq('id', id).single() : Promise.resolve({ data: null, error: null }),
    ]).then(([certResult, convoyResult, expeditionResult]) => {
      setCertifications(certResult.data ?? [])
      setConvoys(convoyResult.data ?? [])
      const expedition = expeditionResult.data
      if (expeditionResult.error || (expedition && expedition.status !== 'draft')) {
        toast.error(t('logistics.expeditions.form.draft_only'))
        navigate(id ? `/logistics/${id}` : '/logistics')
        setLoading(false)
        return
      }
      if (expedition) {
        setForm({
          certification_id: expedition.certification_id,
          convoy_id: expedition.convoy_id,
          origin_country: expedition.origin_country,
          origin_city: expedition.origin_city,
          destination_country: expedition.destination_country,
          destination_city: expedition.destination_city,
          goods_description: expedition.goods_description,
          gross_weight_kg: expedition.gross_weight_kg?.toString() ?? '',
          package_count: expedition.package_count?.toString() ?? '',
          declared_value: expedition.declared_value?.toString() ?? '',
          currency: expedition.currency,
          expected_departure: expedition.expected_departure?.slice(0, 16) ?? null,
          expected_arrival: expedition.expected_arrival?.slice(0, 16) ?? null,
          notes: expedition.notes,
        })
      }
      setLoading(false)
    })
  }, [entreprise?.id, id, navigate, t])

  const set = (key: keyof FormState, value: string | null) => setForm((current) => ({ ...current, [key]: value }))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!entreprise || !profile) return
    setSaving(true)
    const values = {
      certification_id: form.certification_id,
      convoy_id: form.convoy_id || null,
      origin_country: form.origin_country,
      origin_city: form.origin_city.trim(),
      destination_country: form.destination_country,
      destination_city: form.destination_city.trim(),
      goods_description: form.goods_description.trim(),
      gross_weight_kg: form.gross_weight_kg ? Number(form.gross_weight_kg) : null,
      package_count: form.package_count ? Number(form.package_count) : null,
      declared_value: form.declared_value ? Number(form.declared_value) : null,
      currency: form.currency.toUpperCase(),
      expected_departure: form.expected_departure || null,
      expected_arrival: form.expected_arrival || null,
      notes: form.notes?.trim() || null,
    }
    const result = id
      ? await supabase.from('expeditions').update(values).eq('id', id).select('id').single()
      : await supabase.from('expeditions').insert({ ...values, entreprise_id: entreprise.id, created_by: profile.id }).select('id').single()
    setSaving(false)
    if (result.error) return toast.error(result.error.message)
    toast.success(id ? t('logistics.expeditions.form.updated') : t('logistics.expeditions.form.created'))
    navigate(`/logistics/${result.data.id}`)
  }

  if (loading) return <LoadingCard />

  return (
    <Card className="mx-auto max-w-4xl">
      <CardHeader>
        <CardTitle>{id ? t('logistics.expeditions.form.edit_title') : t('logistics.expeditions.form.create_title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-5">
          <label className="block text-sm font-medium">
            {t('logistics.expeditions.form.certification')}
            <select required className="mt-1 h-10 w-full rounded-md border bg-white px-3" value={form.certification_id} onChange={(e) => set('certification_id', e.target.value)}>
              <option value="">{t('logistics.expeditions.form.select')}</option>
              {certifications.map((certification) => (
                <option key={certification.id} value={certification.id}>{certification.numero_dossier} — {certification.produit_nom}</option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">
              {t('logistics.expeditions.form.origin')}
              <div className="mt-1 flex gap-2">
                <select className="rounded-md border bg-white px-2" value={form.origin_country} onChange={(e) => set('origin_country', e.target.value)}>
                  {CEMAC_COUNTRIES.map((country) => <option key={country}>{country}</option>)}
                </select>
                <Input required value={form.origin_city} onChange={(e) => set('origin_city', e.target.value)} placeholder={t('logistics.expeditions.form.city_placeholder')} />
              </div>
            </label>
            <label className="text-sm font-medium">
              {t('logistics.expeditions.form.destination')}
              <div className="mt-1 flex gap-2">
                <select className="rounded-md border bg-white px-2" value={form.destination_country} onChange={(e) => set('destination_country', e.target.value)}>
                  {CEMAC_COUNTRIES.map((country) => <option key={country}>{country}</option>)}
                </select>
                <Input required value={form.destination_city} onChange={(e) => set('destination_city', e.target.value)} placeholder={t('logistics.expeditions.form.city_placeholder')} />
              </div>
            </label>
          </div>
          <label className="block text-sm font-medium">
            {t('logistics.expeditions.form.goods')}
            <textarea required minLength={3} className="mt-1 min-h-24 w-full rounded-md border p-3" value={form.goods_description} onChange={(e) => set('goods_description', e.target.value)} />
          </label>
          <div className="grid gap-4 sm:grid-cols-4">
            <label className="text-sm font-medium">{t('logistics.expeditions.form.weight')}<Input type="number" min="0.001" step="0.001" value={form.gross_weight_kg} onChange={(e) => set('gross_weight_kg', e.target.value)} /></label>
            <label className="text-sm font-medium">{t('logistics.expeditions.form.packages')}<Input type="number" min="1" value={form.package_count} onChange={(e) => set('package_count', e.target.value)} /></label>
            <label className="text-sm font-medium">{t('logistics.expeditions.form.value')}<Input type="number" min="0" step="0.01" value={form.declared_value} onChange={(e) => set('declared_value', e.target.value)} /></label>
            <label className="text-sm font-medium">{t('logistics.expeditions.form.currency')}<Input maxLength={3} pattern="[A-Za-z]{3}" value={form.currency} onChange={(e) => set('currency', e.target.value)} /></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">{t('logistics.expeditions.form.departure')}<Input type="datetime-local" value={form.expected_departure ?? ''} onChange={(e) => set('expected_departure', e.target.value || null)} /></label>
            <label className="text-sm font-medium">{t('logistics.expeditions.form.arrival')}<Input type="datetime-local" value={form.expected_arrival ?? ''} onChange={(e) => set('expected_arrival', e.target.value || null)} /></label>
          </div>
          <label className="block text-sm font-medium">
            {t('logistics.expeditions.form.convoy')}
            <select className="mt-1 h-10 w-full rounded-md border bg-white px-3" value={form.convoy_id ?? ''} onChange={(e) => set('convoy_id', e.target.value || null)}>
              <option value="">{t('logistics.expeditions.form.unassigned')}</option>
              {convoys.map((convoy) => <option key={convoy.id} value={convoy.id}>{convoy.reference} — {convoy.name}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium">
            {t('logistics.expeditions.form.notes')}
            <textarea className="mt-1 min-h-20 w-full rounded-md border p-3" value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>{t('logistics.expeditions.form.cancel')}</Button>
            <Button disabled={saving || certifications.length === 0}>{saving ? t('logistics.expeditions.form.saving') : t('logistics.expeditions.form.save')}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
