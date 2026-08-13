import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Globe, ChevronDown, ArrowRight, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useTranslation } from 'react-i18next'
import { getPrimaryLanguage } from '@/lib/i18n-utils'
import { LogoMark } from '@/components/shared/LogoMark'
import { cn } from '@/lib/utils'

export function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const { isAuthenticated } = useAuthStore()
  const { i18n, t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const currentLanguage = getPrimaryLanguage(i18n.resolvedLanguage ?? i18n.language)
  const isFr = currentLanguage === 'fr'

  const navLinks = [
    { label: isFr ? 'Accueil' : 'Home', href: '/' },
    { label: isFr ? 'Écosystème' : 'Ecosystem', href: '/#ecosystem' },
    { label: isFr ? 'Pays' : 'Countries', href: '/#pays' },
    { label: isFr ? 'Technologie' : 'Technology', href: '/#technologie' },
    { label: isFr ? 'À propos' : 'About', href: '/a-propos' },
  ]

  useEffect(() => {
    setMenuOpen(false)
    setLangOpen(false)
  }, [location.pathname, location.hash])

  useEffect(() => {
    if (!location.hash) return
    const id = decodeURIComponent(location.hash.slice(1))
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
    return () => window.clearTimeout(timer)
  }, [location.pathname, location.hash])

  const handleAnchor = (href: string) => {
    if (href.startsWith('/#')) {
      const hash = href.slice(1)
      if (location.pathname !== '/' || location.hash !== hash) {
        navigate({ pathname: '/', hash })
      } else {
        document.getElementById(href.slice(2))?.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      navigate(href)
    }
    setMenuOpen(false)
  }

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/' && !location.hash
    if (href.startsWith('/#')) return location.pathname === '/' && location.hash === href.slice(1)
    return location.pathname === href
  }

  return (
    <>
      {/* Top utility bar */}
      <div className="fixed left-0 right-0 top-0 z-[60] border-b border-white/[0.06] bg-[#06110d]/95 text-[11px] text-white/55 backdrop-blur-md">
        <div className="mx-auto flex h-8 max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <p className="truncate">
            {isFr
              ? 'CEMAC INTEGRA · la plateforme digitale pour une intégration régionale plus forte et plus inclusive.'
              : 'CEMAC INTEGRA · the digital platform for stronger, more inclusive regional integration.'}
          </p>
          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            <Link to="/blog" className="transition hover:text-white">
              {isFr ? 'Actualités' : 'News'}
            </Link>
            <span className="text-white/20">|</span>
            <Link to="/contact" className="inline-flex items-center gap-1 transition hover:text-white">
              {isFr ? 'Événements' : 'Events'}
              <ChevronRight className="h-3 w-3" aria-hidden />
            </Link>
          </div>
        </div>
      </div>

      <nav
        aria-label="Navigation principale"
        className="fixed left-0 right-0 top-8 z-50 border-b border-white/[0.07] bg-[#07140f]/90 backdrop-blur-xl"
      >
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-[72px] items-center justify-between">
            <Link to="/" className="group flex items-center gap-3">
              <LogoMark size={36} className="transition-transform duration-300 group-hover:scale-105" />
              <span className="text-[15px] font-extrabold tracking-[0.04em] text-white">
                CEMAC <span className="text-[#3DDC97]">INTEGRA</span>
              </span>
            </Link>

            <div className="hidden items-center gap-1 xl:flex">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => handleAnchor(link.href)}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  className={cn(
                    'relative rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3DDC97]',
                    isActive(link.href) ? 'text-white' : 'text-white/60 hover:text-white'
                  )}
                >
                  {link.label}
                  {isActive(link.href) && (
                    <span className="absolute inset-x-3 -bottom-[1px] h-0.5 rounded-full bg-[#3DDC97]" />
                  )}
                </button>
              ))}
            </div>

            <div className="hidden items-center gap-2.5 lg:flex">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setLangOpen(!langOpen)}
                  aria-label={t('landing.nav.change_language')}
                  aria-expanded={langOpen}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-white/70 transition hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3DDC97]"
                >
                  <Globe size={14} aria-hidden />
                  <span>{currentLanguage.toUpperCase()}</span>
                  <ChevronDown size={12} aria-hidden />
                </button>
                {langOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-32 overflow-hidden rounded-xl border border-white/10 bg-[#0c1a15] py-1 shadow-2xl">
                    <button
                      type="button"
                      className="w-full px-4 py-2 text-left text-sm text-white/80 hover:bg-white/5"
                      onClick={() => {
                        i18n.changeLanguage('fr')
                        setLangOpen(false)
                      }}
                    >
                      FR {t('landing.nav.french')}
                    </button>
                    <button
                      type="button"
                      className="w-full px-4 py-2 text-left text-sm text-white/80 hover:bg-white/5"
                      onClick={() => {
                        i18n.changeLanguage('en')
                        setLangOpen(false)
                      }}
                    >
                      EN {t('landing.nav.english')}
                    </button>
                  </div>
                )}
              </div>

              {isAuthenticated() ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#3DDC97] px-4 py-2.5 text-[13px] font-semibold text-[#052014] transition hover:bg-[#54e6a7]"
                >
                  {t('landing.nav.dashboard')}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              ) : (
                <>
                  <Link
                    to="/auth/login"
                    className="rounded-lg border border-white/20 px-4 py-2 text-[13px] font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
                  >
                    {isFr ? 'Se connecter' : 'Sign in'}
                  </Link>
                  <Link
                    to="/auth/register"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#3DDC97] px-4 py-2.5 text-[13px] font-semibold text-[#052014] transition hover:bg-[#54e6a7]"
                  >
                    {isFr ? 'Rejoindre la plateforme' : 'Join the platform'}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              className="rounded-lg p-2 text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3DDC97] lg:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? t('landing.nav.close_menu') : t('landing.nav.open_menu')}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label={t('landing.nav.open_menu')}>
          <button
            type="button"
            className="absolute inset-0 w-full bg-black/70 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-label={t('landing.nav.close_menu')}
          />
          <div className="absolute left-0 right-0 top-[104px] rounded-b-3xl border-b border-white/10 bg-[#0a1611] p-6 shadow-2xl">
            <div className="mb-6 flex flex-col gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => handleAnchor(link.href)}
                  className="rounded-xl px-4 py-3 text-left font-medium text-white/80 transition hover:bg-white/5 hover:text-white"
                >
                  {link.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
              {isAuthenticated() ? (
                <Link to="/dashboard" className="rounded-xl bg-[#3DDC97] py-3 text-center font-semibold text-[#052014]">
                  {t('landing.nav.dashboard')} →
                </Link>
              ) : (
                <>
                  <Link to="/auth/login" className="rounded-xl border border-white/20 py-3 text-center font-semibold text-white">
                    {isFr ? 'Se connecter' : 'Sign in'}
                  </Link>
                  <Link to="/auth/register" className="rounded-xl bg-[#3DDC97] py-3 text-center font-semibold text-[#052014]">
                    {isFr ? 'Rejoindre la plateforme' : 'Join the platform'}
                  </Link>
                </>
              )}
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  className="flex-1 rounded-xl border border-white/15 py-2 text-sm text-white/80"
                  onClick={() => i18n.changeLanguage('fr')}
                >
                  FR {t('landing.nav.french')}
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-xl border border-white/15 py-2 text-sm text-white/80"
                  onClick={() => i18n.changeLanguage('en')}
                >
                  EN {t('landing.nav.english')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
