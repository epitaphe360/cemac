import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Play,
  Fingerprint,
  CreditCard,
  Database,
  ShieldCheck,
  Building2,
  Users,
  TrendingUp,
  Globe2,
  Network,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getPrimaryLanguage } from '@/lib/i18n-utils'
import { CEMAC_FLAG_COMPONENTS, type CemacFlagCode } from '@/components/landing/CemacFlags'

const ACCENT = '#3DDC97'
const BG = '#050f0a'

const COUNTRIES: Array<{
  code: CemacFlagCode
  name: { fr: string; en: string }
  capital: { fr: string; en: string }
  population: string
  accents: string[]
  path: string
}> = [
  {
    code: 'CM',
    name: { fr: 'Cameroun', en: 'Cameroon' },
    capital: { fr: 'Yaoundé', en: 'Yaoundé' },
    population: '28,3 M',
    accents: ['#007A5E', '#CE1126', '#FCD116'],
    path: 'M42 18c6-8 18-10 28-4 8 5 14 16 12 28-2 10-10 18-22 20-14 2-28-6-32-18-3-10 4-18 14-26z',
  },
  {
    code: 'CG',
    name: { fr: 'Congo', en: 'Congo' },
    capital: { fr: 'Brazzaville', en: 'Brazzaville' },
    population: '5,8 M',
    accents: ['#009543', '#FBDE4A', '#DC241F'],
    path: 'M38 22c8-10 22-12 32-4 7 6 10 18 6 28-4 10-16 16-28 14-12-2-20-12-18-24 1-6 4-10 8-14z',
  },
  {
    code: 'GA',
    name: { fr: 'Gabon', en: 'Gabon' },
    capital: { fr: 'Libreville', en: 'Libreville' },
    population: '2,4 M',
    accents: ['#009E60', '#FCD116', '#3A75C4'],
    path: 'M40 28c6-12 20-16 30-8 8 6 10 18 4 28-6 10-18 14-28 10-10-4-14-16-6-30z',
  },
  {
    code: 'GQ',
    name: { fr: 'Guinée équatoriale', en: 'Equatorial Guinea' },
    capital: { fr: 'Malabo', en: 'Malabo' },
    population: '1,7 M',
    accents: ['#3E9A00', '#FFFFFF', '#E32118'],
    path: 'M44 24c8-8 20-10 28-2 6 6 8 16 2 24-6 8-18 12-28 8-8-4-12-14-2-30z',
  },
  {
    code: 'CF',
    name: { fr: 'République centrafricaine', en: 'Central African Republic' },
    capital: { fr: 'Bangui', en: 'Bangui' },
    population: '5,5 M',
    accents: ['#003082', '#FFFFFF', '#289728', '#FFCE00', '#D21034'],
    path: 'M36 20c10-10 26-10 36 0 8 8 8 22 0 30-10 10-26 10-36 0-8-8-8-22 0-30z',
  },
  {
    code: 'TD',
    name: { fr: 'Tchad', en: 'Chad' },
    capital: { fr: "N'Djamena", en: "N'Djamena" },
    population: '17,7 M',
    accents: ['#002664', '#FECB00', '#C60C30'],
    path: 'M46 16c8-6 20-4 28 6 6 8 6 20-2 28-8 8-22 10-32 4-10-6-12-18-4-28 2-4 6-8 10-10z',
  },
]

const INFRA = [
  {
    icon: Fingerprint,
    title: { fr: 'Identité numérique', en: 'Digital identity' },
    desc: {
      fr: 'Une identité économique unifiée pour les entreprises et les institutions de la zone CEMAC.',
      en: 'A unified economic identity for companies and institutions across the CEMAC zone.',
    },
  },
  {
    icon: CreditCard,
    title: { fr: 'Paiements interopérables', en: 'Interoperable payments' },
    desc: {
      fr: 'Des flux financiers sécurisés et traçables entre les six économies nationales.',
      en: 'Secure, traceable financial flows across the six national economies.',
    },
  },
  {
    icon: Database,
    title: { fr: 'Données souveraines', en: 'Sovereign data' },
    desc: {
      fr: 'Une infrastructure de données régionale, contrôlée et hébergée en Afrique centrale.',
      en: 'A regional data infrastructure, controlled and hosted in Central Africa.',
    },
  },
]

