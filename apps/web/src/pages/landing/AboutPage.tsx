import { Shield, Globe, Users, Zap, Award, Target, CheckCircle2, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CEMAC_COUNTRIES } from '@/lib/constants'

const values = [
  {
    icon: Shield,
    title: 'Intégrité',
    desc: 'Chaque certification émise sur notre plateforme est vérifiable, traçable et authentique.',
    color: 'bg-cemac-100 text-cemac-700',
  },
  {
    icon: Globe,
    title: 'Intégration régionale',
    desc: 'Nous croyons en une Afrique Centrale unie, où les échanges sont fluides et les produits reconnus.',
    color: 'bg-blue-100 text-blue-700',
  },
  {
    icon: Users,
    title: 'Inclusion',
    desc: 'Les PME africaines méritent les mêmes outils que les grandes multinationales — c\'est notre mission.',
    color: 'bg-gold-100 text-gold-700',
  },
  {
    icon: Zap,
    title: 'Innovation',
    desc: 'L\'intelligence artificielle et la blockchain au service de la certification et du commerce africain.',
    color: 'bg-purple-100 text-purple-700',
  },
]

const team = [
  { name: 'Dr. Koffi Mensah', role: 'CEO & Co-fondateur', country: '🇨🇲 Cameroun', initials: 'KM' },
  { name: 'Aïsha Diallo', role: 'CTO & Co-fondatrice', country: '🇬🇦 Gabon', initials: 'AD' },
  { name: 'Pierre Ekanga', role: 'Directeur Opérations CEMAC', country: '🇨🇬 Congo', initials: 'PE' },
  { name: 'Mariam Toure', role: 'Directrice Partenariats', country: '🇹🇩 Tchad', initials: 'MT' },
  { name: 'Jean-Claude Biya', role: 'Lead Certification', country: '🇨🇲 Cameroun', initials: 'JB' },
  { name: 'Sylvie Ngozi', role: 'Head of Design', country: '🇬🇶 Guinée Éq.', initials: 'SN' },
]

const milestones = [
  { year: '2023', event: 'Lancement du projet CEMAC INTEGRA, premiers partenariats avec les chambres de commerce' },
  { year: '2024', event: 'Pilote dans 3 pays (Cameroun, Gabon, Congo) — 250 certifications délivrées' },
  { year: '2025', event: 'Extension à 6 pays CEMAC. 1 000 entreprises inscrites. Ouverture de la Marketplace.' },
  { year: '2026', event: 'Lancement de l\'intelligence de marché IA. Intégration ZLECAF. 2 000+ entreprises.' },
]

const partners = [
  { name: 'CEMAC', description: 'Communauté Économique et Monétaire de l\'Afrique Centrale' },
  { name: 'UNCTAD', description: 'Conférence des Nations Unies sur le Commerce et le Développement' },
  { name: 'CCI CEMAC', description: 'Réseau des Chambres de Commerce Régionales' },
  { name: 'BAD', description: 'Banque Africaine de Développement — Programme fintech' },
]

