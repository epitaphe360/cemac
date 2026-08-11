import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

type LegalType = 'cgu' | 'privacy' | 'cookies' | 'legal'

const PAGES: Record<LegalType, { title: string; updated: string; sections: { heading: string; paragraphs: string[] }[] }> = {
  cgu: {
    title: 'Conditions Générales d\'Utilisation',
    updated: '29 juin 2026',
    sections: [
      {
        heading: '1. Objet',
        paragraphs: [
          'Les présentes Conditions Générales d\'Utilisation (CGU) régissent l\'accès et l\'utilisation de la plateforme CEMAC INTEGRA, service numérique dédié à la certification d\'origine, au commerce et à la logistique dans l\'espace CEMAC.',
          'En créant un compte ou en utilisant la plateforme, vous acceptez sans réserve les présentes CGU.',
        ],
      },
      {
        heading: '2. Services proposés',
        paragraphs: [
          'CEMAC INTEGRA permet aux entreprises de soumettre des dossiers de certification, de gérer leurs produits sur la marketplace, d\'accéder aux outils logistiques et aux données de marché.',
          'Les certifications délivrées via la plateforme sont soumises aux règles applicables de la zone CEMAC et aux procédures des chambres de commerce partenaires.',
        ],
      },
      {
        heading: '3. Comptes utilisateurs',
        paragraphs: [
          'Chaque utilisateur est responsable de la confidentialité de ses identifiants. Toute activité réalisée depuis un compte est réputée effectuée par son titulaire.',
          'CEMAC INTEGRA se réserve le droit de suspendre ou supprimer un compte en cas de violation des CGU ou de fraude documentaire.',
        ],
      },
      {
        heading: '4. Abonnements et paiements',
        paragraphs: [
          'Certains services sont proposés sous forme d\'abonnements payants. Les tarifs en vigueur sont affichés sur la page Tarifs.',
          'Les paiements sont traités par des prestataires tiers sécurisés (Stripe, Mobile Money, virement bancaire). Aucune donnée bancaire complète n\'est stockée sur nos serveurs.',
        ],
      },
      {
        heading: '5. Propriété intellectuelle',
        paragraphs: [
          'La marque CEMAC INTEGRA, le logo, l\'interface et les contenus éditoriaux sont protégés. Toute reproduction non autorisée est interdite.',
          'Les documents téléversés par les utilisateurs restent leur propriété ; l\'utilisateur accorde à CEMAC INTEGRA une licence limitée pour les traiter dans le cadre des services.',
        ],
      },
      {
        heading: '6. Limitation de responsabilité',
        paragraphs: [
          'CEMAC INTEGRA met en œuvre les moyens raisonnables pour assurer la disponibilité et la sécurité du service, sans garantie d\'absence d\'interruption.',
          'La plateforme ne saurait être tenue responsable des pertes indirectes liées à l\'utilisation du service ou aux décisions prises sur la base des informations affichées.',
        ],
      },
      {
        heading: '7. Droit applicable',
        paragraphs: [
          'Les présentes CGU sont soumises au droit camerounais et aux textes communautaires CEMAC applicables.',
          'En cas de litige, les parties s\'efforceront de trouver une solution amiable avant toute action judiciaire.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Politique de confidentialité',
    updated: '29 juin 2026',
    sections: [
      {
        heading: '1. Responsable du traitement',
        paragraphs: [
          'CEMAC INTEGRA, dont le siège est à Yaoundé (Cameroun), est responsable du traitement des données personnelles collectées via la plateforme.',
          'Contact : contact@cemacintegra.com',
        ],
      },
      {
        heading: '2. Données collectées',
        paragraphs: [
          'Nous collectons : identité (nom, email, téléphone), données entreprise (raison sociale, pays, secteur), documents de certification, logs de connexion et préférences de notification.',
          'Les données de paiement sont traitées directement par nos prestataires certifiés PCI-DSS.',
        ],
      },
      {
        heading: '3. Finalités',
        paragraphs: [
          'Vos données sont utilisées pour : gestion des comptes, traitement des dossiers de certification, facturation, communication transactionnelle, amélioration du service et conformité réglementaire.',
        ],
      },
      {
        heading: '4. Base légale et conservation',
        paragraphs: [
          'Le traitement repose sur l\'exécution du contrat, l\'intérêt légitime et, le cas échéant, votre consentement.',
          'Les données sont conservées pendant la durée du compte actif, puis archivées conformément aux obligations légales (jusqu\'à 10 ans pour les dossiers de certification).',
        ],
      },
      {
        heading: '5. Vos droits',
        paragraphs: [
          'Vous disposez d\'un droit d\'accès, de rectification, d\'effacement, de limitation, de portabilité et d\'opposition.',
          'Pour exercer vos droits : contact@cemacintegra.com. Vous pouvez également introduire une réclamation auprès de l\'autorité de protection des données compétente.',
        ],
      },
      {
        heading: '6. Sécurité',
        paragraphs: [
          'Les données sont hébergées sur Supabase (infrastructure cloud sécurisée). L\'accès est protégé par chiffrement TLS, authentification et politiques RLS (Row Level Security).',
        ],
      },
    ],
  },
  cookies: {
    title: 'Politique de cookies',
    updated: '29 juin 2026',
    sections: [
      {
        heading: '1. Qu\'est-ce qu\'un cookie ?',
        paragraphs: [
          'Un cookie est un petit fichier texte déposé sur votre appareil lors de la visite d\'un site web. Il permet de mémoriser des préférences ou de mesurer l\'audience.',
        ],
      },
      {
        heading: '2. Cookies utilisés',
        paragraphs: [
          'Cookies essentiels : session d\'authentification Supabase (cemac-integra-auth), nécessaires au fonctionnement du compte.',
          'Cookies de préférence : langue (fr/en) via i18next.',
          'Cookies analytiques : Sentry (monitoring d\'erreurs en production, si activé).',
        ],
      },
      {
        heading: '3. Gestion des cookies',
        paragraphs: [
          'Vous pouvez configurer votre navigateur pour refuser les cookies non essentiels. Le refus des cookies essentiels empêchera la connexion à votre espace.',
        ],
      },
    ],
  },
  legal: {
    title: 'Mentions légales',
    updated: '29 juin 2026',
    sections: [
      {
        heading: 'Éditeur',
        paragraphs: [
          'CEMAC INTEGRA — Plateforme régionale de certification et commerce',
          'Siège : Yaoundé, Cameroun',
          'Email : contact@cemacintegra.com · Tél. : +237 699 000 000',
        ],
      },
      {
        heading: 'Hébergement',
        paragraphs: [
          'Frontend : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis',
          'Backend & base de données : Supabase Inc., région EU (eu-west-1)',
        ],
      },
      {
        heading: 'Directeur de la publication',
        paragraphs: [
          'Dr. Koffi Mensah — CEO, CEMAC INTEGRA',
        ],
      },
      {
        heading: 'Propriété intellectuelle',
        paragraphs: [
          'L\'ensemble du contenu du site (textes, graphismes, logo, logiciels) est la propriété de CEMAC INTEGRA ou de ses partenaires. Toute reproduction est soumise à autorisation préalable.',
        ],
      },
    ],
  },
}

interface LegalPageProps {
  type: LegalType
}

export function LegalPage({ type }: LegalPageProps) {
  const page = PAGES[type]

  return (
    <div className="min-h-screen bg-gradient-to-b from-cemac-50/50 to-white">
      <div className="max-w-3xl mx-auto px-6 py-16 lg:py-24">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-cemac-700 hover:text-cemac-900 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l&apos;accueil
        </Link>

        <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-2">{page.title}</h1>
        <p className="text-sm text-muted-foreground mb-10">Dernière mise à jour : {page.updated}</p>

        <div className="space-y-8">
          {page.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-bold text-cemac-900 mb-3">{section.heading}</h2>
              {section.paragraphs.map((p, i) => (
                <p key={i} className="text-gray-600 leading-relaxed mb-3 last:mb-0">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

export function TermsPage() { return <LegalPage type="cgu" /> }
export function PrivacyPage() { return <LegalPage type="privacy" /> }
export function CookiesPage() { return <LegalPage type="cookies" /> }
export function LegalNoticePage() { return <LegalPage type="legal" /> }
