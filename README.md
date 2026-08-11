# CEMAC INTEGRA

**Plateforme numérique de certification, commerce et logistique pour l'espace CEMAC**

CEMAC INTEGRA est une application web full-stack qui digitalise les processus d'obtention de certifications d'origine (Made in CEMAC, Origine CEMAC, Qualité+), de commerce inter-CEMAC et de logistique pour les 6 pays de la zone : Cameroun, Gabon, Congo, Tchad, Centrafrique, Guinée Équatoriale.

---

## Table des matières

1. [Fonctionnalités](#fonctionnalités)
2. [Stack technique](#stack-technique)
3. [Architecture du projet](#architecture-du-projet)
4. [Base de données](#base-de-données)
5. [Rôles utilisateurs](#rôles-utilisateurs)
6. [Routes de l'application](#routes-de-lapplication)
7. [Variables d'environnement](#variables-denvironnement)
8. [Installation et démarrage](#installation-et-démarrage)
9. [Tests](#tests)
10. [Déploiement](#déploiement)
11. [CI/CD](#cicd)
12. [Comptes administrateurs](#comptes-administrateurs)

---

## Fonctionnalités

### Certification d'origine
- Dépôt de dossiers de certification (Made in CEMAC, Origine CEMAC, Qualité+)
- Workflow en 9 étapes : Brouillon → Soumis → En révision → Validation terrain → Commission CEMAC → Approuvé / Rejeté / Suspendu / Expiré
- Génération automatique de QR Code anti-contrefaçon sur approbation
- Page de vérification publique des certificats via QR Code (`/verify/:id`)
- Upload de documents justificatifs (statuts, registre du commerce, bilans, photos produit, certificats qualité…) vers Supabase Storage
- Audit trail immuable (table `workflow_events`)
- Numéros de dossier auto-générés : `CI-YYYY-XXXXX`

### Marketplace panafricaine
- Catalogue de produits certifiés issus des 6 pays CEMAC
- Fiche produit complète : image, badges, prix, stock, tags, informations fournisseur, certifications actives
- Filtres par pays, catégorie, statut certification
- Navigation publique (`/marketplace-public`) et espace connecté (`/marketplace`)
- Gestion de ses propres produits (CRUD) pour les `company_admin` (`/products`)
- Contact fournisseur via `mailto:` intégré

### Authentification & profils
- Inscription / Connexion par email+mot de passe (Supabase Auth)
- Mot de passe oublié + réinitialisation complète (`/auth/reset-password`)
- Profil utilisateur avec rôle, pays, langue
- Gestion des entreprises rattachées

### Logistique & transit
- Calculateur règles d'origine
- Certificats EUR.1 numériques avec génération PDF (format formaté complet : importateur, exportateur, marchandises, visas)
- Suivi d'expéditions en temps réel

### Market Intelligence
- Tableaux de bord statistiques (Recharts)
- Données commerciales CEMAC interconnectées avec API tierces :
  - Taux de change EUR/XAF ou USD/XAF en temps réel (Frankfurter API)
  - Données sur les matières premières (World Bank Data API)
- Mécanisme de fallback avec données statiques en cas d'indisponibilité de l'API

### Abonnements & Paiements (Stripe)
- Intégration de Stripe Checkout pour la souscription aux plans (Pro, Enterprise)
- Edge Function Supabase (`create-checkout-session`) pour générer les liens de paiement sécurisés
- Mise à niveau du plan dans la page "Paramètres" (`SettingsPage`)

### Administration
- Back-office `super_admin` : gestion des utilisateurs, entreprises, certifications
- Gestion des chambres de commerce

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework UI | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v3 + class-variance-authority |
| Composants | Radix UI (Dialog, Select, Tabs, Avatar, Toast…) |
| Icônes | Lucide React |
| Animations | Framer Motion |
| Graphiques | Recharts |
| Routing | React Router DOM v6 |
| État global | Zustand (persisté) |
| Requêtes serveur | TanStack Query v5 |
| Formulaires | React Hook Form + Zod |
| Backend / BDD | Supabase (PostgreSQL + Auth + Storage + RLS + Edge Functions) |
| QR Code | `qrcode` + `html5-qrcode` |
| PDF | `jspdf` |
| Monétisation | Stripe Checkout (`@stripe/stripe-js`) |
| i18n | react-i18next (FR / EN) |
| Notifications | react-hot-toast |
| Dates | date-fns |
| Tests unitaires | Vitest + React Testing Library |
| Tests E2E | Playwright |
| Tests de charge | k6 |
| Déploiement | Vercel |
| CI/CD | GitHub Actions |

---

## Architecture du projet

```
CEMAC-INTEGRA/                      ← Monorepo npm workspaces
├── apps/
│   └── web/                        ← Application React (@cemac/web)
│       ├── src/
│       │   ├── App.tsx             ← Routeur principal
│       │   ├── main.tsx
│       │   ├── components/
│       │   │   ├── landing/        ← Layout & nav publics
│       │   │   ├── layout/         ← AppLayout, Sidebar, Header, ProtectedRoute
│       │   │   ├── shared/         ← LoadingSpinner, StatusBadge
│       │   │   └── ui/             ← Composants génériques (button, card, input…)
│       │   ├── i18n/               ← Traductions FR/EN
│       │   ├── lib/
│       │   │   ├── constants.ts    ← Statuts, rôles, pays CEMAC, plans
│       │   │   ├── supabase.ts     ← Client Supabase
│       │   │   └── utils.ts        ← Helpers (cn, formatDate…)
│       │   ├── pages/
│       │   │   ├── admin/
│       │   │   ├── auth/           ← Login, Register, ForgotPassword, ResetPassword
│       │   │   ├── certification/  ← List, Detail, New
│       │   │   ├── dashboard/
│       │   │   ├── landing/        ← LandingPage, About, Contact, Pricing
│       │   │   ├── logistics/
│       │   │   ├── market-intelligence/
│       │   │   ├── marketplace/    ← MarketplacePage, MarketplaceProductDetailPage
│       │   │   ├── products/       ← ProductsPage (CRUD company_admin)
│       │   │   ├── settings/       ← Gérer compte, Stripe checkout, etc.
│       │   │   └── verify/         ← VerifyCertificationPage (Page publique QR code)
│       │   ├── stores/
│       │   │   └── auth.store.ts   ← Zustand : session, profil, entreprise, rôle
│       │   ├── types/
│       │   │   ├── index.ts        ← Types TS (Profile, Entreprise, Certification…)
│       │   │   └── database.types.ts
│       │   └── __tests__/         ← Tests unitaires & composants
│       ├── tests/e2e/              ← Tests Playwright (E2E)
│       ├── vitest.config.ts
│       ├── playwright.config.ts
│       ├── tailwind.config.ts
│       └── vite.config.ts
├── supabase/
│   ├── functions/
│   │   ├── _shared/
│   │   └── create-checkout-session/ ← Endpoint Stripe appelé par SettingsPage
│   └── migrations/
│       ├── 001_initial_schema.sql  ← Tables, index, triggers
│       ├── 002_rls_policies.sql    ← Politiques Row Level Security
│       ├── 003_seed_data.sql       ← Données initiales (si présent)
│       └── 004_fix_auth_identities.sql ← Création comptes admins
├── k6/
│   ├── load-test.js                ← Test de charge (200 VUs)
│   └── smoke-test.js               ← Smoke test rapide
├── vercel.json                     ← Configuration déploiement Vercel
├── .github/workflows/deploy.yml   ← Pipeline CI/CD GitHub Actions
└── package.json                    ← Workspaces npm (node ≥20, npm ≥10)
```

---

## Base de données

### Tables principales (PostgreSQL via Supabase)

| Table | Description |
|---|---|
| `profiles` | Extension de `auth.users` — rôle, pays, langue |
| `chambres_commerce` | Chambres consulaires des 6 pays |
| `entreprises` | Sociétés membres, plan d'abonnement, chambre associée |
| `certifications` | Dossiers de certification avec workflow complet |
| `documents` | Fichiers justificatifs liés à une certification |
| `workflow_events` | Audit trail immuable des changements de statut |
| `produits` | Catalogue Marketplace (prix, stock, tags, images) |

### Storage Supabase

| Bucket | Usage |
|---|---|
| `certification-docs` | Documents justificatifs (statuts, bilans, photos…) — max 10 Mo |

### Politiques RLS

Toutes les tables sont protégées par Row Level Security :
- **Lecture** : publique pour les données non-sensibles (produits publiés, certifications approuvées)
- **Écriture** : restreinte au propriétaire + rôles autorisés
- **Admin** : `super_admin` et `cemac_officer` ont accès total

---

## Rôles utilisateurs

| Rôle | Description | Accès |
|---|---|---|
| `super_admin` | Administrateur plateforme | Tout |
| `cemac_officer` | Agent CEMAC | Certifications, entreprises, audit |
| `chamber_agent` | Agent chambre de commerce | Dossiers de sa chambre |
| `company_admin` | Responsable entreprise | Ses certifications, ses produits |
| `auditor` | Auditeur technique | Lecture, inspection terrain |
| `buyer` | Acheteur | Marketplace, demandes de contact |
| `logistics_agent` | Agent logistique | Module logistique |
| `public` | Visiteur non inscrit | Pages publiques uniquement |

---

## Routes de l'application

### Pages publiques (sans authentification)

| Route | Page |
|---|---|
| `/` | Page d'accueil (LandingPage) |
| `/tarifs` | Plans et tarification |
| `/a-propos` | À propos de CEMAC INTEGRA |
| `/contact` | Formulaire de contact |
| `/marketplace-public` | Marketplace en lecture seule |
| `/auth/login` | Connexion |
| `/auth/register` | Inscription |
| `/auth/forgot-password` | Mot de passe oublié |
| `/auth/reset-password` | Réinitialisation mot de passe |
| `/verify/:id` | Page de vérification publique via scan QR Code |

### Pages protégées (authentification requise)

| Route | Page | Rôles |
|---|---|---|
| `/dashboard` | Tableau de bord | Tous |
| `/certifications` | Liste des certifications | Tous |
| `/certifications/new` | Nouveau dossier | `company_admin` |
| `/certifications/:id` | Détail + upload docs | Tous |
| `/marketplace` | Marketplace connectée | Tous |
| `/marketplace/:id` | Fiche produit détaillée | Tous |
| `/products` | Gestion produits (CRUD) | `company_admin` |
| `/logistics` | Module logistique | `logistics_agent`, admin |
| `/market-intelligence` | Analyses de marché | Tous |
| `/admin` | Back-office administration | `super_admin`, `cemac_officer` |
| `/settings` | Paramètres du compte | Tous |

---

## Variables d'environnement

Créer un fichier `apps/web/.env` à partir de `.env.example` :

```env
VITE_SUPABASE_URL=https://<votre-projet>.supabase.co
VITE_SUPABASE_ANON_KEY=<votre-clé-anon>
VITE_APP_ENV=development

# Configuration Stripe pour les abonnements
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_votreclepublique
VITE_STRIPE_PRICE_SME=price_1XYZ
VITE_STRIPE_PRICE_ENTERPRISE=price_2XYZ
```

> **Note :** Le fichier `.env` est dans `.gitignore` et ne sera jamais commité. Pour la production, les variables sont dans `vercel.json` et dans les secrets GitHub Actions.

---

## Installation et démarrage

### Prérequis

- Node.js ≥ 20.0.0
- npm ≥ 10.0.0

### Démarrage local

```bash
# Cloner le dépôt
git clone https://github.com/Jelkafi/CEMAC-INTEGRA.git
cd CEMAC-INTEGRA

# Installer toutes les dépendances (monorepo)
npm install

# Créer le fichier .env
cp apps/web/.env.example apps/web/.env
# → Remplir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY

# Lancer le serveur de développement
npm run dev
# → http://localhost:5173
```

### Commandes disponibles

```bash
npm run dev          # Serveur de dev Vite
npm run build        # Build de production (tsc + vite build)
npm run preview      # Prévisualisation du build
npm run lint         # ESLint
npm run type-check   # Vérification TypeScript (sans émission)
npm run test         # Tests unitaires (Vitest)
npm run ci           # lint + type-check + build (pipeline CI)
```

---

## Tests

### Tests unitaires & composants (Vitest)

```bash
cd apps/web

npm run test               # Exécution unique
npm run test:watch         # Mode watch
npm run test:coverage      # Rapport de couverture
npm run test:ui            # Interface Vitest UI
```

Fichiers de tests dans `apps/web/src/__tests__/` :
- `unit/auth.store.test.ts` — Store Zustand
- `unit/constants.test.ts` — Constantes et helpers
- `unit/utils.test.ts` — Fonctions utilitaires
- `components/LoginPage.test.tsx` — Page de connexion
- `components/LandingNav.test.tsx` — Navigation publique
- `components/RegisterPage.test.tsx` — Page d'inscription

### Tests E2E (Playwright)

```bash
npm run test:e2e           # Tous les tests E2E
npm run test:e2e:ui        # Interface Playwright
npm run test:e2e:headed    # Avec navigateur visible
npm run test:a11y          # Tests d'accessibilité uniquement
```

Fichiers dans `apps/web/tests/e2e/` :
- `registration.spec.ts` — Parcours d'inscription complet
- `certification.spec.ts` — Dépôt de dossier de certification
- `accessibility.spec.ts` — Conformité WCAG

### Tests de charge (k6)

```bash
# Smoke test (1 VU, 30s)
k6 run k6/smoke-test.js

# Load test (montée progressive jusqu'à 200 VUs)
k6 run k6/load-test.js
```

---

## Déploiement

L'application est déployée sur **Vercel** avec la configuration suivante (`vercel.json`) :

```json
{
  "buildCommand": "cd apps/web && npm run build",
  "outputDirectory": "apps/web/dist",
  "installCommand": "npm ci",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Les en-têtes de sécurité sont configurés automatiquement :
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- Cache immutable sur les assets statiques (`/assets/*`)

---

## CI/CD

Pipeline GitHub Actions (`.github/workflows/deploy.yml`) déclenché sur `push` et `pull_request` vers `main` / `develop` :

| Job | Description |
|---|---|
| `lint` | Type-check TypeScript + ESLint |
| `unit-tests` | Vitest avec rapport de couverture |
| `build` | Build de production (dépend de lint + unit-tests) |

Les rapports de couverture sont uploadés comme artefacts GitHub (rétention 7 jours).

---

## Comptes administrateurs

Après avoir créé le projet Supabase, exécuter la migration `004_fix_auth_identities.sql` dans le **SQL Editor** du Dashboard Supabase pour créer les comptes par défaut :

| Email | Mot de passe | Rôle |
|---|---|---|
| `admin@cemac-integra.cm` | `Admin@CEMAC2026!` | `super_admin` |
| `officer@cemac-integra.cm` | `Officer@CEMAC2026!` | `cemac_officer` |
| `auditor@cemac-integra.cm` | `Auditor@CEMAC2026!` | `auditor` |

> **Sécurité :** Changer ces mots de passe immédiatement après la première connexion en production.

---

## Plans d'abonnement

| Plan | Prix | Cible |
|---|---|---|
| Free | 0 XAF | Découverte |
| SME | 49 € / mois | PME |
| Enterprise | 299 € / mois | Grandes entreprises |
| Institutional | Sur devis | Chambres, institutions |

---

## Pays couverts

| Pays | Code | Devise |
|---|---|---|
| Cameroun | CM | XAF |
| Gabon | GA | XAF |
| Congo | CG | XAF |
| Tchad | TD | XAF |
| Centrafrique | CF | XAF |
| Guinée Équatoriale | GQ | XAF |

---

## Licence

Propriétaire — © 2026 CEMAC INTEGRA. Tous droits réservés.