export function AboutPage() {
  return (
    <div className="pt-20">

      {/* Hero */}
      <section className="py-24 bg-gradient-to-br from-cemac-900 via-cemac-800 to-cemac-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500/20 border border-gold-500/30 rounded-full text-gold-300 text-sm font-medium mb-8">
            <Target size={14} /> Notre mission
          </span>
          <h1 className="text-4xl lg:text-6xl font-black text-white mb-6 leading-tight">
            Numériser le commerce{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 to-gold-500">
              africain certifié
            </span>
          </h1>
          <p className="text-cemac-200 text-lg lg:text-xl leading-relaxed max-w-2xl mx-auto">
            CEMAC INTEGRA est né d'un constat simple : les PME africaines méritent
            des outils numériques modernes pour certifier leurs produits, développer
            leurs marchés et participer pleinement à l'intégration régionale.
          </p>
        </div>
      </section>

      {/* Mission statement */}
      <section className="py-20 bg-white/70 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cemac-100/80 text-cemac-700 rounded-xl text-sm font-semibold mb-5 shadow-sm">
                <Award size={14} /> Notre vision
              </div>
              <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-6 leading-tight">
                L'Afrique Centrale, hub commercial certifié du continent
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Nous croyons en un espace CEMAC où chaque produit local peut
                accéder aux marchés régionaux et internationaux avec la même
                crédibilité qu'un produit européen ou asiatique.
              </p>
              <p className="text-gray-600 leading-relaxed mb-8">
                Notre plateforme dématérialise les processus de certification
                qui prenaient des mois, les ramène à quelques semaines et rend
                le commerce transfrontalier accessible aux PME de toutes tailles.
              </p>
              <div className="space-y-3">
                {[
                  'Certification 100 % numérique et légalement reconnue',
                  'Plateforme disponible dans les 6 langues CEMAC',
                  'Support des paiements mobiles locaux',
                  'Formation et accompagnement inclus',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-cemac-500 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { val: '2 000+', label: 'Entreprises', bg: 'bg-cemac-700 text-white' },
                { val: '12 500+', label: 'Certifications', bg: 'bg-gold-800 text-white' },
                { val: '6', label: 'Pays CEMAC', bg: 'bg-gray-900 text-white' },
                { val: '98 %', label: 'Satisfaction', bg: 'bg-cemac-100 text-cemac-900' },
              ].map((s) => (
                <div key={s.label} className={`${s.bg} rounded-2xl p-6 flex flex-col justify-between`}>
                  <p className="text-3xl font-black">{s.val}</p>
                  <p className={`text-sm font-medium ${s.bg.includes('text-white') ? 'text-white' : 'text-cemac-600'}`}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-transparent">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-3">Nos valeurs</h2>
            <p className="text-gray-500">Les principes qui guident nos décisions au quotidien</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-white/92 backdrop-blur-sm p-6 rounded-3xl shadow-[0_16px_36px_rgba(10,45,39,0.08)] border border-white text-center">
                <div className={`inline-flex w-12 h-12 ${v.color} rounded-xl items-center justify-center mb-4`}>
                  <v.icon size={22} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-white/70 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-3">Notre équipe</h2>
            <p className="text-gray-500">Des experts issus des 6 pays CEMAC</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map((m) => (
              <div key={m.name} className="flex items-center gap-4 p-5 bg-white/90 rounded-3xl border border-white shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cemac-600 to-cemac-800 flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                  {m.initials}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{m.name}</p>
                  <p className="text-cemac-700 text-sm font-medium">{m.role}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{m.country}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-transparent">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-3">Notre parcours</h2>
            <p className="text-gray-500">De l'idée à la plateforme panafricaine</p>
          </div>
          <div className="space-y-6 relative">
            <div className="absolute left-16 top-0 bottom-0 w-0.5 bg-cemac-100" />
            {milestones.map((m, i) => (
              <div key={m.year} className="flex gap-6 items-start relative">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm flex-shrink-0 z-10 ${
                  i === milestones.length - 1
                    ? 'bg-cemac-700 text-white shadow-lg'
                    : 'bg-white border-2 border-cemac-200 text-cemac-700'
                }`}>
                  {m.year.slice(2)}
                </div>
                <div className="flex-1 bg-white/92 rounded-2xl p-4 border border-white shadow-sm">
                  <span className="text-xs font-black text-cemac-600 uppercase tracking-wider">{m.year}</span>
                  <p className="text-gray-700 text-sm mt-1 leading-relaxed">{m.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-16 bg-white/70 backdrop-blur-sm border-t border-white/70">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-gray-400 text-sm font-semibold uppercase tracking-widest mb-8">
            Partenaires & organisations membres
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {partners.map((p) => (
              <div key={p.name} className="p-5 bg-white/90 rounded-2xl border border-white shadow-sm">
                <p className="font-black text-cemac-800 text-lg mb-1">{p.name}</p>
                <p className="text-gray-400 text-xs leading-tight">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Countries */}
      <section className="py-12 bg-gradient-to-r from-cemac-800 to-cemac-900">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-cemac-300 text-sm mb-6">Zone d'opération — Espace CEMAC</p>
          <div className="flex flex-wrap justify-center gap-3">
            {CEMAC_COUNTRIES.map((c) => (
              <span key={c.code} className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/10 rounded-full text-white text-sm">
                {c.flag} {c.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black text-gray-900 mb-4">
            Rejoignez le mouvement
          </h2>
          <p className="text-gray-500 mb-8">
            Faites partie des entreprises qui construisent l'Afrique Centrale de demain.
          </p>
          <Link
            to="/auth/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-cemac-700 hover:bg-cemac-800 text-white font-bold text-lg rounded-2xl shadow-lg transition-all"
          >
            Créer mon compte gratuit <ArrowRight size={20} />
          </Link>
        </div>
      </section>

    </div>
  )
}
