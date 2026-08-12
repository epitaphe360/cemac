import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Globe, ChevronDown } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useTranslation } from 'react-i18next'
import { getPrimaryLanguage } from '@/lib/i18n-utils'

export function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const { isAuthenticated } = useAuthStore()
  const { i18n, t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const currentLanguage = getPrimaryLanguage(i18n.resolvedLanguage ?? i18n.language)
  const navLinks = [
    { label: t('landing.nav.features'), href: '/#features' },
    { label: t('marketplace.title'), href: '/marketplace-public' },
    { label: t('landing.nav.pricing'), href: '/tarifs' },
    { label: t('landing.nav.about'), href: '/a-propos' },
    { label: t('landing.nav.contact'), href: '/contact' },
  ]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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

  return (
    <>
      <nav
        aria-label="Navigation principale"
        className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-transparent border-b border-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cemac-600 to-cemac-800 flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-sm">CI</span>
              </div>
              <div className="hidden sm:block">
                <span className={`font-black text-xl tracking-tight transition-colors ${
                  scrolled ? 'text-gray-900' : 'text-white'
                }`}>
                  CEMAC
                </span>
                <span className={`font-black text-xl tracking-tight transition-colors ${
                  scrolled ? 'text-cemac-600' : 'text-cemac-600'
                }`}>
                  {' '}INTEGRA
                </span>
              </div>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleAnchor(link.href)}
                  aria-current={!link.href.startsWith('/#') && location.pathname === link.href ? 'page' : undefined}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
                    scrolled ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-50' : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Right actions */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Language switcher */}
              <div className="relative">
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  aria-label={t('landing.nav.change_language')}
                  aria-expanded={langOpen}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cemac-500 ${
                    scrolled ? 'text-gray-600 hover:bg-gray-100' : 'text-white hover:bg-white/10'
                  }`}
                >
                  <Globe size={15} aria-hidden />
                  <span>{currentLanguage.toUpperCase()}</span>
                  <ChevronDown size={13} aria-hidden />
                </button>
                {langOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-28 z-50">
                    <button
                      className="w-full px-4 py-2 text-sm text-left hover:bg-cemac-50 text-gray-700"
                      onClick={() => { i18n.changeLanguage('fr'); setLangOpen(false) }}
                    >
                      🇫🇷 {t('landing.nav.french')}
                    </button>
                    <button
                      className="w-full px-4 py-2 text-sm text-left hover:bg-cemac-50 text-gray-700"
                      onClick={() => { i18n.changeLanguage('en'); setLangOpen(false) }}
                    >
                      🇬🇧 {t('landing.nav.english')}
                    </button>
                  </div>
                )}
              </div>

              {isAuthenticated() ? (
                <Link
                  to="/dashboard"
                  className="px-5 py-2.5 bg-cemac-700 hover:bg-cemac-800 text-white font-semibold text-sm rounded-xl shadow-lg transition-all"
                >
                  {t('landing.nav.dashboard')} →
                </Link>
              ) : (
                <>
                  <Link
                    to="/auth/login"
                    className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all border ${
                      scrolled
                        ? 'border-gray-200 text-gray-700 hover:bg-gray-50'
                        : 'border-white/40 bg-black/20 text-white hover:bg-white/10'
                    }`}
                  >
                    {t('landing.nav.login')}
                  </Link>
                  <Link
                    to="/auth/register"
                    className="px-5 py-2.5 bg-cemac-600 hover:bg-cemac-700 text-white font-semibold text-sm rounded-xl shadow-lg transition-all"
                  >
                    {t('landing.nav.get_started')}
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className={`lg:hidden p-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cemac-500 ${
                scrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'
              }`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? t('landing.nav.close_menu') : t('landing.nav.open_menu')}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label={t('landing.nav.open_menu')}>
          <button type="button" className="absolute inset-0 w-full bg-black/60" onClick={() => setMenuOpen(false)} aria-label={t('landing.nav.close_menu')} />
          <div className="absolute top-0 left-0 right-0 bg-white shadow-2xl rounded-b-3xl p-6 pt-20">
            <div className="flex flex-col gap-1 mb-6">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleAnchor(link.href)}
                  className="px-4 py-3 text-left text-gray-700 font-medium rounded-xl hover:bg-cemac-50 hover:text-cemac-700 transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3 border-t border-gray-100 pt-4">
              {isAuthenticated() ? (
                <Link
                  to="/dashboard"
                  className="py-3 bg-cemac-700 text-white font-semibold text-center rounded-xl"
                >
                  {t('landing.nav.dashboard')} →
                </Link>
              ) : (
                <>
                  <Link
                    to="/auth/login"
                    className="py-3 border border-cemac-200 text-cemac-700 font-semibold text-center rounded-xl"
                  >
                    {t('landing.nav.login')}
                  </Link>
                  <Link
                    to="/auth/register"
                    className="py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white font-semibold text-center rounded-xl shadow"
                  >
                    {t('landing.nav.get_started')}
                  </Link>
                </>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600"
                  onClick={() => i18n.changeLanguage('fr')}
                >
                  🇫🇷 {t('landing.nav.french')}
                </button>
                <button
                  className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600"
                  onClick={() => i18n.changeLanguage('en')}
                >
                  🇬🇧 {t('landing.nav.english')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


