import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLegalDocument } from '@/hooks/use-cms'
import { getPrimaryLanguage } from '@/lib/i18n-utils'
import type { CmsLocale } from '@/lib/cms-types'

type LegalType = 'cgu' | 'privacy' | 'cookies' | 'legal'

interface LegalPageProps {
  type: LegalType
}

function CmsState({ message }: Readonly<{ message: string }>) {
  return <output className="block min-h-screen px-6 pt-32 text-center">{message}</output>
}

export function LegalPage({ type }: LegalPageProps) {
  const { t, i18n } = useTranslation()
  const locale = getPrimaryLanguage(i18n.resolvedLanguage ?? i18n.language) as CmsLocale
  const { data: document, loading, error } = useLegalDocument(type, locale)

  if (loading) return <CmsState message={t('common.loading')} />
  if (error) return <CmsState message={t('common.error')} />
  if (!document || document.sections.length === 0) {
    return <CmsState message={locale === 'fr' ? 'Document temporairement indisponible.' : 'Document temporarily unavailable.'} />
  }

  const effectiveDate = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(`${document.effectiveDate}T00:00:00`))

  return (
    <div className="min-h-screen bg-gradient-to-b from-cemac-50/50 to-white">
      <div className="max-w-3xl mx-auto px-6 py-16 lg:py-24">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-cemac-700 hover:text-cemac-900 mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t('common.back')}
        </Link>
        <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-2">{document.title}</h1>
        <time dateTime={document.effectiveDate} className="block text-sm text-muted-foreground mb-10">{effectiveDate}</time>
        <div className="space-y-8">
          {document.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-bold text-cemac-900 mb-3">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph} className="text-gray-600 leading-relaxed mb-3 last:mb-0">{paragraph}</p>)}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

export function TermsPage() { return <LegalPage type="cgu" /> }
export function PrivacyPage() { return <LegalPage type="privacy" /> }
export function CookiesPage() { return <LegalPage type="cookies" /> }
export function LegalNoticePage() { return <LegalPage type="legal" /> }
