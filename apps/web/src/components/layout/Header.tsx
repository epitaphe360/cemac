import { Menu, Bell, Globe, X, CheckCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth.store'
import { getPrimaryLanguage } from '@/lib/i18n-utils'
import { getInitials, formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import type { Notification } from '@/types'

interface HeaderProps {
  isMenuOpen: boolean
  onMenuClick: () => void
}

export function Header({ isMenuOpen, onMenuClick }: Readonly<HeaderProps>) {
  const { i18n, t } = useTranslation()
  const profile = useAuthStore((s) => s.profile)
  const currentLanguage = getPrimaryLanguage(i18n.resolvedLanguage ?? i18n.language)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const notifButtonRef = useRef<HTMLButtonElement>(null)
  const notifCloseRef = useRef<HTMLButtonElement>(null)

  const toggleLang = () => {
    i18n.changeLanguage(currentLanguage === 'fr' ? 'en' : 'fr')
  }

  // Load notifications for current user
  useEffect(() => {
    if (!profile?.id) return
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (error) {
          toast.error(t('errors.load_failed', 'Impossible de charger les notifications'))
          return
        }
        setNotifs(data ?? [])
      })
  }, [profile?.id, t])

  // Close the notification popover on outside click or Escape.
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && notifOpen) {
        setNotifOpen(false)
        notifButtonRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [notifOpen])

  useEffect(() => {
    if (notifOpen) notifCloseRef.current?.focus()
  }, [notifOpen])

  const unreadCount = notifs.filter((n) => !n.read).length

  const markAllRead = async () => {
    if (!profile?.id || unreadCount === 0) return
    const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', profile.id).eq('read', false)
    if (error) {
      toast.error(t('errors.update_failed', 'Impossible de mettre à jour les notifications'))
      return
    }
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <header className="sticky top-0 z-20 h-20 shrink-0 px-3 pt-3 sm:px-5 lg:px-6">
      <div className="flex h-full items-center justify-between rounded-[24px] border border-white/80 bg-white/85 px-4 shadow-subtle backdrop-blur-xl lg:px-6">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label={t('header.open_menu')}
          aria-expanded={isMenuOpen}
          aria-controls="app-sidebar"
          className="lg:hidden rounded-xl p-2.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cemac-500 focus-visible:ring-offset-2"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden lg:flex lg:items-center lg:gap-3">
          <div className="hero-chip hidden xl:inline-flex">{t('header.operator_space')}</div>
        </div>

        <div className="flex items-center gap-2">
        {/* Toggle langue */}
        <button
          type="button"
          onClick={toggleLang}
          aria-label={t('landing.nav.change_language', 'Changer de langue')}
          className="flex min-h-10 items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white/70 px-2.5 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-cemac-500 focus-visible:ring-offset-2 sm:px-3"
        >
          <Globe className="h-3.5 w-3.5" />
          {currentLanguage.toUpperCase()}
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            ref={notifButtonRef}
            onClick={() => setNotifOpen((open) => !open)}
            aria-label={t('header.notifications')}
            aria-expanded={notifOpen}
            aria-haspopup="dialog"
            aria-controls="notification-panel"
            className="relative min-h-10 min-w-10 rounded-xl border border-gray-200/80 bg-white/70 p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cemac-500 focus-visible:ring-offset-2"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div
              id="notification-panel"
              role="dialog"
              aria-modal="false"
              aria-labelledby="notification-title"
              className="fixed inset-x-2 top-[4.75rem] z-50 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-80"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <p id="notification-title" className="text-sm font-semibold text-gray-900">{t('header.notifications')}</p>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-cemac-700 hover:bg-cemac-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cemac-500"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      {t('header.mark_all_read', 'Tout marquer comme lu')}
                    </button>
                  )}
                  {unreadCount === 0 && notifs.length > 0 && (
                    <span className="text-xs text-gray-400 flex items-center gap-1"><CheckCheck className="h-3 w-3" />{t('header.all_read')}</span>
                  )}
                  <button
                    ref={notifCloseRef}
                    type="button"
                    onClick={() => {
                      setNotifOpen(false)
                      notifButtonRef.current?.focus()
                    }}
                    aria-label={t('header.close_notifications', 'Fermer les notifications')}
                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-cemac-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="max-h-[min(18rem,calc(100vh-9rem))] overflow-y-auto divide-y divide-gray-50" aria-live="polite">
                {notifs.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-400">{t('header.no_notifications')}</div>
                ) : notifs.map((n) => (
                  <div key={n.id} className={`px-4 py-3 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-cemac-50/40' : ''}`}>
                    {n.title && <p className="text-xs font-semibold text-gray-900">{n.title}</p>}
                    <p className={`text-xs leading-snug ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.body ?? n.message ?? n.title}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(n.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        {profile && (
          <div className="flex items-center gap-3 rounded-2xl border border-gray-200/80 bg-white/70 py-1.5 pl-2 pr-3 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cemac-600 to-cemac-800 text-sm font-semibold text-white shrink-0">
              {getInitials(profile.full_name ?? profile.email)}
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900 leading-none">{profile.full_name}</p>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">{profile.role.replace(/_/g, ' ')}</p>
            </div>
          </div>
        )}
      </div>
      </div>
    </header>
  )
}
