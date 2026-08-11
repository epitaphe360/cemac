import { Menu, Bell, Globe, X, CheckCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth.store'
import { getPrimaryLanguage } from '@/lib/i18n-utils'
import { getInitials, formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useState, useEffect, useRef } from 'react'

interface HeaderProps {
  onMenuClick: () => void
}

interface Notif {
  id: string
  type: string
  message: string
  read: boolean
  created_at: string
}

export function Header({ onMenuClick }: HeaderProps) {
  const { i18n, t } = useTranslation()
  const profile = useAuthStore((s) => s.profile)
  const currentLanguage = getPrimaryLanguage(i18n.resolvedLanguage ?? i18n.language)
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  const toggleLang = () => {
    i18n.changeLanguage(currentLanguage === 'fr' ? 'en' : 'fr')
  }

  // Load notifications for current user
  useEffect(() => {
    if (!profile?.id) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase as any)
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }: { data: Notif[] | null }) => {
        if (data) setNotifs(data)
      })
  }, [profile?.id])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unreadCount = notifs.filter((n) => !n.read).length

  const markAllRead = async () => {
    if (!profile?.id || unreadCount === 0) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('notifications').update({ read: true }).eq('user_id', profile.id).eq('read', false)
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <header className="sticky top-0 z-20 h-20 shrink-0 px-3 pt-3 sm:px-5 lg:px-6">
      <div className="flex h-full items-center justify-between rounded-[24px] border border-white/80 bg-white/80 px-4 shadow-[0_10px_30px_rgba(8,40,35,0.08)] backdrop-blur-xl lg:px-6">
        <button
          onClick={onMenuClick}
          aria-label={t('header.open_menu')}
          className="lg:hidden rounded-xl p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cemac-500"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden lg:flex lg:items-center lg:gap-3">
          <div className="hero-chip hidden xl:inline-flex">{t('header.operator_space')}</div>
        </div>

        <div className="flex items-center gap-2">
        {/* Toggle langue */}
        <button
          onClick={toggleLang}
          className="flex items-center gap-1 rounded-xl border border-gray-200/80 bg-white/70 px-3 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <Globe className="h-3.5 w-3.5" />
          {currentLanguage.toUpperCase()}
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen((o) => !o); if (!notifOpen && unreadCount > 0) markAllRead() }}
            aria-label={t('header.notifications')}
            className="relative rounded-xl border border-gray-200/80 bg-white/70 p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-cemac-500"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900">{t('header.notifications')}</p>
                <div className="flex items-center gap-2">
                  {unreadCount === 0 && notifs.length > 0 && (
                    <span className="text-xs text-gray-400 flex items-center gap-1"><CheckCheck className="h-3 w-3" />{t('header.all_read')}</span>
                  )}
                  <button onClick={() => setNotifOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                {notifs.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-400">{t('header.no_notifications')}</div>
                ) : notifs.map((n) => (
                  <div key={n.id} className={`px-4 py-3 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-cemac-50/40' : ''}`}>
                    <p className={`text-xs leading-snug ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.message}</p>
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
