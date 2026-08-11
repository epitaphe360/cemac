export type PublicPlanId = 'free' | 'sme' | 'enterprise'

export interface PublicPlanFeature {
  label: string
  included: boolean
}

export interface PublicPlanDefinition {
  id: PublicPlanId
  name: string
  monthlyPrice: number
  yearlyPrice: number
  description: string
  badge: string | null
  features: PublicPlanFeature[]
}

export const PUBLIC_PRICING_PLANS: PublicPlanDefinition[] = [
  {
    id: 'free',
    name: 'Starter',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'Pour découvrir la plateforme et tester vos premiers dossiers.',
    badge: null,
    features: [
      { label: '2 certifications / mois', included: true },
      { label: '1 compte utilisateur', included: true },
      { label: 'Accès marketplace (lecture)', included: true },
      { label: 'QR Code basique', included: true },
      { label: 'Support communauté', included: true },
      { label: 'Certifications illimitées', included: false },
      { label: 'Intelligence de marché', included: false },
      { label: 'Export XML/JSON/PDF', included: false },
      { label: 'API REST', included: false },
      { label: 'Support prioritaire', included: false },
    ],
  },
  {
    id: 'sme',
    name: 'Pro',
    monthlyPrice: 29000,
    yearlyPrice: 270000,
    description: "Pour les PME qui souhaitent certifier et commercialiser leurs produits à l'échelle CEMAC.",
    badge: 'Le plus populaire',
    features: [
      { label: 'Certifications illimitées', included: true },
      { label: '5 comptes utilisateurs', included: true },
      { label: 'Marketplace (publication)', included: true },
      { label: 'QR Code professionnel', included: true },
      { label: 'Intelligence de marché basique', included: true },
      { label: 'Export PDF certifications', included: true },
      { label: 'Support email 48h', included: true },
      { label: 'Module logistique', included: false },
      { label: 'API REST complète', included: false },
      { label: 'Account manager dédié', included: false },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 99000,
    yearlyPrice: 900000,
    description: 'Pour les grandes entreprises et groupes nécessitant une couverture complète et sur mesure.',
    badge: null,
    features: [
      { label: 'Certifications illimitées', included: true },
      { label: 'Utilisateurs illimités', included: true },
      { label: 'Marketplace premium', included: true },
      { label: 'Intelligence de marché complète', included: true },
      { label: 'Module logistique & transit', included: true },
      { label: 'API REST + webhooks', included: true },
      { label: 'Export XML/JSON/PDF', included: true },
      { label: 'Support prioritaire 24/7', included: true },
      { label: 'Account manager dédié', included: true },
      { label: 'Onboarding personnalisé', included: true },
    ],
  },
]

export const SETTINGS_UPGRADE_PLANS = [
  {
    id: 'sme' as const,
    label: 'Pro',
    price: '29 000 XAF / mois',
    description: 'Pour les PME actives dans la zone CEMAC.',
    highlights: [
      'Certifications illimitées',
      'Marketplace publishable',
      'Intelligence de marché',
      'Support prioritaire',
    ],
  },
  {
    id: 'enterprise' as const,
    label: 'Entreprise',
    price: '99 000 XAF / mois',
    description: 'Pour les grandes entreprises et groupes.',
    highlights: [
      'Tout du plan Pro',
      'API dédiée',
      'Tableau de bord logistique avancé',
      'Gestionnaire de compte dédié',
    ],
  },
]