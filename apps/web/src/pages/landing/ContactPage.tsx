import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Mail, Phone, MapPin, Send, MessageCircle, Clock, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useContact, useContentBlocks, useSiteSetting } from '@/hooks/use-cms'
import { getPrimaryLanguage } from '@/lib/i18n-utils'
import type { CmsJsonObject, CmsLocale, ContentBlockView } from '@/lib/cms-types'

function text(block: ContentBlockView | undefined, key: string) {
  const value = block?.content[key]
  return typeof value === 'string' ? value : null
}

function objects(block: ContentBlockView | undefined, key: string) {
  const value = block?.content[key]
  return Array.isArray(value)
    ? value.filter((item): item is CmsJsonObject => typeof item === 'object' && item !== null && !Array.isArray(item))
    : []
}

function CmsState({ message }: Readonly<{ message: string }>) {
  return <output className="block min-h-screen px-6 pt-32 text-center">{message}</output>
}

function objectText(object: CmsJsonObject, key: string) {
  const value = object[key]
  return typeof value === 'string' ? value : null
}

const emptyForm = { name: '', email: '', company: '', country: '', reason: '', message: '' }

export function ContactPage() {
  const { t, i18n } = useTranslation()
  const locale = getPrimaryLanguage(i18n.resolvedLanguage ?? i18n.language) as CmsLocale
  const blocksQuery = useContentBlocks('contact', locale)
  const contactQuery = useContact(locale)
  const primaryQuery = useSiteSetting('contact.primary')
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const hero = blocksQuery.data.find((block) => block.section === 'hero')
  const response = blocksQuery.data.find((block) => block.section === 'response')
  const ui = blocksQuery.data.find((block) => block.section === 'ui')
  const countries = objects(blocksQuery.data.find((block) => block.section === 'countries'), 'items')
  const primary = primaryQuery.data?.value as CmsJsonObject | undefined
  const email = typeof primary?.email === 'string' ? primary.email : null
  const phone = typeof primary?.phone === 'string' ? primary.phone : null
  const { offices, reasons } = contactQuery.data

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.name || !form.email || !form.message) {
      toast.error(text(ui, 'required_error') ?? '')
      return
    }
    setSubmitting(true)
    try {
      const { error } = await supabase.from('contact_requests').insert({
        full_name: form.name, email: form.email, company: form.company || null,
        country: form.country || null, reason: form.reason || null, message: form.message,
      })
      if (error) throw error
      setSent(true)
      toast.success(text(ui, 'success_toast') ?? '')
    } catch (error) {
      console.error('Contact request failed', error)
      toast.error(text(ui, 'send_error') ?? '')
    } finally {
      setSubmitting(false)
    }
  }

  if (blocksQuery.loading || contactQuery.loading || primaryQuery.loading) return <CmsState message={t('common.loading')} />
  if (blocksQuery.error || contactQuery.error || primaryQuery.error) return <CmsState message={t('common.error')} />
  if (!hero || !response || !ui || !email || !phone || offices.length === 0 || reasons.length === 0 || countries.length === 0) {
    return <CmsState message={locale === 'fr' ? 'Contenu temporairement indisponible.' : 'Content temporarily unavailable.'} />
  }

  return (
    <div className="pt-20">
      <section className="py-20 bg-gradient-to-br from-cemac-900 to-cemac-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" aria-hidden style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="max-w-3xl mx-auto px-6 text-center relative">
          <div className="inline-flex w-16 h-16 bg-gold-500/20 border border-gold-500/30 rounded-2xl items-center justify-center mb-6"><MessageCircle size={28} className="text-gold-400" aria-hidden /></div>
          <h1 className="text-4xl lg:text-5xl font-black text-white mb-4">{text(hero, 'title')}</h1>
          <p className="text-cemac-200 text-lg">{text(hero, 'description')}</p>
        </div>
      </section>

      <section className="py-16 bg-transparent">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-3 gap-8">
          <aside className="space-y-6">
            <div className="bg-white/92 backdrop-blur-sm rounded-3xl p-5 border border-white shadow-[0_14px_36px_rgba(10,45,39,0.08)]">
              <div className="flex items-center gap-3 mb-3"><div className="w-9 h-9 bg-cemac-100 rounded-xl flex items-center justify-center"><Clock size={18} className="text-cemac-700" aria-hidden /></div><h2 className="font-bold text-gray-900">{text(response, 'title')}</h2></div>
              <div className="space-y-2 text-sm text-gray-600">
                {objects(response, 'items').map((item) => <div key={objectText(item, 'label')} className="flex justify-between"><span>{objectText(item, 'label')}</span><span className="font-semibold text-cemac-700">{objectText(item, 'value')}</span></div>)}
              </div>
            </div>
            <div className="bg-white/92 backdrop-blur-sm rounded-3xl p-5 border border-white shadow-[0_14px_36px_rgba(10,45,39,0.08)]">
              <h2 className="font-bold text-gray-900 mb-4">{text(ui, 'channels_title')}</h2>
              <div className="space-y-3">
                <a href={`mailto:${email}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-cemac-700"><Mail size={16} className="text-cemac-600" aria-hidden />{email}</a>
                <a href={`tel:${phone.replace(/\s/g, '')}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-cemac-700"><Phone size={16} className="text-cemac-600" aria-hidden />{phone}</a>
              </div>
            </div>
            <div className="bg-white/92 backdrop-blur-sm rounded-3xl p-5 border border-white shadow-[0_14px_36px_rgba(10,45,39,0.08)]">
              <h2 className="font-bold text-gray-900 mb-4">{text(ui, 'offices_title')}</h2>
              <div className="space-y-4">{offices.map((office) => (
                <div key={office.id} className="pb-4 last:pb-0 last:border-0 border-b border-gray-100">
                  <div className="flex items-center gap-2 mb-1"><span className="text-sm font-bold text-gray-800">{office.countryName} — {office.city}</span>{office.isHeadquarters && <span className="px-2 py-0.5 bg-cemac-100 text-cemac-700 rounded-full text-xs font-semibold">{text(ui, 'headquarters')}</span>}</div>
                  {office.address && <p className="text-xs text-gray-500 flex items-start gap-1.5 mb-1"><MapPin size={12} className="mt-0.5 flex-shrink-0" aria-hidden />{office.address}</p>}
                  {office.phone && <p className="text-xs text-gray-500 flex items-center gap-1.5"><Phone size={12} aria-hidden />{office.phone}</p>}
                </div>
              ))}</div>
            </div>
          </aside>

          <div className="lg:col-span-2">
            {sent ? (
              <div className="bg-white/92 rounded-3xl p-12 border border-white shadow-[0_18px_45px_rgba(10,45,39,0.1)] text-center h-full flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-cemac-100 rounded-full flex items-center justify-center mb-6"><CheckCircle2 size={40} className="text-cemac-600" aria-hidden /></div>
                <h2 className="text-2xl font-black text-gray-900 mb-3">{text(ui, 'success_title')}</h2>
                <p className="text-gray-500 mb-8 max-w-sm">{text(ui, 'success_description')}</p>
                <button type="button" onClick={() => { setSent(false); setForm(emptyForm) }} className="px-6 py-3 border border-cemac-200 text-cemac-700 rounded-xl font-semibold hover:bg-cemac-50">{text(ui, 'send_another')}</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white/92 rounded-3xl p-8 border border-white shadow-[0_18px_45px_rgba(10,45,39,0.1)]">
                <h2 className="text-xl font-black text-gray-900 mb-6">{text(ui, 'form_title')}</h2>
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  {(['name', 'email', 'company'] as const).map((field) => <label key={field} className="block text-sm font-semibold text-gray-700">{text(ui, `${field}_label`)}{field !== 'company' && <span className="text-red-500"> *</span>}<input type={field === 'email' ? 'email' : 'text'} value={form[field]} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} placeholder={text(ui, `${field}_placeholder`) ?? undefined} required={field !== 'company'} className="mt-1.5 w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-cemac-500 focus:ring-2 focus:ring-cemac-500/20 outline-none text-sm" /></label>)}
                  <label className="block text-sm font-semibold text-gray-700">{text(ui, 'country_label')}<select value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} className="mt-1.5 w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm"><option value="">{text(ui, 'country_placeholder')}</option>{countries.map((country) => <option key={objectText(country, 'code')} value={objectText(country, 'code') ?? ''}>{objectText(country, 'label')}</option>)}</select></label>
                </div>
                <fieldset className="mb-4"><legend className="block text-sm font-semibold text-gray-700 mb-1.5">{text(ui, 'reason_label')}</legend><div className="flex flex-wrap gap-2">{reasons.map((reason) => <button key={reason.id} type="button" onClick={() => setForm((current) => ({ ...current, reason: reason.slug }))} className={`px-3.5 py-2 rounded-xl text-sm font-medium border ${form.reason === reason.slug ? 'bg-cemac-700 text-white border-cemac-700' : 'bg-white text-gray-600 border-gray-200'}`}>{reason.label}</button>)}</div></fieldset>
                <label className="block text-sm font-semibold text-gray-700 mb-6">{text(ui, 'message_label')} <span className="text-red-500">*</span><textarea rows={5} value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} placeholder={text(ui, 'message_placeholder') ?? undefined} className="mt-1.5 w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-cemac-500 focus:ring-2 focus:ring-cemac-500/20 outline-none text-sm resize-none" required /></label>
                <button type="submit" disabled={submitting} className="w-full py-4 bg-cemac-700 hover:bg-cemac-800 disabled:bg-gray-300 text-white font-bold rounded-xl flex items-center justify-center gap-2">{submitting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-label={t('common.loading')} /> : <><Send size={18} aria-hidden />{text(ui, 'submit')}</>}</button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
