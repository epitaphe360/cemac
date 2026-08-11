import { useState, useEffect } from 'react'
import type { ElementType } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import {
  User, Lock, Building2, Bell, CreditCard,
  Save, Eye, EyeOff, CheckCircle2, Shield, ExternalLink, AlertCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { usePricing } from '@/hooks/use-cms'
import { CEMAC_COUNTRIES } from '@/lib/constants'
import { findPricingPlan, getUpgradePlans } from '@/lib/pricing'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

// ─── Schemas ────────────────────────────────────────────────────────────────

type TranslateFn = (key: string, options?: Record<string, string | number>) => string

const createProfileSchema = (t: TranslateFn) => z.object({
  full_name: z.string()
    .trim()
    .min(1, t('settings.validation.name_required'))
    .min(2, t('errors.min_length', { min: 2 })),
  phone: z.string().optional(),
})

const createPasswordSchema = (t: TranslateFn) => z.object({
  currentPassword: z.string().min(6, t('settings.validation.current_password_required')),
  newPassword: z.string().min(8, t('errors.min_length', { min: 8 })),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: t('settings.validation.password_mismatch'),
  path: ['confirmPassword'],
})

const createEntrepriseSchema = (t: TranslateFn) => z.object({
  raison_sociale: z.string().min(2, t('settings.validation.company_name_required')),
  secteur_activite: z.string().optional(),
  adresse: z.string().optional(),
  ville: z.string().optional(),
  email_contact: z.string().email(t('errors.invalid_email')).optional().or(z.literal('')),
  telephone: z.string().optional(),
  site_web: z.string().url(t('settings.validation.invalid_url')).optional().or(z.literal('')),
  description: z.string().max(500, t('errors.max_length', { max: 500 })).optional(),
})

type ProfileForm = z.infer<ReturnType<typeof createProfileSchema>>
type PasswordForm = z.infer<ReturnType<typeof createPasswordSchema>>
type EntrepriseForm = z.infer<ReturnType<typeof createEntrepriseSchema>>

// ─── Tab type ────────────────────────────────────────────────────────────────

type Tab = 'profile' | 'security' | 'company' | 'notifications' | 'plan'

const TABS: { id: Tab; label: string; icon: ElementType }[] = [
  { id: 'profile',       label: 'settings.tabs.profile',       icon: User },
  { id: 'security',      label: 'settings.tabs.security',      icon: Lock },
  { id: 'company',       label: 'settings.tabs.company',       icon: Building2 },
  { id: 'notifications', label: 'settings.tabs.notifications', icon: Bell },
  { id: 'plan',          label: 'settings.tabs.plan',          icon: CreditCard },
]

const PLAN_BADGE_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700',
  sme: 'bg-cemac-100 text-cemac-800',
  enterprise: 'bg-purple-100 text-purple-800',
  institutional: 'bg-gold-100 text-gold-800',
}

// ─── Notification preferences state ─────────────────────────────────────────

const DEFAULT_NOTIFS = {
  cert_status_change:  true,
  new_document:        true,
  marketplace_inquiry: true,
  price_alert:         false,
  newsletter:          false,
  security_alert:      true,
}

// ─────────────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    // Auto-open Plan tab and show success toast when returning from Stripe checkout
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('checkout') === 'success') return 'plan'
      const requestedTab = params.get('tab')
      if (TABS.some((tab) => tab.id === requestedTab)) return requestedTab as Tab
    }
    return 'profile'
  })

  // Show success toast once when Stripe redirects back
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('checkout') === 'success') {
      const planLabel = params.get('plan') ?? 'sme'
      toast.success(t('settings.toasts.subscription_success', { plan: planLabel }))
      // Clean URL without reload
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [t])

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#143c39_0%,#115e59_52%,#d4a62f_135%)] px-6 py-7 text-white shadow-[0_20px_60px_rgba(15,60,56,0.24)] sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_24%)]" />
        <div className="relative">
        <div className="hero-chip mb-4 border-white/15 bg-white/10 text-white">{t('settings.badge')}</div>
        <h1 className="text-3xl font-black tracking-tight text-white">{t('settings.title')}</h1>
        <p className="mt-2 text-sm text-white/75">
          {t('settings.description')}
        </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar tabs */}
        <nav className="lg:w-60 shrink-0">
          <ul className="space-y-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-all',
                    activeTab === id
                      ? 'bg-white text-cemac-900 font-semibold shadow-[0_10px_24px_rgba(10,45,39,0.08)]'
                      : 'text-gray-600 hover:bg-white/70 hover:text-gray-900'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                    {t(label)}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Panel */}
        <div className="flex-1 min-w-0">
          {activeTab === 'profile'       && <ProfileTab />}
          {activeTab === 'security'      && <SecurityTab />}
          {activeTab === 'company'       && <CompanyTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'plan'          && <PlanTab />}
        </div>
      </div>
    </div>
  )
}

