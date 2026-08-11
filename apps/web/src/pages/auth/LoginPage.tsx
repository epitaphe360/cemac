import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Mail, Lock, Eye, EyeOff, ChevronDown, ChevronUp, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const schema = z.object({
  email:    z.string().email('Email invalide'),
  password: z.string().min(6, 'Minimum 6 caractères'),
})

type FormData = z.infer<typeof schema>

const DEMO_ACCOUNTS_ENABLED = import.meta.env.DEV

// ── Comptes de démonstration ─────────────────────────────────
const DEMO_ACCOUNTS = import.meta.env.DEV ? [
  {
    group: 'Administration CEMAC',
    color: 'bg-cemac-700 hover:bg-cemac-800 text-white',
    accounts: [
      { label: 'Super Admin',    email: 'admin@cemac-integra.com', password: 'Demo@2026!', role: 'super_admin'   },
      { label: 'Officier CEMAC', email: 'officier@cemac.int',      password: 'Demo@2026!', role: 'cemac_officer' },
      { label: 'Auditeur',       email: 'auditeur@cemac-audit.com',password: 'Demo@2026!', role: 'auditor'       },
    ],
  },
  {
    group: 'Entreprises (company_admin)',
    color: 'bg-gold-600 hover:bg-gold-700 text-white',
    accounts: [
      { label: '🇨🇲 AgrITech CM',   email: 'dg@agritech-cm.com',  password: 'Demo@2026!', role: 'company_admin' },
      { label: '🇨🇲 Cacao Élite',   email: 'dg@cacao-elite.cm',   password: 'Demo@2026!', role: 'company_admin' },
      { label: '🇬🇦 GaboWood GA',   email: 'dg@gabowood.ga',      password: 'Demo@2026!', role: 'company_admin' },
      { label: '🇨🇬 Congo Bio CG',  email: 'dg@congobio.cg',      password: 'Demo@2026!', role: 'company_admin' },
    ],
  },
  {
    group: 'Autres Acteurs',
    color: 'bg-blue-600 hover:bg-blue-700 text-white',
    accounts: [
      { label: '🇨🇲 Agent CCIMA',   email: 'agent.cm@ccima.cm',       password: 'Demo@2026!', role: 'chamber_agent'   },
      { label: '🇬🇦 Agent CCIG',    email: 'agent.ga@ccig.ga',        password: 'Demo@2026!', role: 'chamber_agent'   },
      { label: 'Acheteur EU',       email: 'acheteur@import-export.eu',password: 'Demo@2026!', role: 'buyer'           },
      { label: 'Agent Transit',     email: 'transit@sdv-cm.com',      password: 'Demo@2026!', role: 'logistics_agent' },
    ],
  },
] : []

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const initialize = useAuthStore((s) => s.initialize)
  const [showPassword, setShowPassword] = useState(false)
  const [showDemo, setShowDemo] = useState(false)
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null)

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      toast.error(t('errors.auth_failed'))
      return
    }

    await initialize()
    toast.success(t('auth.signin_success'))
    navigate('/dashboard')
  }

  const loginAs = async (email: string, password: string, label: string) => {
    setLoadingDemo(email)
    setValue('email', email)
    setValue('password', password)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(t('auth.login_as_failed', { label }))
      setLoadingDemo(null)
      return
    }
    await initialize()
    toast.success(t('auth.connected_as', { label }))
    navigate('/dashboard')
    setLoadingDemo(null)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(20,129,110,0.16),transparent_24%),radial-gradient(circle_at_top_right,rgba(243,190,43,0.18),transparent_22%),linear-gradient(180deg,#f4fbf8_0%,#ffffff_48%,#f7f5ee_100%)] px-4 py-8">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="hero-chip mb-4">{t('auth.secure_access_badge')}</div>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-cemac-600 to-cemac-800 text-white text-2xl font-bold mb-4 shadow-[0_18px_38px_rgba(16,105,91,0.25)]">
            CI
          </div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">CEMAC INTEGRA</h1>
          <p className="text-sm text-gray-500 mt-2">{t('app.tagline')}</p>
        </div>

        <Card className="border-white/80 bg-white/88 shadow-[0_24px_80px_rgba(10,45,39,0.12)]">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">{t('auth.login')}</CardTitle>
            <CardDescription className="text-center">
              {t('auth.signin_description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('auth.email_placeholder')}
                    className="pl-9"
                    {...register('email')}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              {/* Mot de passe */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <Link
                    to="/auth/forgot-password"
                    className="text-xs text-cemac-700 hover:underline"
                  >
                    {t('auth.forgot_password')}
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.password_placeholder')}
                    className="pl-9 pr-9"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Masquer' : 'Afficher'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <Button type="submit" className="w-full" loading={isSubmitting}>
                {isSubmitting ? t('auth.connecting') : t('auth.login_cta')}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              {t('auth.no_account')}{' '}
              <Link to="/auth/register" className="text-cemac-700 font-medium hover:underline">
                {t('auth.create_account')}
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* ── Raccourcis de connexion ── */}
        {DEMO_ACCOUNTS_ENABLED && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowDemo(!showDemo)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/85 border border-dashed border-cemac-200 text-sm font-medium text-gray-600 hover:border-cemac-400 hover:text-cemac-700 transition-colors shadow-sm backdrop-blur-sm"
          >
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-gold-500" />
              {t('auth.quick_demo_access')}
            </span>
            {showDemo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showDemo && (
            <div className="mt-2 rounded-2xl bg-white/92 border border-white shadow-[0_14px_40px_rgba(10,45,39,0.08)] p-4 space-y-4 animate-fade-in backdrop-blur-sm">
              {DEMO_ACCOUNTS.map((group) => (
                <div key={group.group}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    {t(`auth.demo_groups.${group.group === 'Administration CEMAC' ? 'admin' : group.group === 'Entreprises (company_admin)' ? 'companies' : 'other'}`)}
                  </p>
                  <div className="flex flex-col gap-2">
                    {group.accounts.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        disabled={loadingDemo === acc.email}
                        onClick={() => loginAs(acc.email, acc.password, acc.label)}
                        className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-opacity ${group.color} disabled:opacity-60`}
                      >
                        <span>{acc.label}</span>
                        <span className="text-xs opacity-75 truncate max-w-[180px]">
                          {loadingDemo === acc.email ? `⏳ ${t('auth.connecting')}` : acc.email}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-400 text-center pt-1 border-t border-gray-50">
                {t('auth.demo_hint')}
              </p>
            </div>
          )}
        </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2026 CEMAC INTEGRA · Zone CEMAC · ZLECAF · UA
        </p>
      </div>
    </div>
  )
}
