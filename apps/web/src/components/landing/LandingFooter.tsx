import { Link } from 'react-router-dom'
import { Linkedin, Youtube, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSiteSetting } from '@/hooks/use-cms'
import { getPrimaryLanguage } from '@/lib/i18n-utils'
import { LogoMark } from '@/components/shared/LogoMark'
import { CEMAC_FLAG_COMPONENTS, type CemacFlagCode } from '@/components/landing/CemacFlags'
import type { CmsJsonObject } from '@/lib/cms-types'

const COUNTRIES: Array<{ code: CemacFlagCode; fr: string; en: string }> = [
  { code: 'CM', fr: 'Cameroun', en: 'Cameroon' },
  { code: 'CG', fr: 'Congo', en: 'Congo' },
  { code: 'GA', fr: 'Gabon', en: 'Gabon' },
  { code: 'GQ', fr: 'Guinée équatoriale', en: 'Equatorial Guinea' },
  { code: 'CF', fr: 'Centrafrique', en: 'Central African Republic' },
  { code: 'TD', fr: 'Tchad', en: 'Chad' },
]

export function LandingFooter() {
  const { t, i18n } = useTranslation()
  const locale = getPrimaryLanguage(i18n.resolvedLanguage ?? i18n.language) === 'en' ? 'en' : 'fr'
  const isFr = locale === 'fr'
  const identityQuery = useSiteSetting('app.identity')
  const socialQuery = useSiteSetting('social.links')
  const identity = identityQuery.data?.value as CmsJsonObject | undefined
  const social = socialQuery.data?.value as CmsJsonObject | undefined
  const name = typeof identity?.name === 'string' ? identity.name : 'CEMAC INTEGRA'
  const linkedin = typeof social?.linkedin === 'string' ? social.linkedin : 'https://www.linkedin.com'
  const twitter = typeof social?.twitter === 'string' ? social.twitter : 'https://x.com'

  const columns = [
    {
      title: isFr ? 'Navigation' : 'Navigation',
      links: [
        { label: isFr ? 'Accueil' : 'Home', href: '/' },
        { label: isFr ? 'Écosystème' : 'Ecosystem', href: '/#ecosystem' },
        { label: isFr ? 'Pays' : 'Countries', href: '/#pays' },
        { label: isFr ? 'Technologie' : 'Technology', href: '/#technologie' },
        { label: isFr ? 'À propos' : 'About', href: '/a-propos' },
      ],
    },
    {
      title: isFr ? 'Ressources' : 'Resources',
      links: [
        { label: isFr ? "Centre d'aide" : 'Help center', href: '/contact' },
        { label: isFr ? 'Documentation' : 'Documentation', href: '/blog' },
        { label: 'API', href: '/contact' },
        { label: isFr ? 'Tarifs' : 'Pricing', href: '/tarifs' },
        { label: 'Marketplace', href: '/marketplace-public' },
      ],
    },
    {
      title: isFr ? 'Légal' : 'Legal',
      links: [
        { label: isFr ? 'Mentions légales' : 'Legal notice', href: '/mentions-legales' },
        { label: isFr ? 'Confidentialité' : 'Privacy', href: '/confidentialite' },
        { label: 'Cookies', href: '/cookies' },
        { label: isFr ? 'CGU' : 'Terms', href: '/cgu' },
      ],
    },
  ]

  return (
    <footer className="border-t border-white/[0.06] bg-[#040c09] text-white">
      <div className="relative mx-auto max-w-[1280px] overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
        <div
          className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 opacity-[0.07]"
          aria-hidden
          style={{
            backgroundImage:
              'radial-gradient(circle at center, #3DDC97 1px, transparent 1.5px)',
            backgroundSize: '14px 14px',
            maskImage: 'radial-gradient(circle, black 20%, transparent 70%)',
          }}
        />

        <div className="relative grid gap-12 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <LogoMark size={36} />
              <span className="text-[15px] font-extrabold tracking-wide">
                CEMAC <span className="text-[#3DDC97]">INTEGRA</span>
              </span>
            </div>
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-white/45">
              {isFr
                ? 'La plateforme digitale souveraine pour connecter les économies, les institutions et les citoyens de l’Afrique centrale.'
                : 'The sovereign digital platform connecting economies, institutions and citizens across Central Africa.'}
            </p>
            <div className="flex gap-2.5">
              <a
                href={linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('footer.linkedin_aria')}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/60 transition hover:border-[#3DDC97]/40 hover:text-[#3DDC97]"
              >
                <Linkedin className="h-4 w-4" aria-hidden />
              </a>
              <a
                href={twitter}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('footer.twitter_aria')}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/60 transition hover:border-[#3DDC97]/40 hover:text-[#3DDC97]"
              >
                <span className="text-xs font-black" aria-hidden>
                  𝕏
                </span>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/60 transition hover:border-[#3DDC97]/40 hover:text-[#3DDC97]"
              >
                <Youtube className="h-4 w-4" aria-hidden />
              </a>
              <a
                href="mailto:contact@cemacintegra.com"
                aria-label="Email"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/60 transition hover:border-[#3DDC97]/40 hover:text-[#3DDC97]"
              >
                <Mail className="h-4 w-4" aria-hidden />
              </a>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-white/80">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-sm text-white/45 transition hover:text-[#3DDC97]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-white/80">
              {isFr ? 'Nos pays' : 'Our countries'}
            </h3>
            <ul className="space-y-2.5">
              {COUNTRIES.map((c) => {
                const Flag = CEMAC_FLAG_COMPONENTS[c.code]
                return (
                  <li key={c.fr} className="flex items-center gap-2.5 text-sm text-white/45">
                    <Flag className="h-3.5 w-5 shrink-0 rounded-[2px] border border-white/15" title={c[locale]} />
                    {c[locale]}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-white/35 sm:flex-row sm:px-6 lg:px-8">
          <p>
            © {name} {new Date().getFullYear()} — {isFr ? 'Tous droits réservés.' : 'All rights reserved.'}
          </p>
          <p>
            {isFr ? 'Fait avec' : 'Made with'} <span className="text-[#CE1126]">♥</span>{' '}
            {isFr ? 'en Afrique centrale' : 'in Central Africa'}
          </p>
        </div>
      </div>
    </footer>
  )
}