// ─── Profile Tab ─────────────────────────────────────────────────────────────

function ProfileTab() {
  const { t } = useTranslation()
  const profile     = useAuthStore((s) => s.profile)
  const setProfile  = useAuthStore((s) => s.setProfile)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileForm>({
    resolver: zodResolver(createProfileSchema(t)),
    defaultValues: {
      full_name: profile?.full_name ?? '',
      phone:     profile?.phone ?? '',
    },
  })

  const onSubmit = async (data: ProfileForm) => {
    if (!profile) return
    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ full_name: data.full_name, phone: data.phone ?? null })
      .eq('id', profile.id)
      .select()
      .single()

    if (error) { toast.error(t('settings.toasts.profile_error')); return }
    if (updated) setProfile(updated)
    toast.success(t('settings.toasts.profile_saved'))
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-base">{t('settings.profile.title')}</CardTitle>
        <CardDescription>{t('settings.profile.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Avatar placeholder */}
        <div className="mb-6 flex items-center gap-4 rounded-[24px] bg-[linear-gradient(135deg,rgba(16,105,91,0.08),rgba(234,191,74,0.08))] p-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cemac-600 to-cemac-800 text-xl font-bold text-white shadow-[0_12px_25px_rgba(16,105,91,0.2)]">
            {profile?.full_name?.slice(0, 2).toUpperCase() ?? 'CI'}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{profile?.full_name}</p>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
            <Badge variant="secondary" className="mt-1 text-xs capitalize">
              {profile?.role?.replace(/_/g, ' ')}
            </Badge>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">{t('auth.full_name')}</Label>
            <Input id="full_name" {...register('full_name')} placeholder={t('auth.full_name_placeholder')} />
            {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email_display">{t('settings.profile.email')}</Label>
            <Input id="email_display" value={profile?.email ?? ''} disabled className="bg-gray-50 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{t('settings.profile.email_locked')}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t('auth.phone')}</Label>
            <Input id="phone" {...register('phone')} placeholder={t('settings.profile.phone_placeholder')} />
          </div>

          <div className="pt-2">
            <Button type="submit" loading={isSubmitting}>
              <Save className="h-4 w-4" />
              {t('settings.profile.save')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// ─── Security Tab ─────────────────────────────────────────────────────────────

function SecurityTab() {
  const { t } = useTranslation()
  const [showCurrent, setShowCurrent]     = useState(false)
  const [showNew, setShowNew]             = useState(false)
  const [showConfirm, setShowConfirm]     = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PasswordForm>({
    resolver: zodResolver(createPasswordSchema(t)),
  })

  const onSubmit = async (data: PasswordForm) => {
    // Re-authenticate then update password
    const profile = useAuthStore.getState().profile
    if (!profile?.email) return

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: data.currentPassword,
    })

    if (signInError) {
      toast.error(t('settings.toasts.current_password_invalid'))
      return
    }

    const { error } = await supabase.auth.updateUser({ password: data.newPassword })
    if (error) { toast.error(t('settings.toasts.password_error')); return }

    toast.success(t('settings.toasts.password_saved'))
    reset()
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('settings.security.title')}</CardTitle>
          <CardDescription>{t('settings.security.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Current password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t('settings.security.current_password')}</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrent ? 'text' : 'password'}
                  className="pr-9"
                  {...register('currentPassword')}
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.currentPassword && <p className="text-xs text-red-500">{errors.currentPassword.message}</p>}
            </div>

            {/* New password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('settings.security.new_password')}</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNew ? 'text' : 'password'}
                  className="pr-9"
                  {...register('newPassword')}
                />
                <button type="button" onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && <p className="text-xs text-red-500">{errors.newPassword.message}</p>}
            </div>

            {/* Confirm password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('settings.security.confirm_password')}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  className="pr-9"
                  {...register('confirmPassword')}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
            </div>

            <div className="pt-2">
              <Button type="submit" loading={isSubmitting}>
                <Lock className="h-4 w-4" />
                {t('settings.security.submit')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Security tips */}
      <Card className="border-blue-100 bg-blue-50">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-800 space-y-1">
              <p className="font-semibold">{t('settings.security.tips_title')}</p>
              <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                <li>{t('settings.security.tip_1')}</li>
                <li>{t('settings.security.tip_2')}</li>
                <li>{t('settings.security.tip_3')}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Company Tab ──────────────────────────────────────────────────────────────

function CompanyTab() {
  const { t } = useTranslation()
  const entreprise    = useAuthStore((s) => s.entreprise)
  const setEntreprise = useAuthStore((s) => s.setEntreprise)
  const profile       = useAuthStore((s) => s.profile)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EntrepriseForm>({
    resolver: zodResolver(createEntrepriseSchema(t)),
    defaultValues: {
      raison_sociale:   entreprise?.raison_sociale ?? '',
      secteur_activite: entreprise?.secteur_activite ?? '',
      adresse:          entreprise?.adresse ?? '',
      ville:            entreprise?.ville ?? '',
      email_contact:    entreprise?.email_contact ?? '',
      telephone:        entreprise?.telephone ?? '',
      site_web:         entreprise?.site_web ?? '',
      description:      entreprise?.description ?? '',
    },
  })

  if (profile?.role !== 'company_admin' || !entreprise) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground text-sm py-12">
          <Building2 className="h-8 w-8 mx-auto mb-3 text-gray-300" />
          <p>{t('settings.company.none')}</p>
        </CardContent>
      </Card>
    )
  }

  const onSubmit = async (data: EntrepriseForm) => {
    const { data: updated, error } = await supabase
      .from('entreprises')
      .update({
        raison_sociale:   data.raison_sociale,
        secteur_activite: data.secteur_activite || null,
        adresse:          data.adresse || null,
        ville:            data.ville || null,
        email_contact:    data.email_contact || null,
        telephone:        data.telephone || null,
        site_web:         data.site_web || null,
        description:      data.description || null,
      })
      .eq('id', entreprise.id)
      .select()
      .single()

    if (error) { toast.error(t('settings.toasts.company_error')); return }
    if (updated) setEntreprise(updated)
    toast.success(t('settings.toasts.company_saved'))
  }

  const countryInfo = CEMAC_COUNTRIES.find((c) => c.code === entreprise.pays)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('settings.company.title')}</CardTitle>
        <CardDescription>
          {countryInfo ? `${countryInfo.flag} ${countryInfo.name}` : entreprise.pays}
          {entreprise.is_verified && (
            <span className="inline-flex items-center gap-1 ml-2 text-green-600 text-xs">
              <CheckCircle2 className="h-3 w-3" /> {t('settings.company.verified')}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Raison sociale */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="raison_sociale">{t('auth.company_name')} *</Label>
              <Input id="raison_sociale" {...register('raison_sociale')} />
              {errors.raison_sociale && <p className="text-xs text-red-500">{errors.raison_sociale.message}</p>}
            </div>

            {/* Secteur */}
            <div className="space-y-2">
              <Label htmlFor="secteur_activite">{t('auth.sector')}</Label>
              <Input id="secteur_activite" {...register('secteur_activite')} placeholder={t('settings.company.sector_placeholder')} />
            </div>

            {/* Téléphone */}
            <div className="space-y-2">
              <Label htmlFor="telephone">{t('auth.phone')}</Label>
              <Input id="telephone" {...register('telephone')} placeholder={t('settings.profile.phone_placeholder')} />
            </div>

            {/* Email contact */}
            <div className="space-y-2">
              <Label htmlFor="email_contact">{t('settings.company.contact_email')}</Label>
              <Input id="email_contact" type="email" {...register('email_contact')} placeholder={t('settings.company.contact_email_placeholder')} />
              {errors.email_contact && <p className="text-xs text-red-500">{errors.email_contact.message}</p>}
            </div>

            {/* Site web */}
            <div className="space-y-2">
              <Label htmlFor="site_web">{t('settings.company.website')}</Label>
              <Input id="site_web" {...register('site_web')} placeholder={t('settings.company.website_placeholder')} />
              {errors.site_web && <p className="text-xs text-red-500">{errors.site_web.message}</p>}
            </div>

            {/* Adresse */}
            <div className="space-y-2">
              <Label htmlFor="adresse">{t('settings.company.address')}</Label>
              <Input id="adresse" {...register('adresse')} placeholder={t('settings.company.address_placeholder')} />
            </div>

            {/* Ville */}
            <div className="space-y-2">
              <Label htmlFor="ville">{t('settings.company.city')}</Label>
              <Input id="ville" {...register('ville')} placeholder={t('settings.company.city_placeholder')} />
            </div>

            {/* Description */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">{t('settings.company.activity_description')}</Label>
              <textarea
                id="description"
                {...register('description')}
                rows={3}
                placeholder={t('settings.company.description_placeholder')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
              {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" loading={isSubmitting}>
              <Save className="h-4 w-4" />
              {t('settings.profile.save')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// ─── Notifications Tab ────────────────────────────────────────────────────────

function NotificationsTab() {
  const { t } = useTranslation()
  const profile = useAuthStore((s) => s.profile)
  const [prefs, setPrefs] = useState<typeof DEFAULT_NOTIFS>(DEFAULT_NOTIFS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!profile) return
    const raw = profile.notification_preferences
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      setPrefs({ ...DEFAULT_NOTIFS, ...(raw as Partial<typeof DEFAULT_NOTIFS>) })
    }
    setLoading(false)
  }, [profile])

  const toggle = (key: keyof typeof DEFAULT_NOTIFS) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }))
  }

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ notification_preferences: prefs, updated_at: new Date().toISOString() })
      .eq('id', profile.id)
    setSaving(false)
    if (error) {
      toast.error(t('settings.toasts.notifications_error'))
    } else {
      toast.success(t('settings.toasts.notifications_saved'))
    }
  }

  const notifItems: { key: keyof typeof DEFAULT_NOTIFS; label: string; desc: string }[] = [
    { key: 'cert_status_change',  label: t('settings.notifications.items.cert_status_change.label'),  desc: t('settings.notifications.items.cert_status_change.description') },
    { key: 'new_document',        label: t('settings.notifications.items.new_document.label'),        desc: t('settings.notifications.items.new_document.description') },
    { key: 'marketplace_inquiry', label: t('settings.notifications.items.marketplace_inquiry.label'), desc: t('settings.notifications.items.marketplace_inquiry.description') },
    { key: 'price_alert',         label: t('settings.notifications.items.price_alert.label'),         desc: t('settings.notifications.items.price_alert.description') },
    { key: 'newsletter',          label: t('settings.notifications.items.newsletter.label'),          desc: t('settings.notifications.items.newsletter.description') },
    { key: 'security_alert',      label: t('settings.notifications.items.security_alert.label'),      desc: t('settings.notifications.items.security_alert.description') },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('settings.notifications.title')}</CardTitle>
        <CardDescription>{t('settings.notifications.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">{t('common.loading')}</div>
        ) : (
          <>
            {notifItems.map(({ key, label, desc }) => (
              <div
                key={key}
                className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
              >
                <div className="space-y-0.5 pr-4">
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                {/* Toggle switch */}
                <button
                  type="button"
                  aria-label={label}
                  onClick={() => toggle(key)}
                  className={cn(
                    'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none',
                    prefs[key] ? 'bg-cemac-700' : 'bg-gray-200'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                      prefs[key] ? 'translate-x-4' : 'translate-x-0.5'
                    )}
                  />
                </button>
              </div>
            ))}
            <div className="pt-4">
              <Button onClick={handleSave} loading={saving}>
                <Save className="h-4 w-4" />
                {t('settings.notifications.save')}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Plan Tab ───────────────────────────────────────────────────────────────────────────────
function PlanTab() {
  const { t, i18n } = useTranslation()
  const entreprise = useAuthStore((s) => s.entreprise)
  const currentPlan = entreprise?.subscription_plan ?? 'free'
  const locale = (i18n.resolvedLanguage ?? i18n.language).toLowerCase().startsWith('en') ? 'en' : 'fr'
  const pricing = usePricing(locale)
  const currentPlanInfo = findPricingPlan(pricing.data.plans, currentPlan)
  const upgradePlans = getUpgradePlans(pricing.data.plans)

  if (pricing.loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Chargement des offres…
        </CardContent>
      </Card>
    )
  }

  if (pricing.error) {
    return (
      <Card className="border-red-200 bg-red-50/40">
        <CardContent role="alert" className="py-10 text-center">
          <p className="font-semibold text-red-800">Impossible de charger les offres.</p>
          <p className="mt-1 text-xs text-red-700">{pricing.error.message}</p>
          <Button type="button" variant="outline" className="mt-4" onClick={() => void pricing.refetch()}>
            Réessayer
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!currentPlanInfo) {
    return (
      <Card className="border-amber-200 bg-amber-50/40">
        <CardContent role="alert" className="py-10 text-center text-sm text-amber-800">
          Les informations de votre abonnement ne sont pas publiées.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Current plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('settings.plan.current_plan')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className={cn(
                'px-3 py-1 rounded-full text-sm font-semibold',
                PLAN_BADGE_COLORS[currentPlan] ?? PLAN_BADGE_COLORS.free,
              )}>
                {currentPlanInfo.name}
              </span>
            </div>
            {currentPlan !== 'institutional' && (
              <a href="/tarifs" className="text-sm text-cemac-700 hover:underline font-medium">
                {t('settings.plan.view_offers')} →
              </a>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">{t('settings.plan.included_features')}</p>
            <ul className="space-y-1.5">
              {currentPlanInfo.features.filter((feature) => feature.included).map((feature) => (
                <li key={feature.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  {feature.label}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade section — only for free plan */}
      {currentPlan === 'free' && (
        <>
          {/* Offers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {upgradePlans.map((plan) => (
              <Card key={plan.id} className="relative border-cemac-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{plan.label}</CardTitle>
                    <Shield className="h-4 w-4 text-cemac-600" />
                  </div>
                  <CardDescription className="text-xs">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-lg font-bold text-cemac-800">{plan.price}</p>
                  <ul className="space-y-1">
                    {plan.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2 text-xs text-gray-600">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Payment availability */}
          <Card className="border-amber-200 bg-amber-50/40">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-cemac-600" />
                Souscription aux plans payants
              </CardTitle>
              <CardDescription className="text-xs">
                Le paiement en libre-service n’est pas encore activé. Aucun numéro ni code marchand n’est publié dans l’application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a href="/contact?reason=abonnement" className="text-sm font-medium text-cemac-700 hover:underline">
                Contacter l’équipe commerciale →
              </a>
            </CardContent>
          </Card>

          {/* Contact CTA */}
          <Card className="border-cemac-200 bg-cemac-50/40">
            <CardContent className="pt-4 pb-4">
              <div className="flex gap-3 items-start">
                <AlertCircle className="h-5 w-5 text-cemac-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-cemac-800 mb-1">Besoin d’aide pour souscrire ?</p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Contactez notre équipe commerciale pour obtenir les modalités de souscription disponibles.
                  </p>
                  <a
                    href="/contact"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-cemac-700 hover:underline font-medium"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Contacter l’équipe CEMAC INTEGRA
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Already on paid plan */}
      {currentPlan !== 'free' && currentPlan !== 'institutional' && (
        <Card>
          <CardContent className="pt-4 pb-4 text-sm text-gray-600 flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-cemac-600 shrink-0" />
            <div>
              <p className="font-medium text-gray-800">{t('settings.plan.manage_subscription')}</p>
              <p className="text-xs mt-0.5">
                {t('settings.plan.manage_description')}
              </p>
              <a
                href="/contact"
                className="mt-2 inline-flex items-center gap-1 text-xs text-cemac-700 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Contacter le support
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