const IMPACT = [
  { value: '+28%', label: { fr: "d'échanges intra-régionaux", en: 'intra-regional trade' }, icon: TrendingUp },
  { value: '45 000+', label: { fr: 'entreprises connectées', en: 'connected companies' }, icon: Building2 },
  { value: '60M+', label: { fr: 'de citoyens bénéficiaires', en: 'citizen beneficiaries' }, icon: Users },
  { value: '98,6%', label: { fr: 'de transactions sécurisées', en: 'secured transactions' }, icon: ShieldCheck },
]

const NODE_COLORS = ['#CE1126', '#009543', '#FCD116', '#3A75C4', '#003082', '#C60C30', '#007A5E', '#3DDC97']

function FlagRibbon() {
  return (
    <div className="flex h-1.5 w-full overflow-hidden" aria-hidden>
      {COUNTRIES.map((country) => {
        const Flag = CEMAC_FLAG_COMPONENTS[country.code]
        return (
          <div key={country.code} className="relative min-w-0 flex-1">
            <Flag className="absolute inset-0 h-full w-full object-cover" />
          </div>
        )
      })}
    </div>
  )
}

function HeroNetwork() {
  const hubs: Array<{ x: number; y: number; code: CemacFlagCode }> = [
    { x: 210, y: 150, code: 'CM' },
    { x: 260, y: 190, code: 'GA' },
    { x: 240, y: 250, code: 'CG' },
    { x: 180, y: 270, code: 'GQ' },
    { x: 150, y: 210, code: 'CF' },
    { x: 190, y: 180, code: 'TD' },
  ]

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[520px]">
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(61,220,151,0.18),transparent_62%)]" />
      <svg viewBox="0 0 420 420" className="relative z-10 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="netLine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FCD116" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#3DDC97" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#CE1126" stopOpacity="0.25" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {hubs.map(({ code }) => (
            <clipPath key={`clip-${code}`} id={`flag-clip-${code}`}>
              <circle r="14" cx="0" cy="0" />
            </clipPath>
          ))}
        </defs>
        {/* stylized CEMAC landmass */}
        <path
          d="M150 95c35-40 95-48 145-18 38 22 62 70 52 118-8 38-28 58-20 95 8 36-10 72-48 88-42 18-95 8-130-18-40-30-58-78-48-122 8-36 18-70 49-143z"
          fill="rgba(61,220,151,0.06)"
          stroke="rgba(61,220,151,0.35)"
          strokeWidth="1.5"
        />
        {hubs.map((hub, i) =>
          hubs.slice(i + 1).map((other) => (
            <line
              key={`${hub.code}-${other.code}`}
              x1={hub.x}
              y1={hub.y}
              x2={other.x}
              y2={other.y}
              stroke="url(#netLine)"
              strokeWidth="1"
              opacity={0.55}
            />
          ))
        )}
        {hubs.map((hub, i) => {
          const Flag = CEMAC_FLAG_COMPONENTS[hub.code]
          return (
            <g key={hub.code} transform={`translate(${hub.x} ${hub.y})`}>
              <circle r="18" fill="none" stroke={NODE_COLORS[i]} strokeOpacity="0.45" strokeWidth="1.5" />
              <circle r="14.5" fill="#07140f" filter="url(#glow)" />
              <foreignObject x="-14" y="-9.5" width="28" height="19" clipPath={`url(#flag-clip-${hub.code})`}>
                <Flag className="h-full w-full rounded-sm shadow" />
              </foreignObject>
              <circle r="14" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
            </g>
          )
        })}
      </svg>

      {/* Floating chart card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.7 }}
        className="absolute left-0 top-[12%] z-20 w-[190px] rounded-2xl border border-white/10 bg-[#0b1a14]/90 p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:left-[-4%]"
      >
        <p className="text-[11px] font-medium text-white/55">Flux commerciaux régionaux</p>
        <div className="mt-1 flex items-end justify-between gap-2">
          <p className="text-lg font-bold text-white">+28%</p>
          <span className="rounded-full bg-[#3DDC97]/15 px-2 py-0.5 text-[10px] font-semibold text-[#3DDC97]">
            vs T1 2024
          </span>
        </div>
        <svg viewBox="0 0 160 48" className="mt-2 h-12 w-full" aria-hidden>
          <path
            d="M0 36 C20 34, 30 28, 45 30 C60 32, 70 18, 90 16 C110 14, 125 22, 140 10 L160 6"
            fill="none"
            stroke="#3DDC97"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M0 36 C20 34, 30 28, 45 30 C60 32, 70 18, 90 16 C110 14, 125 22, 140 10 L160 6 V48 H0 Z"
            fill="url(#chartFill)"
            opacity="0.25"
          />
          <defs>
            <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3DDC97" />
              <stop offset="100%" stopColor="#3DDC97" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Floating ring card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.7 }}
        className="absolute bottom-[14%] right-0 z-20 w-[168px] rounded-2xl border border-white/10 bg-[#0b1a14]/90 p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:right-[-2%]"
      >
        <div className="relative mx-auto h-20 w-20">
          <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90" aria-hidden>
            <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
            <circle
              cx="40"
              cy="40"
              r="30"
              fill="none"
              stroke="#3DDC97"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 30 * 0.986} ${2 * Math.PI * 30}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-bold text-white">98,6%</span>
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] leading-snug text-white/55">Transactions sécurisées</p>
      </motion.div>
    </div>
  )
}

function DashboardMock() {
  return (
    <div className="overflow-hidden rounded-[22px] border border-white/10 bg-[#0a1611] shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
      <div className="grid grid-cols-[64px_1fr] sm:grid-cols-[180px_1fr]">
        <aside className="border-r border-white/8 bg-[#07120e] p-3 sm:p-4">
          <div className="mb-5 hidden items-center gap-2 sm:flex">
            <div className="h-7 w-7 rounded-lg bg-[#3DDC97]/20" />
            <span className="text-xs font-bold text-white">CEMAC</span>
          </div>
          <div className="space-y-1.5">
            {['Tableau de bord', 'Paiements', 'Identités', 'Commerce', 'Rapports', 'Paramètres'].map((item, i) => (
              <div
                key={item}
                className={`flex items-center gap-2 rounded-lg px-2 py-2 text-[11px] ${
                  i === 0 ? 'bg-[#3DDC97]/15 text-[#3DDC97]' : 'text-white/40'
                }`}
              >
                <div className={`h-1.5 w-1.5 rounded-full ${i === 0 ? 'bg-[#3DDC97]' : 'bg-white/20'}`} />
                <span className="hidden sm:inline">{item}</span>
              </div>
            ))}
          </div>
        </aside>
        <div className="p-4 sm:p-5">
          <div className="mb-4 grid grid-cols-3 gap-2.5">
            {[
              { label: 'Transactions', value: '12 480', delta: '+12%' },
              { label: 'Volume échangé', value: '8,4 Md', delta: '+8%' },
              { label: 'Entreprises actives', value: '45 012', delta: '+5%' },
            ].map((card) => (
              <div key={card.label} className="rounded-xl border border-white/8 bg-white/[0.03] p-2.5 sm:p-3">
                <p className="truncate text-[10px] text-white/40">{card.label}</p>
                <p className="mt-1 text-sm font-bold text-white sm:text-base">{card.value}</p>
                <p className="text-[10px] font-semibold text-[#3DDC97]">{card.delta}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-[1.6fr_1fr]">
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
              <p className="mb-3 text-[11px] font-medium text-white/50">Volume des transactions</p>
              <svg viewBox="0 0 280 110" className="h-[110px] w-full" aria-hidden>
                <defs>
                  <linearGradient id="dashFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3DDC97" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#3DDC97" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 80 C30 75, 50 60, 80 55 C110 50, 130 70, 160 45 C190 20, 220 35, 250 18 L280 10 V110 H0 Z"
                  fill="url(#dashFill)"
                />
                <path
                  d="M0 80 C30 75, 50 60, 80 55 C110 50, 130 70, 160 45 C190 20, 220 35, 250 18 L280 10"
                  fill="none"
                  stroke="#3DDC97"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
              <p className="mb-3 text-[11px] font-medium text-white/50">Répartition par pays</p>
              <div className="flex items-center gap-3">
                <svg viewBox="0 0 80 80" className="h-20 w-20 shrink-0" aria-hidden>
                  <circle cx="40" cy="40" r="28" fill="none" stroke="#3DDC97" strokeWidth="10" strokeDasharray="60 116" />
                  <circle cx="40" cy="40" r="28" fill="none" stroke="#FCD116" strokeWidth="10" strokeDasharray="30 146" strokeDashoffset="-60" />
                  <circle cx="40" cy="40" r="28" fill="none" stroke="#3A75C4" strokeWidth="10" strokeDasharray="26 150" strokeDashoffset="-90" />
                  <circle cx="40" cy="40" r="28" fill="none" stroke="#CE1126" strokeWidth="10" strokeDasharray="20 156" strokeDashoffset="-116" />
                </svg>
                <div className="space-y-1.5 text-[10px] text-white/55">
                  <p><span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#3DDC97]" />CM 34%</p>
                  <p><span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#FCD116]" />GA 18%</p>
                  <p><span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#3A75C4]" />CG 16%</p>
                  <p><span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#CE1126]" />Autres</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function LandingPage() {
  const { i18n } = useTranslation()
  const locale = getPrimaryLanguage(i18n.resolvedLanguage ?? i18n.language) === 'en' ? 'en' : 'fr'
  const isFr = locale === 'fr'

  return (
    <div className="overflow-x-hidden bg-[#050f0a] text-white" style={{ backgroundColor: BG }}>
      {/* HERO */}
      <section className="relative overflow-hidden pb-8 pt-[140px] sm:pt-[152px]" aria-label="Accueil">
        <div className="absolute inset-x-0 top-[104px] z-20">
          <FlagRibbon />
        </div>
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 70% 35%, rgba(61,220,151,0.12), transparent 60%), radial-gradient(ellipse 40% 40% at 10% 80%, rgba(61,220,151,0.06), transparent 50%)',
          }}
        />
        <div className="relative mx-auto grid max-w-[1280px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="space-y-7"
          >
            <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#3DDC97]">
              {isFr ? "L'intégration régionale, réinventée" : 'Regional integration, reinvented'}
            </p>
            <h1 className="max-w-xl text-[2.35rem] font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.35rem]">
              {isFr ? (
                <>
                  Connecter les économies.
                  <br />
                  <span className="text-[#3DDC97]">Accélérer l&apos;Afrique centrale.</span>
                </>
              ) : (
                <>
                  Connect economies.
                  <br />
                  <span className="text-[#3DDC97]">Accelerate Central Africa.</span>
                </>
              )}
            </h1>
            <p className="max-w-lg text-[15px] leading-relaxed text-white/60 sm:text-base">
              {isFr
                ? 'CEMAC INTEGRA relie citoyens, entreprises et institutions des six pays de la Communauté Économique et Monétaire de l’Afrique Centrale sur une plateforme digitale souveraine.'
                : 'CEMAC INTEGRA connects citizens, businesses and institutions across the six CEMAC countries on a sovereign digital platform.'}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/auth/register"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#3DDC97] px-6 text-[14px] font-semibold text-[#052014] transition hover:bg-[#54e6a7]"
              >
                {isFr ? 'Découvrir la plateforme' : 'Discover the platform'}
              </Link>
              <Link
                to="/#technologie"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/15 px-6 text-[14px] font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/25">
                  <Play className="h-3 w-3 fill-white" aria-hidden />
                </span>
                {isFr ? 'Voir comment ça fonctionne' : 'See how it works'}
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            <HeroNetwork />
          </motion.div>
        </div>

        {/* Stats bar */}
        <div className="relative mx-auto mt-14 max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-5 backdrop-blur-sm sm:grid-cols-3 sm:px-8">
            {[
              { icon: Globe2, label: isFr ? '6 pays connectés' : '6 connected countries' },
              { icon: Users, label: isFr ? '60M+ de citoyens' : '60M+ citizens' },
              { icon: Network, label: isFr ? '1 marché régional' : '1 regional market' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center justify-center gap-3 text-sm font-medium text-white/75">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#3DDC97]/25 bg-[#3DDC97]/10 text-[#3DDC97]">
                  <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" aria-hidden />
                </span>
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COUNTRIES */}
      <section id="pays" className="scroll-mt-28 py-20 sm:py-24" aria-label="Nations de la CEMAC">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-3xl">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem]">
              {isFr ? (
                <>
                  Un espace économique.
                  <br />
                  Six nations. Une vision.
                </>
              ) : (
                <>
                  One economic space.
                  <br />
                  Six nations. One vision.
                </>
              )}
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {COUNTRIES.map((country, idx) => {
              const Flag = CEMAC_FLAG_COMPONENTS[country.code]
              return (
              <motion.div
                key={country.name.fr}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05, duration: 0.45 }}
                className="group relative flex min-h-[300px] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a1611] transition hover:border-[#3DDC97]/35 hover:bg-[#0c1a14]"
              >
                <div className="relative h-16 w-full overflow-hidden border-b border-white/[0.06]">
                  <Flag className="h-full w-full object-cover" title={country.name[locale]} />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a1611]/85" />
                </div>
                <div className="absolute inset-y-0 left-0 flex w-[3px]">
                  {country.accents.map((color) => (
                    <span key={color} className="flex-1" style={{ backgroundColor: color }} />
                  ))}
                </div>
                <div className="flex flex-1 flex-col p-4 pt-3">
                  <div className="mb-2 flex items-start justify-between gap-2 pl-2">
                    <h3 className="text-[13px] font-bold leading-snug text-white">{country.name[locale]}</h3>
                    <Flag className="mt-0.5 h-5 w-8 shrink-0 rounded-[3px] border border-white/15 shadow-sm" title={country.name[locale]} />
                  </div>
                  <div className="relative my-3 flex flex-1 items-center justify-center">
                    <svg viewBox="0 0 100 100" className="h-24 w-24 opacity-90" aria-hidden>
                      <defs>
                        <filter id={`countryGlow-${idx}`}>
                          <feGaussianBlur stdDeviation="1.4" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      <path
                        d={country.path}
                        fill="none"
                        stroke={country.accents[0]}
                        strokeWidth="1.6"
                        strokeOpacity="0.75"
                        filter={`url(#countryGlow-${idx})`}
                      />
                      <path d={country.path} fill={`${country.accents[0]}22`} />
                    </svg>
                  </div>
                  <div className="mt-auto space-y-1 pl-2 text-[11px] text-white/45">
                    <p>
                      <span className="text-white/30">{isFr ? 'Capitale' : 'Capital'} · </span>
                      {country.capital[locale]}
                    </p>
                    <p>
                      <span className="text-white/30">{isFr ? 'Population' : 'Population'} · </span>
                      {country.population}
                    </p>
                    <p>
                      <span className="text-white/30">{isFr ? 'Monnaie' : 'Currency'} · </span>
                      XAF
                    </p>
                  </div>
                </div>
                <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-white/25 transition group-hover:text-[#3DDC97]" aria-hidden />
              </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* INFRASTRUCTURE */}
      <section id="ecosystem" className="scroll-mt-28 border-t border-white/[0.05] py-20 sm:py-24" aria-label="Infrastructure">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
            {isFr ? 'Une infrastructure pensée pour l’intégration' : 'Infrastructure built for integration'}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {INFRA.map(({ icon: Icon, title, desc }, idx) => (
              <motion.div
                key={title.fr}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className="rounded-2xl border border-white/[0.08] bg-[#0a1611] p-7 transition hover:border-[#3DDC97]/30"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-[#3DDC97]/20 bg-[#3DDC97]/10 text-[#3DDC97]">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mb-2 text-lg font-bold text-white">{title[locale]}</h3>
                <p className="mb-6 text-sm leading-relaxed text-white/50">{desc[locale]}</p>
                <Link to="/a-propos" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3DDC97] hover:underline">
                  {isFr ? 'En savoir plus' : 'Learn more'}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TECHNOLOGY */}
      <section id="technologie" className="scroll-mt-28 border-t border-white/[0.05] py-20 sm:py-24" aria-label="Technologie">
        <div className="mx-auto grid max-w-[1280px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <div>
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#3DDC97]">
              {isFr ? 'Notre technologie' : 'Our technology'}
            </p>
            <h2 className="mb-5 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.6rem] lg:leading-[1.15]">
              {isFr ? (
                <>
                  La technologie au service d’un marché{' '}
                  <span className="text-[#3DDC97]">sans frontières</span>.
                </>
              ) : (
                <>
                  Technology powering a market{' '}
                  <span className="text-[#3DDC97]">without borders</span>.
                </>
              )}
            </h2>
            <p className="mb-7 max-w-md text-sm leading-relaxed text-white/55 sm:text-[15px]">
              {isFr
                ? 'Certification d’origine, marketplace B2B, corridors logistiques et intelligence économique — un cockpit unique pour accélérer le commerce régional.'
                : 'Origin certification, B2B marketplace, logistics corridors and market intelligence — one cockpit to accelerate regional trade.'}
            </p>
            <div className="mb-8 flex flex-wrap gap-2">
              {(isFr
                ? [
                    { label: 'Sécurisé', icon: ShieldCheck },
                    { label: 'Interopérable', icon: Network },
                    { label: 'Souverain', icon: Database },
                  ]
                : [
                    { label: 'Secure', icon: ShieldCheck },
                    { label: 'Interoperable', icon: Network },
                    { label: 'Sovereign', icon: Database },
                  ]
              ).map(({ label, icon: Icon }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-white/70"
                >
                  <Icon className="h-3.5 w-3.5 text-[#3DDC97]" aria-hidden />
                  {label}
                </span>
              ))}
            </div>
            <Link
              to="/tarifs"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#3DDC97] hover:underline"
            >
              {isFr ? 'Découvrir notre technologie' : 'Explore our technology'}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <DashboardMock />
          </motion.div>
        </div>
      </section>

      {/* IMPACT */}
      <section className="border-t border-white/[0.05] py-20 sm:py-24" aria-label="Impact">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <p className="mb-10 text-center text-[12px] font-semibold uppercase tracking-[0.22em] text-[#3DDC97]">
            {isFr ? 'Un impact mesurable' : 'Measurable impact'}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {IMPACT.map(({ value, label, icon: Icon }, idx) => (
              <motion.div
                key={value}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.07 }}
                className="rounded-2xl border border-white/[0.08] bg-[#0a1611] p-6 text-center"
              >
                <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#3DDC97]/10 text-[#3DDC97]">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <p className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{value}</p>
                <p className="mt-2 text-sm text-white/50">{label[locale]}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="pb-20 sm:pb-24" aria-label="Call to action">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[28px] border border-[#3DDC97]/20 bg-gradient-to-r from-[#0a2418] via-[#0c1f16] to-[#0a1611] px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
            <div
              className="pointer-events-none absolute -left-10 top-1/2 h-[140%] w-[45%] -translate-y-1/2 opacity-40"
              aria-hidden
              style={{
                backgroundImage:
                  'repeating-radial-gradient(circle at 30% 50%, transparent 0, transparent 18px, rgba(212,175,55,0.18) 19px, transparent 20px)',
              }}
            />
            <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
              <div className="max-w-xl">
                <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-[2rem]">
                  {isFr
                    ? 'Construisons ensemble l’économie régionale de demain.'
                    : 'Let’s build tomorrow’s regional economy together.'}
                </h2>
                <p className="mt-3 text-sm text-white/55">
                  {isFr
                    ? 'Rejoignez une communauté d’acteurs engagés pour accélérer l’intégration digitale de l’Afrique centrale.'
                    : 'Join a community of committed actors accelerating Central Africa’s digital integration.'}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/partenaires"
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-[#3DDC97] px-6 text-sm font-semibold text-[#052014] transition hover:bg-[#54e6a7]"
                >
                  {isFr ? 'Devenir partenaire' : 'Become a partner'}
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-white/20 px-6 text-sm font-semibold text-white transition hover:bg-white/5"
                >
                  {isFr ? 'Nous contacter' : 'Contact us'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
