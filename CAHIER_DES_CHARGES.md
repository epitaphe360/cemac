# CAHIER DES CHARGES — CEMAC INTEGRA
## Plateforme Numérique de Certification, Commerce & Logistique pour la Zone CEMAC

**Version** : 2.0.0  
**Date de mise à jour** : 27 avril 2026  
**Statut** : Document vivant — reflète l'état réel de l'application après toutes corrections et évolutions

---

## TABLE DES MATIÈRES

1. [Présentation du projet](#1-présentation-du-projet)
2. [Contexte et objectifs](#2-contexte-et-objectifs)
3. [Périmètre fonctionnel](#3-périmètre-fonctionnel)
4. [Architecture technique](#4-architecture-technique)
5. [Base de données](#5-base-de-données)
6. [Authentification et contrôle d'accès](#6-authentification-et-contrôle-daccès)
7. [Module Certification](#7-module-certification)
8. [Module Marketplace](#8-module-marketplace)
9. [Module Logistique](#9-module-logistique)
10. [Module Intelligence de Marché](#10-module-intelligence-de-marché)
11. [Module Administration](#11-module-administration)
12. [Module Paramètres & Abonnements](#12-module-paramètres--abonnements)
13. [Pages Vitrine (Landing)](#13-pages-vitrine-landing)
14. [Internationalisation](#14-internationalisation)
15. [Tests et qualité](#15-tests-et-qualité)
16. [Déploiement et infrastructure](#16-déploiement-et-infrastructure)
17. [Sécurité](#17-sécurité)
18. [Évolutions futures](#18-évolutions-futures)

---

## 1. PRÉSENTATION DU PROJET

**CEMAC INTEGRA** est une plateforme SaaS B2B destinée aux entreprises et acteurs institutionnels de la zone CEMAC (Communauté Économique et Monétaire de l'Afrique Centrale), regroupant 6 pays membres :

| Code | Pays |
|------|------|
| CM | Cameroun 🇨🇲 |
| GA | Gabon 🇬🇦 |
| CG | Congo 🇨🇬 |
| TD | Tchad 🇹🇩 |
| CF | Centrafrique 🇨🇫 |
| GQ | Guinée Équatoriale 🇬🇶 |

La plateforme numérise et centralise quatre grands processus régionaux :
1. La **certification d'origine et de qualité** des produits fabriqués dans la zone CEMAC
2. La **commercialisation** de produits certifiés via une marketplace pan-africaine
3. Le **suivi logistique** des corridors de transit inter-régionaux
4. L'**intelligence de marché** via des tableaux de bord analytiques

---

## 2. CONTEXTE ET OBJECTIFS

### 2.1 Problématiques adressées

- Lenteur et opacité des procédures de certification d'origine sur papier
- Absence de visibilité sur les produits certifiés CEMAC à l'échelle régionale
- Difficultés de suivi des convois sur les corridors de transit
- Manque d'accès à des données de marché fiables pour les PME

### 2.2 Objectifs stratégiques

- Digitaliser intégralement le workflow de certification (de la demande à l'approbation)
- Créer un annuaire régional de produits certifiés consultable publiquement
- Offrir une traçabilité documentaire anti-contrefaçon via QR Code
- Fournir des indicateurs de marché en temps réel (taux de change, prix matières)
- Générer des revenus récurrents via un modèle SaaS par abonnement (Stripe)

### 2.3 Parties prenantes

| Partie prenante | Rôle |
|----------------|------|
| Entreprises (PME, GE) | Déposent et suivent leurs dossiers de certification |
| Chambres de Commerce | Reçoivent, vérifient et transmettent les dossiers |
| Agents CEMAC / Officiers | Examinent et statuent en commission |
| Acheteurs / Importateurs | Consultent la marketplace et vérifient les certifications |
| Agents logistiques | Suivent les corridors et gèrent les alertes de transit |
| Super Administrateurs | Gèrent la plateforme, les utilisateurs et les données de référence |

---

## 3. PÉRIMÈTRE FONCTIONNEL

### 3.1 Vue d'ensemble des modules

```
CEMAC INTEGRA
├── Vitrine publique (Landing, Tarifs, À propos, Contact)
├── Marketplace publique (consultation sans compte)
├── Vérification QR Code (URL publique /verify/:id)
├── Authentification (Inscription, Connexion, MDP oublié, Réinitialisation)
└── Application sécurisée
    ├── Tableau de bord (role-based)
    ├── Certification (liste, nouveau, détail, workflow)
    ├── Marketplace (consultation + gestion produits)
    ├── Logistique (corridors, alertes, certificats EUR.1)
    ├── Intelligence de marché (analytics, taux de change, prix)
    ├── Administration (super_admin)
    └── Paramètres (profil, entreprise, abonnement)
```

### 3.2 Routes de l'application

#### Routes publiques (sans authentification)
| URL | Page | Description |
|-----|------|-------------|
| `/` | LandingPage | Page d'accueil vitrine |
| `/tarifs` | PricingPage | Grille tarifaire |
| `/a-propos` | AboutPage | Présentation de la plateforme |
| `/contact` | ContactPage | Formulaire de contact |
| `/marketplace-public` | MarketplacePage | Catalogue public des produits certifiés |
| `/verify/:id` | VerifyCertificationPage | Vérification anti-contrefaçon via QR Code |

#### Routes d'authentification (sans layout)
| URL | Page | Description |
|-----|------|-------------|
| `/auth/login` | LoginPage | Connexion |
| `/auth/register` | RegisterPage | Inscription + création d'entreprise |
| `/auth/forgot-password` | ForgotPasswordPage | Demande de réinitialisation |
| `/auth/reset-password` | ResetPasswordPage | Saisie du nouveau mot de passe |

#### Routes protégées (AppLayout + authentification requise)
| URL | Page | Rôles autorisés |
|-----|------|----------------|
| `/dashboard` | DashboardPage | Tous les rôles authentifiés |
| `/certifications` | CertificationListPage | Tous (filtrés par rôle) |
| `/certifications/new` | NewCertificationPage | company_admin uniquement |
| `/certifications/:id` | CertificationDetailPage | Accès conditionnel par rôle |
| `/marketplace` | MarketplacePage | Tous les rôles authentifiés |
| `/marketplace/:id` | MarketplaceProductDetailPage | Tous les rôles authentifiés |
| `/products` | ProductsPage | company_admin uniquement |
| `/logistics` | LogisticsPage | Tous les rôles authentifiés |
| `/market-intelligence` | MarketIntelligencePage | Tous les rôles authentifiés |
| `/admin` | AdminPage | super_admin uniquement |
| `/settings` | SettingsPage | Tous les rôles authentifiés |

---

## 4. ARCHITECTURE TECHNIQUE

### 4.1 Stack technologique

#### Frontend
| Technologie | Version | Usage |
|------------|---------|-------|
| React | 18.x | Framework UI |
| TypeScript | 5.x | Typage statique |
| Vite | 5.x | Bundler & dev server |
| Tailwind CSS | 3.x | Styling utility-first |
| Radix UI | Latest | Composants UI accessibles |
| Framer Motion | Latest | Animations |
| React Router DOM | v6 | Routing (avec flags v7) |
| Zustand | Latest | State management (localStorage persist) |
| TanStack Query | v5 | Server state & cache |
| React Hook Form | Latest | Gestion des formulaires |
| Zod | Latest | Validation des schémas |
| Recharts | Latest | Graphiques et analytics |
| react-i18next | Latest | Internationalisation (FR/EN) |
| react-hot-toast | Latest | Notifications toast |
| qrcode | Latest | Génération de QR Code |
| html5-qrcode | Latest | Lecture de QR Code |
| jspdf | Latest | Export PDF |
| date-fns | Latest | Manipulation des dates |
| @stripe/stripe-js | Latest | Intégration paiement Stripe |
| Lucide React | Latest | Icônes |
| class-variance-authority | Latest | Variantes de composants |

#### Backend (Supabase)
| Service | Usage |
|---------|-------|
| PostgreSQL | Base de données relationnelle |
| Supabase Auth | Authentification email/password + JWT |
| Supabase Storage | Stockage fichiers (images produits, documents) |
| Supabase RLS | Sécurité au niveau des lignes (Row Level Security) |
| Supabase Edge Functions | Fonctions serverless (Deno runtime) |
| Supabase Realtime | WebSockets pour mises à jour temps réel |

#### Paiement
| Technologie | Usage |
|------------|-------|
| Stripe Checkout | Paiement abonnement |
| Stripe Webhooks | Synchronisation statut abonnement |

#### Observabilité
| Outil | Usage |
|-------|-------|
| Sentry | Tracking d'erreurs frontend |

### 4.2 Architecture applicative

```
apps/web/src/
├── App.tsx              # Router principal
├── main.tsx             # Point d'entrée, providers
├── components/
│   ├── error/           # GlobalErrorBoundary
│   ├── landing/         # LandingNav, LandingLayout, LandingFooter
│   ├── layout/          # AppLayout, Sidebar, Header, ProtectedRoute
│   ├── shared/          # LoadingSpinner, LogoMark, StatusBadge
│   └── ui/              # Composants Radix (Button, Input, Card, Badge, etc.)
├── pages/
│   ├── admin/           # AdminPage
│   ├── auth/            # Login, Register, ForgotPassword, ResetPassword
│   ├── certification/   # List, New, Detail
│   ├── dashboard/       # DashboardPage + 6 sous-tableaux de bord
│   ├── landing/         # Landing, Pricing, About, Contact
│   ├── logistics/       # LogisticsPage
│   ├── market-intelligence/ # MarketIntelligencePage
│   ├── marketplace/     # MarketplacePage, ProductDetail
│   ├── products/        # ProductsPage
│   ├── settings/        # SettingsPage
│   └── verify/          # VerifyCertificationPage
├── stores/
│   └── auth.store.ts    # Zustand store (session, profile, entreprise)
├── lib/
│   ├── constants.ts     # Constantes globales (pays, rôles, statuts)
│   ├── pricing.ts       # Définition des plans tarifaires
│   ├── supabase.ts      # Client Supabase
│   ├── utils.ts         # Fonctions utilitaires
│   └── i18n-utils.ts    # Utilitaires traduction
├── i18n/
│   ├── en.json          # Traductions anglaises
│   ├── fr.json          # Traductions françaises
│   └── index.ts         # Configuration i18next
└── types/
    ├── index.ts         # Types TypeScript domaine
    └── database.types.ts # Types générés Supabase
```

### 4.3 Déploiement

```
Vercel (Frontend)
    │
    └── Build : vite build
    └── URL prod : CEMAC INTEGRA domain

Supabase (Backend)
    │
    ├── Project : dotzvdrbondrybjkqqzd
    ├── Edge Functions : create-checkout-session, stripe-webhook
    └── Storage buckets : product-images

GitHub Actions (CI/CD)
    └── Lint + type-check + build sur chaque push
```

---

## 5. BASE DE DONNÉES

### 5.1 Schéma relationnel

#### Table `profiles` (Utilisateurs)
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID (PK, FK auth.users) | Identifiant Supabase Auth |
| `email` | TEXT | Email de connexion |
| `full_name` | TEXT | Nom complet |
| `phone` | TEXT | Téléphone |
| `country` | CHAR(2) | Code pays CEMAC |
| `language` | TEXT | Langue préférée (fr/en) |
| `role` | ENUM | Rôle applicatif |
| `avatar_url` | TEXT | URL avatar |
| `notification_preferences` | JSONB | Préférences de notifications |
| `created_at` | TIMESTAMPTZ | Date de création |
| `updated_at` | TIMESTAMPTZ | Dernière mise à jour (auto-trigger) |

**Rôles disponibles** : `super_admin`, `cemac_officer`, `chamber_agent`, `company_admin`, `auditor`, `buyer`, `logistics_agent`, `public`

#### Table `entreprises` (Sociétés)
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID (PK) | Identifiant |
| `owner_id` | UUID (FK profiles) | Propriétaire du compte |
| `raison_sociale` | TEXT | Nom légal de l'entreprise |
| `sigle` | TEXT | Acronyme |
| `secteur_activite` | TEXT | Secteur (Agro-alimentaire, Bois & Forêt, Textile…) |
| `pays` | CHAR(2) | Pays d'enregistrement |
| `ville` | TEXT | Ville |
| `adresse` | TEXT | Adresse complète |
| `telephone` | TEXT | Téléphone professionnel |
| `email_contact` | TEXT | Email de contact |
| `site_web` | TEXT | Site web |
| `numero_contribuable` | TEXT | Numéro d'identifiant fiscal |
| `description` | TEXT | Description de l'activité |
| `logo_url` | TEXT | Logo Supabase Storage |
| `subscription_plan` | ENUM | Plan actif : free / sme / enterprise / institutional |
| `is_verified` | BOOLEAN | Entreprise vérifiée par un admin |
| `chambre_commerce_id` | UUID (FK) | Chambre de commerce associée |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

#### Table `certifications` (Dossiers de certification)
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID (PK) | Identifiant |
| `entreprise_id` | UUID (FK) | Entreprise demanderesse |
| `numero_dossier` | TEXT (unique) | Numéro auto-généré : CI-YYYY-XXXXX |
| `type_certification` | ENUM | made_in_cemac / origine_cemac / qualite_plus |
| `statut` | ENUM | Voir workflow §7.2 |
| `produit_nom` | TEXT | Nom du produit |
| `produit_description` | TEXT | Description |
| `pays_production` | CHAR(2) | Pays de production |
| `valeur_ajoutee_locale` | DECIMAL(5,2) | % de valeur ajoutée locale |
| `qr_code_data` | TEXT | Contenu brut du QR Code |
| `qr_code_url` | TEXT | URL du QR Code dans Storage |
| `date_soumission` | TIMESTAMPTZ | Date de soumission officielle |
| `date_approbation` | TIMESTAMPTZ | Date d'approbation |
| `date_expiration` | TIMESTAMPTZ | Date d'expiration |
| `agent_id` | UUID (FK profiles) | Agent chambre assigné |
| `chambre_id` | UUID (FK) | Chambre de commerce |
| `notes_agent` | TEXT | Notes de l'agent |
| `notes_commission` | TEXT | Notes de la commission |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

#### Table `documents` (Pièces justificatives)
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID (PK) | |
| `certification_id` | UUID (FK) | Dossier associé |
| `nom_fichier` | TEXT | Nom original du fichier |
| `type_document` | ENUM | statuts / registre_commerce / bilan / factures / rapport_audit / photos_produit / certificat_qualite / autre |
| `url` | TEXT | URL Supabase Storage |
| `taille` | INTEGER | Taille en octets |
| `mime_type` | TEXT | Type MIME |
| `uploaded_by` | UUID (FK profiles) | Auteur du téléversement |
| `created_at` | TIMESTAMPTZ | |

#### Table `workflow_events` (Journal d'audit immuable)
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID (PK) | |
| `certification_id` | UUID (FK) | Dossier concerné |
| `statut_precedent` | TEXT | Statut avant transition |
| `statut_nouveau` | TEXT | Statut après transition |
| `commentaire` | TEXT | Commentaire libre |
| `created_by` | UUID (FK profiles) | Acteur de la transition |
| `created_at` | TIMESTAMPTZ | Date/heure (non modifiable) |

#### Table `produits` (Marketplace)
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID (PK) | |
| `entreprise_id` | UUID (FK) | Entreprise vendeur |
| `certification_id` | UUID (FK, nullable) | Certification liée |
| `nom` | TEXT | Nom du produit |
| `description` | TEXT | Description |
| `categorie` | TEXT | Catégorie |
| `sous_categorie` | TEXT | Sous-catégorie |
| `prix_unitaire` | DECIMAL(12,2) | Prix |
| `devise` | TEXT | XAF / USD / EUR |
| `unite` | TEXT | kg / L / pièce… |
| `quantite_disponible` | INTEGER | Stock |
| `pays_origine` | CHAR(2) | Pays de production |
| `images` | TEXT[] | Tableau d'URLs d'images |
| `tags` | TEXT[] | Étiquettes de recherche |
| `is_published` | BOOLEAN | Visible sur marketplace |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

#### Table `chambres_commerce` (Données de référence)
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID (PK) | |
| `nom` | TEXT | Nom officiel |
| `pays` | CHAR(2) | Pays |
| `ville` | TEXT | Ville |
| `email` | TEXT | Contact |
| `telephone` | TEXT | Téléphone |
| `agent_count` | INTEGER | Nombre d'agents |

**Données pré-chargées** : 7 chambres de commerce CEMAC (Cameroun, Gabon, Congo, Tchad, Centrafrique, Guinée Équatoriale)

#### Table `corridors` (Voies logistiques)
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID (PK) | |
| `route` | TEXT | Description : "Douala → Bangui" |
| `mode` | TEXT | Route / Maritime / Aérien / Ferroviaire / Mixte |
| `days` | TEXT | Durée estimée : "5-7j" |
| `status` | TEXT | Opérationnel / Ralenti / Bloqué / En maintenance |

#### Table `logistics_alerts` (Alertes temps réel)
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID (PK) | |
| `country` | CHAR(2) | Pays concerné |
| `message` | TEXT | Message d'alerte |
| `type` | TEXT | info / warning / danger |
| `is_active` | BOOLEAN | Alerte active |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

### 5.2 Index de performance

```sql
idx_entreprises_owner       ON entreprises(owner_id)
idx_entreprises_pays        ON entreprises(pays)
idx_certifications_ent      ON certifications(entreprise_id)
idx_certifications_statut   ON certifications(statut)
idx_certifications_num      ON certifications(numero_dossier)
idx_documents_cert          ON documents(certification_id)
idx_workflow_cert           ON workflow_events(certification_id)
idx_produits_entreprise     ON produits(entreprise_id)
idx_produits_published      ON produits(is_published)
```

### 5.3 Triggers automatiques

| Trigger | Événement | Action |
|---------|-----------|--------|
| `update_updated_at` | BEFORE UPDATE sur toutes les tables | Met à jour `updated_at` automatiquement |
| `handle_new_user` | AFTER INSERT sur auth.users | Crée un enregistrement dans `profiles` |

### 5.4 Séquences

| Séquence | Usage |
|----------|-------|
| `cert_seq` | Auto-incrémente les numéros de dossier certifications |

### 5.5 Historique des migrations

| Fichier | Contenu |
|---------|---------|
| `001_initial_schema.sql` | Schéma de base (tables, index, triggers) |
| `002_rls_policies.sql` | Politiques RLS, fonctions helpers, seed chambres de commerce |
| `003_seed_products.sql` | Données de démo : 6 entreprises, 25 produits marketplace |
| `004_fix_auth_identities.sql` | Comptes admins (super_admin, cemac_officer, auditor) |
| `005_corridors_alerts.sql` | Tables corridors et alertes logistiques + données initiales |
| `006_harden_rls_and_subscription_plan.sql` | RLS renforcé, fonction `can_access_certification`, normalisation plans |
| `006_notification_preferences.sql` | Colonne JSONB `notification_preferences` dans profiles |
| `007_storage_buckets.sql` | Bucket `product-images` (5 Mo max, images uniquement) |

---

## 6. AUTHENTIFICATION ET CONTRÔLE D'ACCÈS

### 6.1 Mécanisme d'authentification

- **Fournisseur** : Supabase Auth (email / mot de passe)
- **Tokens** : JWT, gérés automatiquement par le client Supabase
- **Store frontend** : Zustand (`useAuthStore`) avec persistance localStorage (données non sensibles uniquement)
- **Initialisation** : Écoute `onAuthStateChange` → charge profil + entreprise sur `INITIAL_SESSION` et `SIGNED_IN`

### 6.2 Flux d'inscription

```
Formulaire RegisterPage
  → email + password + full_name + phone + country + company_name + sector
  → supabase.auth.signUp()
  → Trigger handle_new_user → INSERT INTO profiles
  → INSERT INTO entreprises (owner_id = user.id)
  → Redirection /dashboard
```

### 6.3 Flux de connexion

```
LoginPage → supabase.auth.signInWithPassword()
  → onAuthStateChange(SIGNED_IN) → initialize()
  → SELECT FROM profiles WHERE id = user.id
  → SELECT FROM entreprises WHERE owner_id = user.id
  → Hydrate useAuthStore
  → Redirection /dashboard
```

### 6.4 Flux de réinitialisation de mot de passe

```
ForgotPasswordPage → supabase.auth.resetPasswordForEmail()
  → Email envoyé avec lien magique
  → ResetPasswordPage → supabase.auth.updateUser({ password })
```

### 6.5 Rôles et permissions

| Rôle | Accès certifications | Accès marketplace | Accès logistique | Accès admin |
|------|---------------------|-------------------|-----------------|-------------|
| `super_admin` | Tout (lecture/écriture/suppression) | Tout | Tout | Oui |
| `cemac_officer` | Toutes les certifications CEMAC | Lecture + publication | Tout | Non |
| `chamber_agent` | Certifications de son pays uniquement | Lecture | Lecture | Non |
| `company_admin` | Ses propres certifications | Lecture + publication produits | Lecture | Non |
| `auditor` | Dossiers en révision uniquement | Lecture | Lecture | Non |
| `buyer` | Certifications approuvées (lecture) | Lecture | Lecture | Non |
| `logistics_agent` | Certifications approuvées (lecture) | Lecture | Tout | Non |
| `public` | Certifications approuvées (lecture) | Lecture | Non | Non |

### 6.6 Row Level Security (RLS)

Toutes les tables ont RLS activé. Les politiques clés :

**profiles** :
- SELECT : utilisateur voit son propre profil ; admins voient tout
- UPDATE : utilisateur modifie son propre profil uniquement

**entreprises** :
- SELECT : propriétaire voit la sienne ; public voit les entreprises vérifiées ; agents/officiers voient toutes les vérifiées
- INSERT : rôle company_admin uniquement
- UPDATE : propriétaire ou admin

**certifications** :
- SELECT : propriétaire voit ses brouillons ; certifications approuvées/expirées/suspendues sont publiques ; agents limités à leur pays ; auditeurs limités aux statuts under_review/field_validation
- Helpers : `get_my_role()`, `get_my_country()`, `can_access_certification(uuid)`

**produits** :
- SELECT : publiés visibles à tous ; non publiés visibles au propriétaire uniquement
- INSERT/UPDATE/DELETE : propriétaire de l'entreprise uniquement

**corridors / logistics_alerts** :
- SELECT : public (tout le monde)
- INSERT/UPDATE/DELETE : super_admin uniquement

### 6.7 Protection des routes frontend

Le composant `ProtectedRoute` :
1. Vérifie la présence d'une session active (sinon → `/auth/login`)
2. Si `requiredRoles` est fourni, vérifie que le rôle de l'utilisateur y figure (sinon → `/dashboard`)
3. Enveloppe les layouts et pages sensibles

---

## 7. MODULE CERTIFICATION

### 7.1 Types de certification

| Type | Description | Critère clé |
|------|-------------|------------|
| `made_in_cemac` | Produit fabriqué localement | Valeur ajoutée locale ≥ 40% |
| `origine_cemac` | Règles d'origine régionales CEMAC | Conformité aux règles d'origine |
| `qualite_plus` | Certification qualité supérieure | Audit qualité validé |

### 7.2 Workflow en 9 étapes

```
draft ──► submitted ──► under_review ──► field_validation ──► commission_review
                                                                      │
                                         ┌────────────────────────────┤
                                         ▼            ▼               ▼
                                      approved     rejected        (retour)
                                         │
                                    ─────┴─────
                                   │           │
                               suspended    expired
```

| Statut | Acteur | Description |
|--------|--------|-------------|
| `draft` | company_admin | Brouillon en cours de rédaction |
| `submitted` | company_admin | Dossier soumis officiellement |
| `under_review` | chamber_agent | Examen initial par la chambre |
| `field_validation` | auditor | Visite terrain / audit |
| `commission_review` | cemac_officer | Examen en commission CEMAC |
| `approved` | cemac_officer | Certification délivrée |
| `rejected` | cemac_officer | Dossier refusé |
| `suspended` | super_admin | Certification suspendue |
| `expired` | Système | Certification arrivée à échéance |

### 7.3 Numérotation automatique

Format : `CI-YYYY-XXXXX`  
Exemple : `CI-2026-00042`  
Généré via la séquence PostgreSQL `cert_seq`.

### 7.4 Journal d'audit (workflow_events)

Chaque transition de statut génère un événement immuable :
- Ancien statut, nouveau statut
- Commentaire de l'acteur
- Identité de l'acteur (`created_by`)
- Horodatage (jamais modifiable)

### 7.5 Documents justificatifs

Types acceptés :
- `statuts` — Statuts de la société
- `registre_commerce` — Registre du commerce
- `bilan` — Bilan financier
- `factures` — Factures fournisseurs
- `rapport_audit` — Rapport d'audit qualité
- `photos_produit` — Photos du produit
- `certificat_qualite` — Certificats de qualité tiers
- `autre` — Tout autre document

Stockage : Supabase Storage (bucket dédié)  
RLS Storage : Accès conditionnel par rôle et appartenance au dossier

### 7.6 QR Code anti-contrefaçon

- Généré à l'approbation du dossier
- Contenu : URL vers `/verify/:id`
- Stocké : Supabase Storage + colonne `qr_code_url`
- Page de vérification publique : affiche les détails de la certification, l'entreprise, et le statut

### 7.7 Interface utilisateur

**CertificationListPage** :
- Tableau paginé des dossiers
- Filtres par statut, type, pays
- Badge coloré par statut (StatusBadge)
- Actions rapides (voir, éditer)

**NewCertificationPage** :
- Formulaire multi-étapes (React Hook Form + Zod)
- Upload de documents glisser-déposer
- Validation côté client

**CertificationDetailPage** :
- Vue complète du dossier
- Historique workflow (timeline)
- Actions conditionnelles selon rôle (soumettre, approuver, rejeter)
- Téléchargement QR Code + PDF

---

## 8. MODULE MARKETPLACE

### 8.1 Catalogue public (`/marketplace-public`)

- Accessible sans authentification
- Tous les produits `is_published = true`
- Filtres : pays d'origine, catégorie, statut certification
- Affichage : grille de cartes produits

### 8.2 Marketplace authentifiée (`/marketplace`)

- Même catalogue + fonctionnalités supplémentaires
- Bouton de contact fournisseur (mailto:)
- Lien vers détail produit (`/marketplace/:id`)

### 8.3 Détail produit (`/marketplace/:id`)

- Galerie d'images
- Description complète + métadonnées
- Informations de l'entreprise vendeur
- Certification liée (si applicable) avec lien vers vérification
- Prix (XAF/USD/EUR), unité, stock disponible

### 8.4 Gestion des produits (`/products`) — company_admin

- CRUD complet des produits de l'entreprise
- Upload d'images (Supabase Storage `product-images`, 5 Mo max par image)
- Liaison optionnelle à une certification existante
- Toggle publication/dépublication
- Validation via React Hook Form + Zod

---

## 9. MODULE LOGISTIQUE

### 9.1 Corridors de transit

Données affichées :
- Route textuelle (ex. "Douala → Bangui")
- Mode de transport (Route / Maritime / Aérien / Ferroviaire / Mixte)
- Durée estimée
- Statut opérationnel avec code couleur :
  - 🟢 Opérationnel
  - 🟡 Ralenti
  - 🔴 Bloqué
  - ⚫ En maintenance

### 9.2 Alertes logistiques

- Alertes par pays CEMAC
- Niveaux : `info` (bleu) / `warning` (orange) / `danger` (rouge)
- Activables / désactivables par super_admin
- Affichées en temps réel sur le tableau de bord logistique

### 9.3 Certificats EUR.1

- Génération de certificats de transit EUR.1 numériques
- Champs : importateur, exportateur, désignation des marchandises, pays de destination
- Export PDF via jspdf

### 9.4 Traçabilité documentaire

- Suivi des convois
- Historique des passages frontières

---

## 10. MODULE INTELLIGENCE DE MARCHÉ

### 10.1 Données en temps réel

| Source | Données | Fallback |
|--------|---------|---------|
| Frankfurter API | Taux de change EUR/XAF, USD/XAF | Données statiques pré-chargées |
| World Bank Data API | Prix des matières premières | Données statiques pré-chargées |

### 10.2 Tableaux de bord analytiques (Recharts)

Dashboards adaptés par rôle :

| Rôle | Dashboard | Métriques clés |
|------|-----------|---------------|
| `company_admin` | CompanyDashboard | Certifications actives, produits publiés, vues marketplace |
| `auditor` | AuditorDashboard | Dossiers en attente de révision, délais moyens |
| `buyer` | BuyerDashboard | Produits favoris, dernières certifications approuvées |
| `logistics_agent` | LogisticsDashboard | Statut corridors, alertes actives, taux d'opérationnalité |
| `super_admin` / `cemac_officer` | CemacDashboard | Métriques globales CEMAC (certifications, pays, secteurs) |
| `chamber_agent` | ChamberDashboard | Certifications de son pays, délais de traitement |

---

## 11. MODULE ADMINISTRATION

### 11.1 Accès

Réservé au rôle `super_admin` via `/admin`.

### 11.2 Fonctionnalités

- **Gestion des utilisateurs** : liste, modification de rôle, suspension
- **Gestion des entreprises** : vérification (`is_verified`), visualisation
- **Gestion des certifications** : vue globale, actions de supervision
- **Paramétrage des alertes logistiques** : création, activation/désactivation
- **Supervision des corridors** : mise à jour des statuts

---

## 12. MODULE PARAMÈTRES & ABONNEMENTS

### 12.1 Paramètres de profil (`/settings`)

- Modification : nom, téléphone, pays, langue préférée, avatar
- Modification du mot de passe
- Préférences de notifications (JSONB)

### 12.2 Paramètres entreprise

- Modification : raison sociale, sigle, secteur, adresse, email, téléphone, site web
- Upload du logo

### 12.3 Plans tarifaires

| Plan | ID | Prix mensuel | Prix annuel | Caractéristiques principales |
|------|-----|-------------|------------|------------------------------|
| **Starter** | `free` | 0 XAF | 0 XAF | 2 certifications/mois, 1 utilisateur, marketplace lecture, QR basique, support communauté |
| **Pro** | `sme` | 29 000 XAF | 270 000 XAF | Certifications illimitées, 5 utilisateurs, marketplace publication, QR professionnel, intelligence de marché basique, export PDF, support email 48h |
| **Enterprise** | `enterprise` | 99 000 XAF | 900 000 XAF | Utilisateurs illimités, marketplace premium, intelligence de marché complète, module logistique, API REST + webhooks, export XML/JSON/PDF, support 24/7, account manager |
| **Institutionnel** | `institutional` | Sur devis | Sur devis | Personnalisation complète |

### 12.4 Flux de paiement Stripe

```
SettingsPage → Clic "Passer au plan Pro/Enterprise"
  → POST /functions/v1/create-checkout-session { plan, success_url, cancel_url }
  → Edge Function : valide auth → résout Stripe Price ID (env vars)
  → Crée Stripe Checkout Session { metadata: { supabase_user_id, plan } }
  → Retourne { url } → Redirection vers Stripe Checkout

Stripe (paiement) → Webhook POST /functions/v1/stripe-webhook
  → Vérifie signature Stripe (STRIPE_WEBHOOK_SECRET)
  → checkout.session.completed → UPDATE entreprises SET subscription_plan = plan
  → customer.subscription.deleted → UPDATE entreprises SET subscription_plan = 'free'
```

---

## 13. PAGES VITRINE (LANDING)

### 13.1 Structure

Toutes les pages vitrine utilisent `LandingLayout` (LandingNav + LandingFooter).

| Page | URL | Contenu |
|------|-----|---------|
| LandingPage | `/` | Hero, présentation modules, témoignages, CTA |
| PricingPage | `/tarifs` | Grille tarifaire complète avec comparatif features |
| AboutPage | `/a-propos` | Mission, équipe, chiffres CEMAC |
| ContactPage | `/contact` | Formulaire de contact |

### 13.2 Navigation vitrine (LandingNav)

- Logo CEMAC INTEGRA
- Liens : Accueil, Tarifs, À propos, Contact, Marketplace
- Sélecteur de langue (FR/EN)
- Boutons : Connexion, Commencer gratuitement

### 13.3 Pied de page (LandingFooter)

- Liens institutionnels
- Liens réseaux sociaux
- Copyright

---

## 14. INTERNATIONALISATION

### 14.1 Configuration

- **Librairie** : react-i18next
- **Langues supportées** : Français (fr) — langue par défaut, Anglais (en)
- **Détection** : Basée sur la préférence du profil utilisateur (`profiles.language`)
- **Fichiers** : `apps/web/src/i18n/en.json` et `fr.json`

### 14.2 Couverture

- Toute l'interface utilisateur (menus, labels, messages)
- Formulaires et messages de validation
- Messages d'erreur
- Pages vitrine
- Notifications toast
- Contenu des tableaux de bord
- Credentials de démonstration

---

## 15. TESTS ET QUALITÉ

### 15.1 Tests unitaires et composants (Vitest)

- **Framework** : Vitest + React Testing Library
- **Configuration** : `apps/web/vitest.config.ts`
- **Couverture** : 175 tests — tous au vert ✅
- **Fichiers de tests** : `apps/web/src/__tests__/`

| Fichier test | Couverture |
|-------------|------------|
| `auth.store.test.ts` | Store Zustand (authentification, rôles) |
| `constants.test.ts` | Constantes (pays, statuts, rôles) |
| `utils.test.ts` | Fonctions utilitaires |
| `CertificationListPage.test.tsx` | Liste des certifications |
| `CertificationDetail.workflow.test.tsx` | Workflow certification |
| `DashboardPage.test.tsx` | Tableau de bord |
| `LandingNav.test.tsx` | Navigation vitrine |
| `LoginPage.test.tsx` | Page de connexion |
| `RegisterPage.test.tsx` | Page d'inscription |
| `SettingsPage.test.tsx` | Page paramètres |

### 15.2 Tests E2E (Playwright)

- **Configuration** : `apps/web/playwright.config.ts`
- **Fichiers** : `apps/web/tests/e2e/`

| Fichier | Scénarios |
|---------|-----------|
| `accessibility.spec.ts` | Conformité accessibilité (WCAG) |
| `certification.spec.ts` | Flux complet certification |
| `logistics.spec.ts` | Flux logistique |
| `marketplace.spec.ts` | Flux marketplace |
| `registration.spec.ts` | Inscription utilisateur |

### 15.3 Tests de charge (k6)

| Fichier | Usage |
|---------|-------|
| `k6/smoke-test.js` | Test rapide (quelques utilisateurs) |
| `k6/load-test.js` | Test de montée en charge |

### 15.4 Qualité du code

- **TypeScript strict** : `tsconfig.app.json` — 0 erreur de compilation
- **Linting** : ESLint configuré
- **CI/CD** : GitHub Actions (lint + type-check + build à chaque push)

---

## 16. DÉPLOIEMENT ET INFRASTRUCTURE

### 16.1 Frontend (Vercel)

```json
// vercel.json (root)
{
  "buildCommand": "cd apps/web && npm run build",
  "outputDirectory": "apps/web/dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Variables d'environnement requises :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_SENTRY_DSN`

### 16.2 Backend (Supabase)

- Project ID : `dotzvdrbondrybjkqqzd`
- Migrations versionnées dans `supabase/migrations/`
- Edge Functions déployées via Supabase CLI

Variables d'environnement Edge Functions :
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID_SME`
- `STRIPE_PRICE_ID_ENTERPRISE`

### 16.3 Packages (monorepo)

```
package.json (root)
  └── workspaces: ["apps/web"]
apps/web/package.json
  └── scripts: dev, build, preview, test, test:e2e, lint, type-check
```

---

## 17. SÉCURITÉ

### 17.1 Mesures implémentées

| Couche | Mesure |
|--------|--------|
| Base de données | RLS PostgreSQL sur toutes les tables |
| API | Service role key uniquement dans Edge Functions (jamais exposée au frontend) |
| Auth | JWT Supabase, expiration automatique |
| Paiement | Vérification signature webhook Stripe (`constructEvent`) |
| Storage | Politiques RLS sur bucket `product-images` |
| Frontend | `ProtectedRoute` double vérification (session + rôle) |
| Formulaires | Validation Zod côté client ET contraintes DB côté serveur |
| Erreurs | GlobalErrorBoundary (pas de stack trace exposée en production) |
| Monitoring | Sentry (erreurs front uniquement, données sensibles masquées) |

### 17.2 Conformité OWASP Top 10

- **Injection** : Requêtes préparées via client Supabase (pas de SQL dynamique côté client)
- **Authentification** : JWT géré par Supabase Auth, pas de sessions personnalisées
- **Exposition données sensibles** : Aucune clé secrète dans le bundle frontend
- **Contrôle d'accès** : RLS + ProtectedRoute (défense en profondeur)
- **Mauvaise configuration** : Variables d'environnement, pas de credentials en dur (sauf URL Supabase publique)
- **XSS** : React échappe automatiquement le HTML ; dangerouslySetInnerHTML non utilisé
- **CSRF** : Supabase JWT protège les mutations d'état

---

## 18. ÉVOLUTIONS FUTURES

Les fonctionnalités suivantes sont identifiées comme évolutions potentielles :

### 18.1 Court terme
- Notifications push / email (webhook Supabase → Resend/SendGrid)
- Export des certifications en XML (standard douanier)
- Module de messagerie interne entreprise ↔ agent
- Tableaux de bord analytics avancés (heat maps, comparaisons pays)

### 18.2 Moyen terme
- Application mobile (React Native ou PWA)
- Intégration API douanière CEMAC directe
- Module de pré-évaluation IA de l'éligibilité à la certification
- Système de notation vendeurs marketplace
- Paiement mobile money (MTN MoMo, Orange Money) pour la zone CEMAC

### 18.3 Long terme
- Extension CEDEAO / UA (marchés d'Afrique de l'Ouest et continentale)
- Blockchain pour l'immutabilité des certificats
- API ouverte pour intégration ERP des grandes entreprises
- Module statistiques officielles CEMAC exportables

---

## ANNEXES

### A. Constantes applicatives

```typescript
APP_NAME    = 'CEMAC INTEGRA'
APP_VERSION = '2.0.0'
SUPABASE_URL = 'https://dotzvdrbondrybjkqqzd.supabase.co'
```

### B. Secteurs d'activité supportés

Agro-alimentaire, Bois & Forêt, Textile & Confection, Mines & Métallurgie, Chimie & Pharmacie, Construction & BTP, Services & Conseil, Transport & Logistique, Technologie & Innovation, Autre

### C. Comptes de démonstration

| Rôle | Usage |
|------|-------|
| super_admin | Accès total plateforme |
| cemac_officer | Commission de certification CEMAC |
| auditor | Audit terrain des dossiers |
| company_admin | Entreprise demanderesse (créé à l'inscription) |
| buyer | Acheteur marketplace |
| logistics_agent | Gestion corridors |
| chamber_agent | Agent chambre de commerce (pays-scoped) |

### D. Limites techniques connues

- Le serveur Vite local monte souvent sur le port 5179 (5173–5178 fréquemment occupés)
- Les diagnostics TypeScript sur `src/__tests__/` dans l'éditeur sont des faux positifs liés au tsconfig de tests séparé (`tsconfig.test.json`) — la compilation `tsc --noEmit` passe sans erreur
- Fallback automatique vers données statiques si les APIs externes (Frankfurter, World Bank) sont indisponibles

---

*Document généré automatiquement à partir de l'état réel du code source — CEMAC INTEGRA v2.0.0 — 27 avril 2026*
