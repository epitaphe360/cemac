import { Shield, Globe, Users, Zap, Award, Target, CheckCircle2, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAboutCollections, useContentBlocks } from '@/hooks/use-cms'
import { getPrimaryLanguage } from '@/lib/i18n-utils'
import type { CmsLocale, ContentBlockView } from '@/lib/cms-types'

const valueStyles = [
  { icon: Shield, color: 'bg-cemac-100 text-cemac-700' },
  { icon: Globe, color: 'bg-blue-100 text-blue-700' },
  { icon: Users, color: 'bg-gold-100 text-gold-700' },
  { icon: Zap, color: 'bg-purple-100 text-purple-700' },
]
const statStyles = ['bg-cemac-700 text-white', 'bg-gold-800 text-white', 'bg-gray-900 text-white', 'bg-cemac-100 text-cemac-900']

function text(block: ContentBlockView | undefined, key: string) {
  const value = block?.content[key]
  return typeof value === 'string' ? value : null
}

function strings(block: ContentBlockView | undefined, key: string) {
  const value = block?.content[key]
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function CmsState({ message }: Readonly<{ message: string }>) {
  return <output className="block min-h-screen px-6 pt-32 text-center">{message}</output>
}

export function AboutPage() {
  const { t, i18n } = useTranslation()
  const locale = getPrimaryLanguage(i18n.resolvedLanguage ?? i18n.language) as CmsLocale
  const blocksQuery = useContentBlocks('about', locale)
  const collectionsQuery = useAboutCollections(locale)
  const blocks = blocksQuery.data
  const hero = blocks.find((block) => block.section === 'hero')
  const vision = blocks.find((block) => block.section === 'vision')
  const valuesIntro = blocks.find((block) => block.section === 'values' && block.key === 'intro')
  const values = blocks.filter((block) => block.section === 'values' && block.key !== 'intro')
  const sections = blocks.find((block) => block.section === 'sections')
  const cta = blocks.find((block) => block.section === 'cta')
  const countries = blocks.filter((block) => block.section === 'countries' && block.key !== 'intro')
  const countriesIntro = blocks.find((block) => block.section === 'countries' && block.key === 'intro')
  const { team, partners, milestones, stats } = collectionsQuery.data

  if (blocksQuery.loading || collectionsQuery.loading) return <CmsState message={t('common.loading')} />
  if (blocksQuery.error || collectionsQuery.error) return <CmsState message={t('common.error')} />
  if (!hero || !vision || !valuesIntro || !sections || !cta || !countriesIntro || values.length === 0 || countries.length === 0 || team.length === 0 || partners.length === 0 || milestones.length === 0 || stats.length === 0) {
    return <CmsState message={locale === 'fr' ? 'Contenu temporairement indisponible.' : 'Content temporarily unavailable.'} />
  }

  return (
    <div className="pt-20">
      <section className="py-24 bg-gradient-to-br from-cemac-900 via-cemac-800 to-cemac-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" aria-hidden
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500/20 border border-gold-500/30 rounded-full text-gold-300 text-sm font-medium mb-8">
            <Target size={14} aria-hidden /> {text(hero, 'badge')}
          </span>
          <h1 className="text-4xl lg:text-6xl font-black text-white mb-6 leading-tight">{text(hero, 'title')}</h1>
          <p className="text-cemac-200 text-lg lg:text-xl leading-relaxed max-w-2xl mx-auto">{text(hero, 'description')}</p>
        </div>
      </section>

      <section className="py-20 bg-white/70 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cemac-100/80 text-cemac-700 rounded-xl text-sm font-semibold mb-5 shadow-sm">
              <Award size={14} aria-hidden /> {text(vision, 'badge')}
            </div>
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-6 leading-tight">{text(vision, 'title')}</h2>
            {strings(vision, 'paragraphs').map((paragraph) => (
              <p key={paragraph} className="text-gray-600 leading-relaxed mb-6">{paragraph}</p>
            ))}
            <div className="space-y-3">
              {strings(vision, 'benefits').map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-cemac-500 flex-shrink-0" aria-hidden />
                  <span className="text-gray-700 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => {
              const style = statStyles[index % statStyles.length]
              return (
                <div key={stat.key} className={`${style} rounded-2xl p-6 flex flex-col justify-between`}>
                  <p className="text-3xl font-black">{stat.displayValue}</p>
                  <p className={`text-sm font-medium ${style.includes('text-white') ? 'text-white' : 'text-cemac-600'}`}>{stat.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-transparent">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-3">{text(valuesIntro, 'title')}</h2>
            <p className="text-gray-500">{text(valuesIntro, 'description')}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const style = valueStyles[index % valueStyles.length]
              const Icon = style.icon
              return (
                <div key={value.id} className="bg-white/92 backdrop-blur-sm p-6 rounded-3xl shadow-[0_16px_36px_rgba(10,45,39,0.08)] border border-white text-center">
                  <div className={`inline-flex w-12 h-12 ${style.color} rounded-xl items-center justify-center mb-4`}><Icon size={22} aria-hidden /></div>
                  <h3 className="font-bold text-gray-900 mb-2">{text(value, 'title')}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{text(value, 'description')}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white/70 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-3">{text(sections, 'team_title')}</h2>
            <p className="text-gray-500">{text(sections, 'team_description')}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map((member) => (
              <div key={member.id} className="flex items-center gap-4 p-5 bg-white/90 rounded-3xl border border-white shadow-sm">
                {member.photoUrl
                  ? <img src={member.photoUrl} alt="" className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" />
                  : <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cemac-600 to-cemac-800 flex items-center justify-center text-white font-black text-lg flex-shrink-0" aria-hidden>{member.initials}</div>}
                <div><p className="font-bold text-gray-900">{member.fullName}</p><p className="text-cemac-700 text-sm font-medium">{member.role}</p><p className="text-gray-400 text-xs mt-0.5">{member.countryLabel}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-transparent">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12"><h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-3">{text(sections, 'milestones_title')}</h2><p className="text-gray-500">{text(sections, 'milestones_description')}</p></div>
          <div className="space-y-6 relative">
            <div className="absolute left-16 top-0 bottom-0 w-0.5 bg-cemac-100" aria-hidden />
            {milestones.map((milestone, index) => (
              <div key={milestone.id} className="flex gap-6 items-start relative">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm flex-shrink-0 z-10 ${index === milestones.length - 1 ? 'bg-cemac-700 text-white shadow-lg' : 'bg-white border-2 border-cemac-200 text-cemac-700'}`}>{String(milestone.year).slice(2)}</div>
                <div className="flex-1 bg-white/92 rounded-2xl p-4 border border-white shadow-sm"><span className="text-xs font-black text-cemac-600 uppercase tracking-wider">{milestone.year}</span><h3 className="font-bold text-gray-800 mt-1">{milestone.title}</h3><p className="text-gray-700 text-sm mt-1 leading-relaxed">{milestone.description}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white/70 backdrop-blur-sm border-t border-white/70">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-gray-400 text-sm font-semibold uppercase tracking-widest mb-8">{text(sections, 'partners_title')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {partners.map((partner) => (
              <a key={partner.id} href={partner.websiteUrl ?? undefined} className="p-5 bg-white/90 rounded-2xl border border-white shadow-sm">
                {partner.logoUrl && <img src={partner.logoUrl} alt="" className="h-10 mx-auto mb-2 object-contain" />}
                <p className="font-black text-cemac-800 text-lg mb-1">{partner.name}</p><p className="text-gray-400 text-xs leading-tight">{partner.description}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-gradient-to-r from-cemac-800 to-cemac-900">
        <div className="max-w-5xl mx-auto px-6 text-center"><p className="text-cemac-300 text-sm mb-6">{text(countriesIntro, 'title')}</p><div className="flex flex-wrap justify-center gap-3">{countries.map((country) => <span key={country.id} className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/10 rounded-full text-white text-sm">{text(country, 'flag')} {text(country, 'name')}</span>)}</div></div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-2xl mx-auto px-6 text-center"><h2 className="text-3xl font-black text-gray-900 mb-4">{text(cta, 'title')}</h2><p className="text-gray-500 mb-8">{text(cta, 'description')}</p><Link to="/auth/register" className="inline-flex items-center gap-2 px-8 py-4 bg-cemac-700 hover:bg-cemac-800 text-white font-bold text-lg rounded-2xl shadow-lg transition-all">{text(cta, 'label')} <ArrowRight size={20} aria-hidden /></Link></div>
      </section>
    </div>
  )
}
