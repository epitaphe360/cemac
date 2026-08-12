import { Link } from 'react-router-dom'
import { CheckCircle2, X, Zap, ArrowRight, HelpCircle } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePricing } from '@/hooks/use-cms'
import { formatPlanPrice } from '@/lib/pricing'
import { paymentsEnabled } from '@/lib/payments'

const PLAN_STYLES: Record<string, { color: string; headerBg: string; cta: string }> = {
  free: {
    color: 'border-gray-200',
    headerBg: 'bg-gray-50',
    cta: 'border border-cemac-600 text-cemac-700 hover:bg-cemac-50',
  },
  sme: {
    color: 'border-cemac-500 ring-2 ring-cemac-500',
    headerBg: 'bg-gradient-to-r from-cemac-700 to-cemac-800',
    cta: 'bg-cemac-700 hover:bg-cemac-800 text-white',
  },
  enterprise: {
    color: 'border-gray-200',
    headerBg: 'bg-gradient-to-r from-cemac-950 to-cemac-900',
    cta: 'bg-gray-900 hover:bg-black text-white',
  },
}

export function PricingPage() {
  const [yearly, setYearly] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const { i18n } = useTranslation()
  const locale = (i18n.resolvedLanguage ?? i18n.language).toLowerCase().startsWith('en') ? 'en' : 'fr'
  const { data, loading, error, refetch } = usePricing(locale)
  const plans = data.plans.filter((plan) => plan.id !== 'institutional')
  const institutionalPlan = data.plans.find((plan) => plan.id === 'institutional')

  return (
    <div className="pt-20">

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-cemac-950 via-cemac-900 to-[#102d2b] py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,212,92,0.14),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(33,161,140,0.16),transparent_24%)]" />
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="relative inline-flex items-center gap-2 px-4 py-2 bg-gold-500/20 border border-gold-500/30 rounded-full text-gold-300 text-sm font-medium mb-8 backdrop-blur-sm">
            <Zap size={14} /> Tarification transparente
          </span>
          <h1 className="relative text-4xl lg:text-6xl font-black text-white mb-6">
            Choisissez votre{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 to-gold-500">
              plan
            </span>
          </h1>
          <p className="relative text-cemac-200 text-lg mb-10">
            {paymentsEnabled
              ? 'Tarifs en XAF. Créez votre compte puis souscrivez en ligne de façon sécurisée.'
              : 'Tarifs en XAF. La souscription aux plans payants est actuellement traitée avec notre équipe commerciale.'}
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 bg-white/10 rounded-full p-1">
            <button
              type="button"
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                !yearly ? 'bg-white text-cemac-900 shadow' : 'text-cemac-300 hover:text-white'
              }`}
              onClick={() => setYearly(false)}
            >
              Mensuel
            </button>
            <button
              type="button"
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                yearly ? 'bg-white text-cemac-900 shadow' : 'text-cemac-300 hover:text-white'
              }`}
              onClick={() => setYearly(true)}
            >
              <span>Annuel</span>
              <span className="ml-2 px-2 py-0.5 bg-gold-800 text-white text-xs rounded-full">
                Tarif annuel
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-16 bg-transparent">
        <div className="max-w-6xl mx-auto px-6">
          {loading && (
            <div className="rounded-2xl border border-cemac-100 bg-white p-10 text-center text-sm text-gray-600">
              Chargement des tarifs…
            </div>
          )}
          {!loading && error && (
            <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
              <p className="font-semibold text-red-800">Impossible de charger les tarifs.</p>
              <p className="mt-1 text-sm text-red-700">{error.message}</p>
              <button type="button" onClick={() => void refetch()} className="mt-4 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white">
                Réessayer
              </button>
            </div>
          )}
          {!loading && !error && plans.length === 0 && (
            <output className="block rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-800">
              Aucun tarif n’est actuellement publié.
            </output>
          )}
          {!loading && !error && plans.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6 -mt-8">
            {plans.map((plan) => {
              const price = yearly ? plan.yearlyPrice : plan.monthlyPrice
              const period = yearly ? '/ an' : '/ mois'
              const style = PLAN_STYLES[plan.id] ?? PLAN_STYLES.enterprise
              const isPaidSelfServicePlan = plan.id === 'sme' || plan.id === 'enterprise'
              const ctaHref = isPaidSelfServicePlan
                ? (paymentsEnabled
                    ? `/auth/register?plan=${plan.id}&period=${yearly ? 'yearly' : 'monthly'}`
                    : '/contact?reason=abonnement')
                : plan.cta.href
              const ctaLabel = isPaidSelfServicePlan
                ? (paymentsEnabled ? 'Créer un compte et souscrire' : 'Contacter l’équipe commerciale')
                : plan.cta.label

              return (
                <div
                  key={plan.id}
                  className={`relative bg-white/92 backdrop-blur-sm rounded-3xl overflow-hidden border-2 ${style.color} shadow-[0_18px_45px_rgba(10,45,39,0.1)] flex flex-col transition-transform duration-300 hover:-translate-y-1`}
                >
                  {plan.badge && (
                    <div className="absolute top-4 right-4 px-3 py-1 bg-gold-800 text-white text-xs font-bold rounded-full shadow">
                      {plan.badge}
                    </div>
                  )}

                  {/* Header */}
                  <div className={`${style.headerBg} p-6`}>
                    <h3 className={`text-xl font-black mb-1 ${plan.id === 'free' ? 'text-gray-900' : 'text-white'}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-sm mb-4 ${plan.id === 'free' ? 'text-gray-500' : 'text-white/70'}`}>
                      {plan.description}
                    </p>
                    <div className={plan.id === 'free' ? 'text-gray-900' : 'text-white'}>
                      <span className="text-4xl font-black">{formatPlanPrice(price, yearly ? 'yearly' : 'monthly', plan.currency).replace(` / ${yearly ? 'an' : 'mois'}`, '')}</span>
                      {price !== null && price > 0 && <span className={`text-sm ml-1 ${plan.id === 'free' ? 'text-gray-400' : 'text-white/60'}`}>{period}</span>}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="p-6 flex flex-col flex-1">
                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((f) => (
                        <li key={f.label} className="flex items-center gap-2.5">
                          {f.included
                            ? <CheckCircle2 size={16} className="text-cemac-500 flex-shrink-0" />
                            : <X size={16} className="text-gray-300 flex-shrink-0" />}
                          <span className={`text-sm ${f.included ? 'text-gray-700' : 'text-gray-400'}`}>
                            {f.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {ctaHref && ctaLabel ? (
                      <Link
                        to={ctaHref}
                        className={`w-full py-3.5 px-6 rounded-xl font-bold text-center transition-all flex items-center justify-center gap-2 ${style.cta}`}
                      >
                        {ctaLabel}
                        <ArrowRight size={16} />
                      </Link>
                    ) : (
                      <p className="text-center text-sm text-amber-700">Souscription temporairement indisponible.</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          )}

          {/* Institution/Gov plan */}
          {!loading && !error && institutionalPlan && (
          <div className="mt-8 bg-gradient-to-r from-cemac-900 via-cemac-800 to-cemac-950 rounded-3xl p-8 text-white flex flex-col lg:flex-row items-center gap-6 justify-between shadow-[0_18px_45px_rgba(10,45,39,0.22)]">
            <div>
              <h3 className="text-xl font-black mb-2">{institutionalPlan.name}</h3>
              <p className="text-cemac-300 text-sm max-w-lg">
                {institutionalPlan.description}
              </p>
            </div>
            {institutionalPlan.cta.href && institutionalPlan.cta.label && <Link
              to={institutionalPlan.cta.href}
              className="flex-shrink-0 px-8 py-3.5 bg-gold-800 hover:bg-gold-900 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg"
            >
              {institutionalPlan.cta.label} <ArrowRight size={16} />
            </Link>}
          </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white/70 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex w-12 h-12 bg-cemac-100 rounded-xl items-center justify-center mb-4">
              <HelpCircle size={24} className="text-cemac-700" />
            </div>
            <h2 className="text-3xl font-black text-gray-900">Questions fréquentes</h2>
          </div>
          <div className="space-y-3">
            {!loading && !error && data.faqs.map((faq, i) => (
              <div key={faq.id} className="border border-white rounded-2xl overflow-hidden bg-white/90 shadow-sm">
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  <span className={`text-cemac-600 font-bold text-xl transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-100">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
