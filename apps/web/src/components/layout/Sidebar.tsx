import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard, Award, ShoppingBag, Truck,
  BarChart3, Settings, LogOut, Building2, X, Shield, Package, Receipt
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const ADMIN_ROLES = ['super_admin', 'cemac_officer', 'chamber_agent']

const nav = [
  { to: '/dashboard',           icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { to: '/certifications',      icon: Award,           labelKey: 'nav.certifications' },
  { to: '/marketplace',         icon: ShoppingBag,     labelKey: 'nav.marketplace' },
  { to: '/logistics',           icon: Truck,           labelKey: 'nav.logistics' },
  { to: '/market-intelligence', icon: BarChart3,       labelKey: 'nav.market' },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const profile = useAuthStore((s) => s.profile)
  const entreprise = useAuthStore((s) => s.entreprise)

  const handleLogout = async () => {
    await logout()
    toast.success('Déconnexion réussie')
    navigate('/auth/login')
  }

  const userRole = profile?.role ?? 'public'
  const isAdmin = ADMIN_ROLES.includes(userRole)

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-30 flex w-72 flex-col bg-[#0d1517] text-white transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(47,173,146,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(239,184,54,0.12),transparent_22%)]" />
        {/* Header sidebar */}
        <div className="relative flex h-20 items-center justify-between border-b border-white/10 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cemac-500 to-cemac-800 text-sm font-black text-white shadow-[0_10px_20px_rgba(14,122,101,0.35)]">
              CI
            </div>
            <div>
              <span className="block text-sm font-black uppercase tracking-[0.18em] text-white/70">CEMAC</span>
              <span className="block text-lg font-black text-white">INTEGRA</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden rounded-xl p-2 text-gray-400 hover:bg-white/5 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Entreprise info */}
        {entreprise && (
          <div className="relative mx-4 mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 shadow-inner backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 shrink-0 text-gold-400" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{entreprise.raison_sociale}</p>
                <p className="text-xs capitalize text-white/60">Plan {entreprise.subscription_plan}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="relative flex-1 space-y-1 overflow-y-auto px-4 py-5">
          {nav.map(({ to, icon: Icon, labelKey }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-cemac-500/25 to-white/5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                  : 'text-white/65 hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t(labelKey)}
            </NavLink>
          ))}

          {/* Admin link — visible only to privileged roles */}
          {isAdmin && (
            <NavLink
              to="/admin"
              onClick={onClose}
              className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-red-500/15 text-red-200 font-semibold'
                  : 'text-white/65 hover:bg-red-500/10 hover:text-red-200'
              )}
            >
              <Shield className="h-4 w-4 shrink-0" />
              {t('nav.admin')}
            </NavLink>
          )}

          {/* Mes Produits — visible uniquement pour company_admin */}
          {userRole === 'company_admin' && (
            <NavLink
              to="/products"
              onClick={onClose}
              className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-cemac-500/25 to-white/5 text-white font-semibold'
                  : 'text-white/65 hover:bg-white/5 hover:text-white'
              )}
            >
              <Package className="h-4 w-4 shrink-0" />
              Mes Produits
            </NavLink>
          )}
        </nav>

        {/* Pied de sidebar */}
        <div className="relative space-y-1 border-t border-white/10 p-4">
          <NavLink
            to="/billing"
            onClick={onClose}
            className={({ isActive }) => cn(
              'flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all duration-200',
              isActive ? 'bg-gradient-to-r from-cemac-500/25 to-white/5 text-white' : 'text-white/65 hover:bg-white/5 hover:text-white'
            )}
          >
            <Receipt className="h-4 w-4" />
            {t('nav.billing')}
          </NavLink>
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) => cn(
              'flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all duration-200',
              isActive ? 'bg-gradient-to-r from-cemac-500/25 to-white/5 text-white' : 'text-white/65 hover:bg-white/5 hover:text-white'
            )}
          >
            <Settings className="h-4 w-4" />
            {t('nav.settings')}
          </NavLink>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200"
          >
            <LogOut className="h-4 w-4" />
            {t('nav.logout')}
          </button>

          {profile && (
            <div className="px-3 py-2 text-xs truncate text-white/45">
              {profile.full_name} · {profile.role.replace('_', ' ')}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

