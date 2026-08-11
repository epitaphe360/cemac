import type { CmsTableName } from '../services/cms-admin.service'

export type CmsFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'url'
  | 'email'
  | 'boolean'
  | 'localized'
  | 'json'
  | 'array'
  | 'select'

export interface CmsFieldConfig {
  name: string
  label: string
  type?: CmsFieldType
  required?: boolean
  options?: readonly string[]
  help?: string
}

export interface CmsCollectionConfig {
  table: CmsTableName
  label: string
  group: string
  primaryKey: string
  displayField: string
  publishField?: 'is_published' | 'is_public' | 'is_active'
  orderField?: 'sort_order'
  fields: CmsFieldConfig[]
}

const published = (extra: CmsFieldConfig[] = []): CmsFieldConfig[] => [
  ...extra,
  { name: 'sort_order', label: 'Ordre', type: 'number' },
  { name: 'is_published', label: 'Publié', type: 'boolean' },
]

const localized = (name: string, label: string, required = true): CmsFieldConfig => ({
  name,
  label,
  type: 'localized',
  required,
})

export const CMS_COLLECTIONS: CmsCollectionConfig[] = [
  {
    table: 'site_settings', label: 'Paramètres & coordonnées', group: 'Site',
    primaryKey: 'key', displayField: 'key', publishField: 'is_public',
    fields: [
      { name: 'key', label: 'Clé', required: true },
      { name: 'value', label: 'Valeur JSON', type: 'json', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'is_public', label: 'Public', type: 'boolean' },
    ],
  },
  {
    table: 'content_blocks', label: 'Blocs landing / about / footer / logistics', group: 'Site',
    primaryKey: 'id', displayField: 'key', publishField: 'is_published', orderField: 'sort_order',
    fields: published([
      { name: 'page', label: 'Page', type: 'select', options: ['landing', 'about', 'footer', 'logistics'], required: true },
      { name: 'section', label: 'Section', required: true },
      { name: 'key', label: 'Clé', required: true },
      { name: 'locale', label: 'Langue', type: 'select', options: ['fr', 'en'], required: true },
      { name: 'content', label: 'Contenu JSON', type: 'json', required: true },
      { name: 'media_url', label: 'Média (URL)', type: 'url' },
    ]),
  },
  {
    table: 'team_members', label: 'Équipe', group: 'À propos',
    primaryKey: 'id', displayField: 'full_name', publishField: 'is_published', orderField: 'sort_order',
    fields: published([
      { name: 'slug', label: 'Slug', required: true },
      { name: 'full_name', label: 'Nom complet', required: true },
      localized('role', 'Fonction'),
      { name: 'country_code', label: 'Code pays' },
      localized('country_label', 'Pays', false),
      { name: 'initials', label: 'Initiales' },
      { name: 'photo_url', label: 'Photo (URL)', type: 'url' },
    ]),
  },
  {
    table: 'partners', label: 'Partenaires', group: 'À propos',
    primaryKey: 'id', displayField: 'name', publishField: 'is_published', orderField: 'sort_order',
    fields: published([
      { name: 'slug', label: 'Slug', required: true },
      { name: 'name', label: 'Nom', required: true },
      localized('description', 'Description', false),
      { name: 'logo_url', label: 'Logo (URL)', type: 'url' },
      { name: 'website_url', label: 'Site web', type: 'url' },
    ]),
  },
  {
    table: 'milestones', label: 'Jalons', group: 'À propos',
    primaryKey: 'id', displayField: 'slug', publishField: 'is_published', orderField: 'sort_order',
    fields: published([
      { name: 'slug', label: 'Slug', required: true },
      { name: 'year', label: 'Année', type: 'number', required: true },
      localized('title', 'Titre'),
      localized('description', 'Description'),
    ]),
  },
  {
    table: 'marketing_stats', label: 'Statistiques marketing', group: 'À propos',
    primaryKey: 'key', displayField: 'key', publishField: 'is_published', orderField: 'sort_order',
    fields: published([
      { name: 'key', label: 'Clé', required: true },
      localized('label', 'Libellé'),
      localized('display_value', 'Valeur affichée'),
      { name: 'numeric_value', label: 'Valeur numérique', type: 'number' },
      { name: 'source', label: 'Source' },
    ]),
  },
  {
    table: 'pricing_plans', label: 'Tarifs', group: 'Tarification',
    primaryKey: 'id', displayField: 'id', publishField: 'is_published', orderField: 'sort_order',
    fields: published([
      { name: 'id', label: 'Identifiant du plan', required: true },
      localized('name', 'Nom'),
      localized('description', 'Description'),
      { name: 'monthly_price', label: 'Prix mensuel HT', type: 'number' },
      { name: 'yearly_price', label: 'Prix annuel HT', type: 'number' },
      { name: 'currency', label: 'Devise', required: true },
      localized('badge', 'Badge', false),
      { name: 'cta', label: 'CTA JSON bilingue', type: 'json', required: true },
    ]),
  },
  {
    table: 'pricing_plan_features', label: 'Fonctionnalités des tarifs', group: 'Tarification',
    primaryKey: 'id', displayField: 'feature_key', orderField: 'sort_order',
    fields: [
      { name: 'plan_id', label: 'Plan', required: true },
      { name: 'feature_key', label: 'Clé fonctionnalité', required: true },
      localized('label', 'Libellé'),
      { name: 'is_included', label: 'Incluse', type: 'boolean' },
      { name: 'sort_order', label: 'Ordre', type: 'number' },
    ],
  },
  {
    table: 'pricing_faqs', label: 'FAQ tarifs', group: 'Tarification',
    primaryKey: 'id', displayField: 'slug', publishField: 'is_published', orderField: 'sort_order',
    fields: published([
      { name: 'slug', label: 'Slug', required: true },
      localized('question', 'Question'),
      localized('answer', 'Réponse'),
    ]),
  },
  {
    table: 'legal_documents', label: 'Documents juridiques', group: 'Juridique',
    primaryKey: 'id', displayField: 'title', publishField: 'is_published',
    fields: [
      { name: 'slug', label: 'Slug', required: true },
      { name: 'locale', label: 'Langue', type: 'select', options: ['fr', 'en'], required: true },
      { name: 'title', label: 'Titre', required: true },
      { name: 'sections', label: 'Sections JSON', type: 'json', required: true },
      { name: 'effective_date', label: 'Date d’effet', type: 'date', required: true },
      { name: 'is_published', label: 'Publié', type: 'boolean' },
    ],
  },
  {
    table: 'contact_offices', label: 'Bureaux de contact', group: 'Contact',
    primaryKey: 'id', displayField: 'slug', publishField: 'is_published', orderField: 'sort_order',
    fields: published([
      { name: 'slug', label: 'Slug', required: true },
      { name: 'country_code', label: 'Code pays', required: true },
      localized('country_name', 'Pays'),
      { name: 'city', label: 'Ville', required: true },
      localized('address', 'Adresse'),
      { name: 'phone', label: 'Téléphone' },
      { name: 'email', label: 'E-mail', type: 'email' },
      { name: 'is_headquarters', label: 'Siège', type: 'boolean' },
    ]),
  },
  {
    table: 'contact_reasons', label: 'Motifs de contact', group: 'Contact',
    primaryKey: 'id', displayField: 'slug', publishField: 'is_published', orderField: 'sort_order',
    fields: published([
      { name: 'slug', label: 'Slug', required: true },
      localized('label', 'Libellé'),
    ]),
  },
  {
    table: 'commodity_baselines', label: 'Références matières premières', group: 'Données',
    primaryKey: 'id', displayField: 'key', publishField: 'is_published', orderField: 'sort_order',
    fields: published([
      { name: 'key', label: 'Clé', required: true },
      { name: 'world_bank_indicator', label: 'Indicateur Banque mondiale' },
      localized('name', 'Nom'),
      { name: 'country_code', label: 'Code pays', required: true },
      localized('xaf_unit', 'Unité XAF'),
      localized('category', 'Catégorie'),
      { name: 'usd_unit', label: 'Unité USD', required: true },
      { name: 'usd_price', label: 'Prix USD', type: 'number', required: true },
      { name: 'source_url', label: 'Source (URL)', type: 'url' },
    ]),
  },
  {
    table: 'assistant_knowledge', label: 'Connaissances assistant', group: 'Données',
    primaryKey: 'id', displayField: 'slug', publishField: 'is_published', orderField: 'sort_order',
    fields: published([
      { name: 'slug', label: 'Slug', required: true },
      { name: 'patterns', label: 'Motifs (un par ligne)', type: 'array' },
      localized('suggestion', 'Question suggérée', false),
      localized('answer', 'Réponse'),
      { name: 'tags', label: 'Tags (un par ligne)', type: 'array' },
    ]),
  },
  {
    table: 'product_categories', label: 'Catégories produits', group: 'Données',
    primaryKey: 'id', displayField: 'slug', publishField: 'is_published', orderField: 'sort_order',
    fields: published([
      { name: 'slug', label: 'Slug', required: true },
      localized('label', 'Libellé'),
    ]),
  },
  {
    table: 'tax_rates', label: 'Taux de taxes', group: 'Données',
    primaryKey: 'country_code', displayField: 'country_code', publishField: 'is_active',
    fields: [
      { name: 'country_code', label: 'Code pays', required: true },
      localized('country_name', 'Pays'),
      { name: 'rate', label: 'Taux (%)', type: 'number', required: true },
      { name: 'effective_from', label: 'Applicable depuis', type: 'date', required: true },
      { name: 'source', label: 'Source' },
      { name: 'is_active', label: 'Actif', type: 'boolean' },
    ],
  },
]
