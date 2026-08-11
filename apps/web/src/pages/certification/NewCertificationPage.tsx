import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CEMAC_COUNTRIES } from '@/lib/constants'
import type { CertificationFormData } from '@/types'

const schema = z.object({
  produit_nom:           z.string().min(2, 'certification.create.error_name'),
  produit_description:   z.string().optional(),
  type_certification:    z.string().min(1, 'certification.create.error_type'),
  pays_production:       z.string().min(2, 'certification.create.error_country'),
  valeur_ajoutee_locale: z.coerce.number().min(0).max(100).optional(),
})

type FormData = z.infer<typeof schema>

const STEPS = ['certification.create.steps.product', 'certification.create.steps.type', 'certification.create.steps.confirm']

export function NewCertificationPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const entreprise = useAuthStore((s) => s.entreprise)
  const profile = useAuthStore((s) => s.profile)
  const [step, setStep] = useState(0)

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, getValues } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type_certification: 'made_in_cemac', pays_production: entreprise?.pays ?? '' },
  })

  const onSubmit = async (data: CertificationFormData) => {
    if (!entreprise) { toast.error(t('certification.create.toasts.no_company')); return }

    const { data: cert, error } = await supabase
      .from('certifications')
      .insert({
        entreprise_id: entreprise.id,
        produit_nom: data.produit_nom,
        produit_description: data.produit_description,
        type_certification: data.type_certification,
        pays_production: data.pays_production,
        valeur_ajoutee_locale: data.valeur_ajoutee_locale,
        statut: 'draft',
      })
      .select()
      .single()

    if (error) { toast.error(t('certification.create.toasts.create_error')); return }

    // Log initial workflow event
    if (profile && cert) {
      await supabase.from('workflow_events').insert({
        certification_id: cert.id,
        statut_precedent: null,
        statut_nouveau: 'draft',
        commentaire: 'Dossier créé',
        created_by: profile.id,
      })
    }

    toast.success(t('certification.create.toasts.created'))
    navigate(`/certifications/${cert.id}`)
  }

  const nextStep = () => setStep((s) => Math.min(s + 1, STEPS.length - 1))
  const prevStep = () => setStep((s) => Math.max(s - 1, 0))

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* En-tête */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t('certification.create.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('certification.create.subtitle')}</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-semibold transition-colors ${
              i < step ? 'bg-cemac-700 border-cemac-700 text-white' :
              i === step ? 'border-cemac-700 text-cemac-700' :
              'border-gray-200 text-gray-400'
            }`}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${i <= step ? 'text-gray-900' : 'text-gray-400'}`}>
              {t(label)}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 transition-colors ${i < step ? 'bg-cemac-700' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Étape 0 — Produit */}
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('certification.create.step0.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="produit_nom">{t('certification.create.step0.name_label')} *</Label>
                <Input id="produit_nom" placeholder={t('certification.create.step0.name_placeholder')} {...register('produit_nom')} />
                {errors.produit_nom && <p className="text-xs text-red-500">{t(errors.produit_nom.message!)}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="produit_description">{t('certification.create.step0.desc_label')}</Label>
                <textarea
                  id="produit_description"
                  placeholder={t('certification.create.step0.desc_placeholder')}
                  rows={4}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cemac-600 resize-none"
                  {...register('produit_description')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pays_production">{t('certification.create.step0.country_label')} *</Label>
                <select
                  id="pays_production"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-cemac-600"
                  {...register('pays_production')}
                >
                  <option value="">{t('certification.create.step0.country_placeholder')}</option>
                  {CEMAC_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                  ))}
                </select>
                {errors.pays_production && <p className="text-xs text-red-500">{t(errors.pays_production.message!)}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="valeur_ajoutee_locale">{t('certification.create.step0.value_label')}</Label>
                <Input
                  id="valeur_ajoutee_locale"
                  type="number"
                  min={0}
                  max={100}
                  placeholder={t('certification.create.step0.value_placeholder')}
                  {...register('valeur_ajoutee_locale')}
                />
                <p className="text-xs text-muted-foreground">{t('certification.create.step0.value_hint')}</p>
              </div>

              <Button type="button" className="w-full" onClick={nextStep}>
                {t('certification.create.step0.btn_next')} <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Étape 1 — Type de certification */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('certification.create.step1.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  value: 'made_in_cemac',
                  label: t('certification.create.step1.made_in_cemac_label'),
                  description: t('certification.create.step1.made_in_cemac_desc'),
                  badge: t('certification.create.step1.recommended'),
                },
                {
                  value: 'origine_cemac',
                  label: t('certification.create.step1.origine_cemac_label'),
                  description: t('certification.create.step1.origine_cemac_desc'),
                  badge: null,
                },
                {
                  value: 'qualite_plus',
                  label: t('certification.create.step1.qualite_plus_label'),
                  description: t('certification.create.step1.qualite_plus_desc'),
                  badge: null,
                },
              ].map(({ value, label, description, badge }) => (
                <label key={value} className="flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors hover:border-cemac-300"
                  style={{ borderColor: watch('type_certification') === value ? '#15803d' : '' }}>
                  <input type="radio" value={value} {...register('type_certification')} className="mt-1" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{label}</span>
                      {badge && <span className="text-xs bg-gold-100 text-gold-700 px-2 py-0.5 rounded-full">{badge}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{description}</p>
                  </div>
                </label>
              ))}
              {errors.type_certification && <p className="text-xs text-red-500">{t(errors.type_certification.message!)}</p>}

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                  <ArrowLeft className="h-4 w-4" /> {t('certification.create.step1.btn_back')}
                </Button>
                <Button type="button" onClick={nextStep} className="flex-1">
                  {t('certification.create.step1.btn_next')} <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Étape 2 — Confirmation */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('certification.create.step2.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-gray-50 p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('certification.create.step2.label_product')}</span>
                  <span className="font-medium">{getValues('produit_nom')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('certification.create.step2.label_type')}</span>
                  <span className="font-medium capitalize">{getValues('type_certification').replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('certification.create.step2.label_country')}</span>
                  <span className="font-medium">{getValues('pays_production')}</span>
                </div>
                {getValues('valeur_ajoutee_locale') && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('certification.create.step2.label_value')}</span>
                    <span className="font-medium">{getValues('valeur_ajoutee_locale')}%</span>
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-cemac-50 p-4 border border-cemac-200">
                <p className="text-sm text-cemac-800">
                  {t('certification.create.step2.draft_notice')}
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                  <ArrowLeft className="h-4 w-4" /> {t('certification.create.step2.btn_back')}
                </Button>
                <Button type="submit" loading={isSubmitting} className="flex-1">
                  {isSubmitting ? t('certification.create.step2.btn_creating') : t('certification.create.step2.btn_submit')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  )
}
