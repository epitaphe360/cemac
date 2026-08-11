import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Mail, Lock, User, Phone, Building2, Globe, Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CEMAC_COUNTRIES } from '@/lib/constants'

const schema = z.object({
  email:           z.string().email('Email invalide'),
  password:        z.string().min(8, 'Minimum 8 caractères'),
  full_name:       z.string().min(2, 'Nom requis'),
  phone:           z.string().optional(),
  country:         z.string().min(2, 'Pays requis'),
  raison_sociale:  z.string().min(2, 'Raison sociale requise'),
  secteur_activite: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const initialize = useAuthStore((s) => s.initialize)
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)

  const form = useForm<FormData>({ resolver: zodResolver(schema) })
  const { register, handleSubmit, formState: { errors, isSubmitting }, trigger, getValues } = form

  const nextStep = async () => {
    const valid = await trigger(['email', 'password', 'full_name', 'phone', 'country'])
    if (valid) setStep(2)
  }

  const onSubmit = async (data: FormData) => {
    // 1. Créer le compte Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          role: 'company_admin',
        },
      },
    })

    if (authError) {
      toast.error(authError.message)
      return
    }

    if (!authData.user) {
      toast.error(t('auth.signup_failed'))
      return
    }

    // 2. Créer l'entreprise
    const { error: entError } = await supabase.from('entreprises').insert({
      owner_id: authData.user.id,
      raison_sociale: data.raison_sociale,
      pays: data.country,
      secteur_activite: data.secteur_activite,
      email_contact: data.email,
      telephone: data.phone,
    })

    if (entError) {
      toast.error(t('auth.company_create_partial_error'))
      console.error(entError)
    }

    // 3. Initialiser le store
    await initialize()
    toast.success(t('auth.signup_success'))
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(20,129,110,0.16),transparent_24%),radial-gradient(circle_at_top_right,rgba(243,190,43,0.18),transparent_22%),linear-gradient(180deg,#f4fbf8_0%,#ffffff_48%,#f7f5ee_100%)] px-4 py-8">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="hero-chip mb-4">{t('auth.company_onboarding_badge')}</div>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-cemac-600 to-cemac-800 text-white text-2xl font-bold mb-4 shadow-[0_18px_38px_rgba(16,105,91,0.25)]">
            CI
          </div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">CEMAC INTEGRA</h1>
          <p className="text-sm text-gray-500 mt-2">{t('auth.create_company_account')}</p>
        </div>

        {/* Step indicators */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className={`h-2.5 w-20 rounded-full transition-colors ${step >= 1 ? 'bg-gradient-to-r from-cemac-500 to-cemac-700' : 'bg-gray-200'}`} />
          <div className={`h-2.5 w-20 rounded-full transition-colors ${step >= 2 ? 'bg-gradient-to-r from-cemac-500 to-gold-500' : 'bg-gray-200'}`} />
        </div>

        <Card className="border-white/80 bg-white/88 shadow-[0_24px_80px_rgba(10,45,39,0.12)]">
          <CardHeader>
            <CardTitle className="text-xl text-center">
              {step === 1 ? t('auth.your_information') : t('auth.your_company')}
            </CardTitle>
            <CardDescription className="text-center">
              {step === 1 ? t('auth.personal_step') : t('auth.company_step')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="full_name">{t('auth.full_name')} *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="full_name" placeholder={t('auth.full_name_placeholder')} className="pl-9" {...register('full_name')} />
                    </div>
                    {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t('auth.email')} *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="email" type="email" placeholder={t('auth.email_placeholder')} className="pl-9" {...register('email')} />
                    </div>
                    {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">{t('auth.password')} *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('auth.password_placeholder')}
                        className="pl-9 pr-9"
                        {...register('password')}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="country">{t('auth.country')} *</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <select
                          id="country"
                          className="flex h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cemac-600"
                          {...register('country')}
                        >
                          <option value="">{t('common.select')}</option>
                          {CEMAC_COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.flag} {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors.country && <p className="text-xs text-red-500">{errors.country.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('auth.phone')}</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="phone" placeholder={t('auth.phone_placeholder')} className="pl-9" {...register('phone')} />
                      </div>
                    </div>
                  </div>

                  <Button type="button" className="w-full" onClick={nextStep}>
                    {t('common.next')} →
                  </Button>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="raison_sociale">{t('auth.company_name')} *</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="raison_sociale" placeholder={t('auth.company_name_placeholder')} className="pl-9" {...register('raison_sociale')} />
                    </div>
                    {errors.raison_sociale && <p className="text-xs text-red-500">{errors.raison_sociale.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secteur_activite">{t('auth.sector')}</Label>
                    <select
                      id="secteur_activite"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cemac-600"
                      {...register('secteur_activite')}
                    >
                      <option value="">{t('auth.select_sector')}</option>
                      <option value="agriculture">{t('auth.sectors.agriculture')}</option>
                      <option value="industrie">{t('auth.sectors.industry')}</option>
                      <option value="mines">{t('auth.sectors.mining')}</option>
                      <option value="tech">{t('auth.sectors.tech')}</option>
                      <option value="textile">{t('auth.sectors.textile')}</option>
                      <option value="pharmaceutique">{t('auth.sectors.pharma')}</option>
                      <option value="btp">{t('auth.sectors.construction')}</option>
                      <option value="services">{t('auth.sectors.services')}</option>
                      <option value="autre">{t('auth.sectors.other')}</option>
                    </select>
                  </div>

                  <div className="text-sm text-muted-foreground bg-cemac-50 rounded-lg p-3 border border-cemac-100">
                    <p className="font-medium text-cemac-800 mb-1">{t('auth.account_created_for')}</p>
                    <p className="text-cemac-700">{getValues('email')}</p>
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                      ← {t('common.back')}
                    </Button>
                    <Button type="submit" loading={isSubmitting} className="flex-1">
                      {isSubmitting ? t('auth.creating_account') : t('auth.create_account_submit')}
                    </Button>
                  </div>
                </>
              )}
            </form>

            {step === 1 && (
              <div className="mt-4 text-center text-sm text-muted-foreground">
                {t('auth.have_account')}{' '}
                <Link to="/auth/login" className="text-cemac-700 font-medium hover:underline">
                  {t('auth.login_cta')}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          {t('auth.accept_terms')}
        </p>
      </div>
    </div>
  )
}
