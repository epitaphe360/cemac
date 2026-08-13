import type { CmsLocale, ContentBlockView } from '@/lib/cms-types'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1586528116311-ad8ed3c84a0f?q=80&w=2940&auto=format&fit=crop'

type LocaleCopy = {
  hero: {
    badge: string
    title: string
    description: string
    primary_cta: string
    secondary_cta: string
    image_alt: string
  }
  live: {
    title: string
    status: string
    item_label: string
    item_status: string
    aria_label: string
  }
  countriesIntro: { title: string; description: string }
  countries: Array<{
    id: string
    key: string
    flag: string
    name: string
    description: string
    mediaUrl: string
  }>
  featuresIntro: { title: string; description: string }
  features: Array<{ id: string; key: string; title: string; description: string }>
}

const COPY: Record<CmsLocale, LocaleCopy> = {
  fr: {
    hero: {
      badge: 'Espace CEMAC',
      title: "Propulsez l'Afrique Centrale vers le Monde.",
      description:
        "La plateforme d'intelligence métier pour l'import/export. Traçabilité connectée, suivi logistique et certification digitale pour les entreprises de la zone.",
      primary_cta: 'Accéder au Portail',
      secondary_cta: 'Espace Connecté',
      image_alt: "Port d'Afrique centrale",
    },
    live: {
      title: 'Suivi logistique',
      status: 'En transit',
      item_label: 'Dossier de démonstration',
      item_status: 'Certification approuvée',
      aria_label: 'Aperçu illustratif du suivi logistique',
    },
    countriesIntro: {
      title: '6 Nations. 1 Écosystème Digital.',
      description:
        'Une solution logicielle qui facilite les opérations transfrontalières et le commerce inter-régional pour les entreprises.',
    },
    countries: [
      {
        id: 'cm',
        key: 'cm',
        flag: '🇨🇲',
        name: 'Cameroun',
        description: 'Hub portuaire et moteur économique',
        mediaUrl:
          'https://images.unsplash.com/photo-1519062325381-0814bd0392dc?q=80&w=800&auto=format&fit=crop',
      },
      {
        id: 'ga',
        key: 'ga',
        flag: '🇬🇦',
        name: 'Gabon',
        description: 'Engagement vert et modernisation',
        mediaUrl:
          'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?q=80&w=800&auto=format&fit=crop',
      },
      {
        id: 'cg',
        key: 'cg',
        flag: '🇨🇬',
        name: 'Congo',
        description: 'Carrefour logistique régional',
        mediaUrl:
          'https://images.unsplash.com/photo-1480796927426-f609979314bd?q=80&w=800&auto=format&fit=crop',
      },
      {
        id: 'gq',
        key: 'gq',
        flag: '🇬🇶',
        name: 'Guinée Équatoriale',
        description: 'Enjeux énergétiques majeurs',
        mediaUrl:
          'https://images.unsplash.com/photo-1563804868019-2187cc87ea0b?q=80&w=800&auto=format&fit=crop',
      },
      {
        id: 'td',
        key: 'td',
        flag: '🇹🇩',
        name: 'Tchad',
        description: 'Partenaire transsaharien',
        mediaUrl:
          'https://images.unsplash.com/photo-1511228227653-b09e13cf624c?q=80&w=800&auto=format&fit=crop',
      },
      {
        id: 'cf',
        key: 'cf',
        flag: '🇨🇫',
        name: 'Centrafrique',
        description: 'Ressources et minerais stratégiques',
        mediaUrl:
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
      },
    ],
    featuresIntro: {
      title: 'La technologie au service du commerce régional',
      description: 'Certification, corridors et conformité — un seul cockpit pour la zone CEMAC.',
    },
    features: [
      {
        id: 'certificates',
        key: 'certificates',
        title: 'Certificats Origine',
        description: 'Émis et authentifiés sur un registre sécurisé en quelques minutes.',
      },
      {
        id: 'corridors',
        key: 'corridors',
        title: 'Traçabilité Corridor',
        description: 'Suivi documentaire des convois pour une logistique optimisée.',
      },
      {
        id: 'compliance',
        key: 'compliance',
        title: 'Conformité Métier',
        description: "Outils d'audit pour les acteurs économiques et les chambres de commerce.",
      },
    ],
  },
  en: {
    hero: {
      badge: 'CEMAC Zone',
      title: 'Power Central Africa Towards the World.',
      description:
        'The business intelligence platform for import/export. Connected traceability, logistics tracking and digital certification for companies in the zone.',
      primary_cta: 'Access the Portal',
      secondary_cta: 'Connected Space',
      image_alt: 'Central African port',
    },
    live: {
      title: 'Logistics tracking',
      status: 'In transit',
      item_label: 'Demo application',
      item_status: 'Certification approved',
      aria_label: 'Illustrative logistics tracking preview',
    },
    countriesIntro: {
      title: '6 Nations. 1 Digital Ecosystem.',
      description:
        'A software solution that facilitates cross-border operations and inter-regional trade for companies.',
    },
    countries: [
      {
        id: 'cm',
        key: 'cm',
        flag: '🇨🇲',
        name: 'Cameroon',
        description: 'Port hub and economic engine',
        mediaUrl:
          'https://images.unsplash.com/photo-1519062325381-0814bd0392dc?q=80&w=800&auto=format&fit=crop',
      },
      {
        id: 'ga',
        key: 'ga',
        flag: '🇬🇦',
        name: 'Gabon',
        description: 'Green commitment and modernization',
        mediaUrl:
          'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?q=80&w=800&auto=format&fit=crop',
      },
      {
        id: 'cg',
        key: 'cg',
        flag: '🇨🇬',
        name: 'Congo',
        description: 'Regional logistics crossroads',
        mediaUrl:
          'https://images.unsplash.com/photo-1480796927426-f609979314bd?q=80&w=800&auto=format&fit=crop',
      },
      {
        id: 'gq',
        key: 'gq',
        flag: '🇬🇶',
        name: 'Equatorial Guinea',
        description: 'Major energy challenges',
        mediaUrl:
          'https://images.unsplash.com/photo-1563804868019-2187cc87ea0b?q=80&w=800&auto=format&fit=crop',
      },
      {
        id: 'td',
        key: 'td',
        flag: '🇹🇩',
        name: 'Chad',
        description: 'Trans-Saharan partner',
        mediaUrl:
          'https://images.unsplash.com/photo-1511228227653-b09e13cf624c?q=80&w=800&auto=format&fit=crop',
      },
      {
        id: 'cf',
        key: 'cf',
        flag: '🇨🇫',
        name: 'Central African Republic',
        description: 'Resources and strategic minerals',
        mediaUrl:
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
      },
    ],
    featuresIntro: {
      title: 'Technology serving regional trade',
      description: 'Certification, corridors and compliance — one cockpit for the CEMAC zone.',
    },
    features: [
      {
        id: 'certificates',
        key: 'certificates',
        title: 'Origin Certificates',
        description: 'Issued and authenticated on a secure registry in minutes.',
      },
      {
        id: 'corridors',
        key: 'corridors',
        title: 'Corridor Traceability',
        description: 'Documentary tracking of convoys for optimized logistics.',
      },
      {
        id: 'compliance',
        key: 'compliance',
        title: 'Business Compliance',
        description: 'Audit tools for economic actors and chambers of commerce.',
      },
    ],
  },
}

function block(
  id: string,
  section: string,
  key: string,
  content: Record<string, string>,
  mediaUrl: string | null = null
): ContentBlockView {
  return {
    id,
    page: 'landing',
    section,
    key,
    locale: 'fr',
    content,
    mediaUrl,
    sortOrder: 0,
    publishedAt: null,
  }
}

export function getLandingFallback(locale: CmsLocale) {
  const copy = COPY[locale] ?? COPY.fr

  return {
    hero: block('fallback-hero', 'hero', 'main', copy.hero),
    live: block('fallback-live', 'live', 'main', copy.live),
    countriesIntro: block('fallback-countries-intro', 'countries', 'intro', copy.countriesIntro),
    countries: copy.countries.map((country) =>
      block(
        `fallback-country-${country.id}`,
        'countries',
        country.key,
        {
          flag: country.flag,
          name: country.name,
          description: country.description,
        },
        country.mediaUrl
      )
    ),
    featuresIntro: block('fallback-features-intro', 'features', 'intro', copy.featuresIntro),
    features: copy.features.map((feature) =>
      block(`fallback-feature-${feature.id}`, 'features', feature.key, {
        title: feature.title,
        description: feature.description,
      })
    ),
    heroImage: HERO_IMAGE,
  }
}
