import { Link } from 'react-router-dom'
import { MapPin, Mail, Phone, ExternalLink, Linkedin, Twitter } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CEMAC_COUNTRIES } from '@/lib/constants'

export function LandingFooter() {
  const { t } = useTranslation()
  const footerLinks = {
    [t('footer.sections.platform')]: [
      { label: t('footer.links.features'), href: '/#features' },
      { label: t('footer.links.certifications'), href: '/#certifications' },
      { label: t('footer.links.marketplace'), href: '/marketplace-public' },
      { label: t('footer.links.logistics'), href: '/#logistics' },
      { label: t('footer.links.market'), href: '/#market' },
      { label: t('footer.links.pricing'), href: '/tarifs' },
    ],
    [t('footer.sections.company')]: [
      { label: t('footer.links.about'), href: '/a-propos' },
      { label: t('footer.links.contact'), href: '/contact' },
      { label: t('footer.links.partners'), href: '/partenaires' },
      { label: t('footer.links.blog'), href: '/blog' },
      { label: t('footer.links.press'), href: '/presse' },
    ],
    [t('footer.sections.legal')]: [
      { label: t('footer.links.terms'), href: '/cgu' },
      { label: t('footer.links.privacy'), href: '/confidentialite' },
      { label: t('footer.links.cookies'), href: '/cookies' },
      { label: t('footer.links.legal'), href: '/mentions-legales' },
    ],
  }

  return (
    <footer className="bg-cemac-950 text-white">
      {/* CTA band */}
      <div className="bg-gradient-to-r from-cemac-700 via-cemac-800 to-cemac-900 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-black mb-4">
            {t('footer.cta_title_prefix')}{' '}
            <span className="text-gold-400">{t('footer.cta_title_highlight')}</span>
          </h2>
          <p className="text-cemac-200 text-lg mb-8 max-w-2xl mx-auto">
            {t('footer.cta_description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth/register"
              className="px-8 py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-bold rounded-2xl shadow-xl transition-all text-lg"
            >
              {t('footer.start_free')}
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 border-2 border-white/30 hover:border-white/60 text-white font-semibold rounded-2xl transition-all text-lg"
            >
              {t('footer.contact_sales')}
            </Link>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cemac-600 to-cemac-800 flex items-center justify-center">
                <span className="text-white font-black text-sm">CI</span>
              </div>
              <div>
                <span className="font-black text-xl text-white">CEMAC</span>
                <span className="font-black text-xl text-gold-400"> INTEGRA</span>
              </div>
            </div>
            <p className="text-cemac-300 text-sm leading-relaxed mb-6 max-w-xs">
              {t('footer.brand_description')}
            </p>

            {/* Countries */}
            <div className="flex flex-wrap gap-2 mb-6">
              {CEMAC_COUNTRIES.map((c) => (
                <span
                  key={c.code}
                  className="flex items-center gap-1 px-2.5 py-1 bg-cemac-900 rounded-lg text-xs text-cemac-300"
                >
                  {c.flag} {c.name}
                </span>
              ))}
            </div>

            {/* Social + contact */}
            <div className="flex gap-3 mb-4">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('footer.linkedin_aria')}
                className="w-9 h-9 rounded-lg bg-cemac-900 hover:bg-cemac-800 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cemac-400"
              >
                <Linkedin size={16} className="text-cemac-400" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('footer.twitter_aria')}
                className="w-9 h-9 rounded-lg bg-cemac-900 hover:bg-cemac-800 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cemac-400"
              >
                <Twitter size={16} className="text-cemac-400" />
              </a>
            </div>

            <div className="space-y-2 text-sm text-cemac-400">
              <div className="flex items-center gap-2">
                <MapPin size={14} />
                <span>{t('footer.location')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} />
                <span>contact@cemacintegra.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} />
                <span>+237 699 000 000</span>
              </div>
            </div>
          </div>

          {/* Links columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
                {section}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-cemac-400 hover:text-gold-400 text-sm transition-colors flex items-center gap-1 group"
                    >
                      {link.label}
                      {link.href.startsWith('http') && (
                        <ExternalLink size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-cemac-900">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-cemac-500 text-sm">
            © {new Date().getFullYear()} CEMAC INTEGRA. {t('footer.rights')}
          </p>
          <div className="flex items-center gap-1 text-cemac-500 text-xs">
            <span>{t('footer.compliance')}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
