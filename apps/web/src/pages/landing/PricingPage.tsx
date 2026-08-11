import { Link } from 'react-router-dom'
import { CheckCircle2, X, Zap, ArrowRight, HelpCircle } from 'lucide-react'
import { useState } from 'react'
import { PUBLIC_PRICING_PLANS } from '@/lib/pricing'

const plans = [
  {
    ...PUBLIC_PRICING_PLANS[0],
    price: { monthly: PUBLIC_PRICING_PLANS[0].monthlyPrice, yearly: PUBLIC_PRICING_PLANS[0].yearlyPrice },
    color: 'border-gray-200',
    headerBg: 'bg-gray-50',
    cta: { label: 'Commencer gratuitement', href: '/auth/register', style: 'border border-cemac-600 text-cemac-700 hover:bg-cemac-50' },
  },
  {
    ...PUBLIC_PRICING_PLANS[1],
    price: { monthly: PUBLIC_PRICING_PLANS[1].monthlyPrice, yearly: PUBLIC_PRICING_PLANS[1].yearlyPrice },
    color: 'border-cemac-500 ring-2 ring-cemac-500',
    headerBg: 'bg-gradient-to-r from-cemac-700 to-cemac-800',
    cta: { label: 'Commencer en Pro', href: '/auth/register?plan=sme', style: 'bg-cemac-700 hover:bg-cemac-800 text-white' },
  },
  {
    ...PUBLIC_PRICING_PLANS[2],
    price: { monthly: PUBLIC_PRICING_PLANS[2].monthlyPrice, yearly: PUBLIC_PRICING_PLANS[2].yearlyPrice },
    color: 'border-gray-200',
    headerBg: 'bg-gradient-to-r from-cemac-950 to-cemac-900',
    cta: { label: 'Contacter les ventes', href: '/contact', style: 'bg-gray-900 hover:bg-black text-white' },
  },
]

const faqs = [
  {
    q: 'Puis-je changer de plan à tout moment ?',
    a: 'Oui, vous pouvez passer à un plan supérieur ou inférieur à tout moment depuis les paramètres de votre compte. Le changement prend effet immédiatement.',
  },
  {
    q: 'Comment se passe le paiement ?',
    a: 'Le paiement des abonnements se fait par Mobile Money (MTN MoMo, Orange Money) ou virement bancaire. La facturation peut être mensuelle ou annuelle selon l\'offre choisie. Une facture officielle vous est envoyée automatiquement par email après confirmation du paiement.',
  },
  {
    q: 'Y a-t-il une période d\'essai pour les plans payants ?',
    a: 'Non, il n y a pas de période d essai automatique active pour le moment. L activation se fait après souscription.',
  },
  {
    q: 'Les certifications émises sont-elles reconnues officiellement ?',
    a: 'Oui, CEMAC INTEGRA est partenaire des chambres de commerce CEMAC. Les certifications émises via la plateforme ont la même valeur légale que les certifications papier traditionnelles.',
  },
  {
    q: 'Que se passe-t-il à l\'expiration de mon abonnement ?',
    a: 'Vos données et certifications restent accessibles. Vous passez automatiquement au plan Starter (2 certifications/mois). Aucune donnée n\'est supprimée.',
  },
]

export function PricingPage() {
  const [yearly, setYearly] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const fmt = (n: number) =>
    n === 0 ? 'Gratuit' : n.toLocaleString('fr-FR') + ' FCFA'

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
            Pas de frais caches. Annulez a tout moment. Paiement en ligne securise par carte bancaire.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 bg-white/10 rounded-full p-1">
            <button
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                !yearly ? 'bg-white text-cemac-900 shadow' : 'text-cemac-300 hover:text-white'
              }`}
              onClick={() => setYearly(false)}
            >
              Mensuel
            </button>
            <button
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                yearly ? 'bg-white text-cemac-900 shadow' : 'text-cemac-300 hover:text-white'
              }`}
              onClick={() => setYearly(true)}
            >
              Annuel
              <span className="ml-2 px-2 py-0.5 bg-gold-500 text-white text-xs rounded-full">
                -20 %
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-16 bg-transparent">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6 -mt-8">
            {plans.map((plan) => {
              const price = yearly ? plan.price.yearly : plan.price.monthly
              const period = yearly ? '/ an' : '/ mois'

              return (
                <div
                  key={plan.id}
                  className={`relative bg-white/92 backdrop-blur-sm rounded-3xl overflow-hidden border-2 ${plan.color} shadow-[0_18px_45px_rgba(10,45,39,0.1)] flex flex-col transition-transform duration-300 hover:-translate-y-1`}
                >
                  {plan.badge && (
                    <div className="absolute top-4 right-4 px-3 py-1 bg-gold-500 text-white text-xs font-bold rounded-full shadow">
                      {plan.badge}
                    </div>
                  )}

                  {/* Header */}
                  <div className={`${plan.headerBg} p-6`}>
                    <h3 className={`text-xl font-black mb-1 ${plan.id === 'free' ? 'text-gray-900' : 'text-white'}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-sm mb-4 ${plan.id === 'free' ? 'text-gray-500' : 'text-white/70'}`}>
                      Pas de frais cachés. Annulez à tout moment. Paiement en ligne sécurisé par carte bancaire.
                    </p>
                    <div className={plan.id === 'free' ? 'text-gray-900' : 'text-white'}>
                      <span className="text-4xl font-black">{fmt(price)}</span>
                      {price > 0 && <span className={`text-sm ml-1 ${plan.id === 'free' ? 'text-gray-400' : 'text-white/60'}`}>{period}</span>}
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
                    <Link
                      to={plan.cta.href}
                      className={`w-full py-3.5 px-6 rounded-xl font-bold text-center transition-all flex items-center justify-center gap-2 ${plan.cta.style}`}
                    >
                      {plan.cta.label}
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Institution/Gov plan */}
          <div className="mt-8 bg-gradient-to-r from-cemac-900 via-cemac-800 to-cemac-950 rounded-3xl p-8 text-white flex flex-col lg:flex-row items-center gap-6 justify-between shadow-[0_18px_45px_rgba(10,45,39,0.22)]">
            <div>
              <h3 className="text-xl font-black mb-2">Plan institutionnel & réseaux consulaires</h3>
              <p className="text-cemac-300 text-sm max-w-lg">
                Pour les organisations d'appui au commerce, chambres consulaires et structures régionales.
                Déploiement dédié, gouvernance sur mesure et accompagnement au changement.
              </p>
            </div>
            <Link
              to="/contact"
              className="flex-shrink-0 px-8 py-3.5 bg-gold-500 hover:bg-gold-600 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg"
            >
              Nous contacter <ArrowRight size={16} />
            </Link>
          </div>
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
            {faqs.map((faq, i) => (
              <div key={i} className="border border-white rounded-2xl overflow-hidden bg-white/90 shadow-sm">
                <button
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-gray-900">{faq.q}</span>
                  <span className={`text-cemac-600 font-bold text-xl transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-100">
                    {faq.a}
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
