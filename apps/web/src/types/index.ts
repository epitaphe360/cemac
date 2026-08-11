import type { Database } from './database.types'

// Row types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Entreprise = Database['public']['Tables']['entreprises']['Row']
export type Certification = Database['public']['Tables']['certifications']['Row']
export type Document = Database['public']['Tables']['documents']['Row']
export type WorkflowEvent = Database['public']['Tables']['workflow_events']['Row']
export type Produit = Database['public']['Tables']['produits']['Row']
export type ChambreCommerce = Database['public']['Tables']['chambres_commerce']['Row']

// Logistics tables (derived from Database types)
export type Corridor = Database['public']['Tables']['corridors']['Row']
export type LogisticsAlert = Database['public']['Tables']['logistics_alerts']['Row']
export type Invoice = Database['public']['Tables']['invoices']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type ContactRequest = Database['public']['Tables']['contact_requests']['Row']
export type ApiConfig = Database['public']['Tables']['api_configs']['Row']
export type StripeWebhookEvent = Database['public']['Tables']['stripe_webhook_events']['Row']

// CMS and mutable reference data
export type SiteSetting = Database['public']['Tables']['site_settings']['Row']
export type ContentBlock = Database['public']['Tables']['content_blocks']['Row']
export type TeamMember = Database['public']['Tables']['team_members']['Row']
export type Partner = Database['public']['Tables']['partners']['Row']
export type Milestone = Database['public']['Tables']['milestones']['Row']
export type MarketingStat = Database['public']['Tables']['marketing_stats']['Row']
export type PricingPlan = Database['public']['Tables']['pricing_plans']['Row']
export type PricingPlanFeature = Database['public']['Tables']['pricing_plan_features']['Row']
export type PricingFaq = Database['public']['Tables']['pricing_faqs']['Row']
export type ContactOffice = Database['public']['Tables']['contact_offices']['Row']
export type ContactReason = Database['public']['Tables']['contact_reasons']['Row']
export type CommodityBaseline = Database['public']['Tables']['commodity_baselines']['Row']
export type AssistantKnowledge = Database['public']['Tables']['assistant_knowledge']['Row']
export type LegalDocument = Database['public']['Tables']['legal_documents']['Row']
export type ProductCategory = Database['public']['Tables']['product_categories']['Row']
export type TaxRate = Database['public']['Tables']['tax_rates']['Row']
export type PlatformStats = Database['public']['Views']['platform_stats']['Row']
export type ApiConfigMetadata = Database['public']['Views']['api_config_metadata']['Row']

// Insert types
export type InsertEntreprise = Database['public']['Tables']['entreprises']['Insert']
export type InsertCertification = Database['public']['Tables']['certifications']['Insert']
export type InsertProduit = Database['public']['Tables']['produits']['Insert']
export type InsertContentBlock = Database['public']['Tables']['content_blocks']['Insert']
export type InsertPricingPlan = Database['public']['Tables']['pricing_plans']['Insert']
export type InsertLegalDocument = Database['public']['Tables']['legal_documents']['Insert']

// Update types
export type UpdateEntreprise = Database['public']['Tables']['entreprises']['Update']
export type UpdateCertification = Database['public']['Tables']['certifications']['Update']
export type UpdateContentBlock = Database['public']['Tables']['content_blocks']['Update']
export type UpdatePricingPlan = Database['public']['Tables']['pricing_plans']['Update']

// Joined types
export type CertificationWithEntreprise = Certification & {
  entreprise: Entreprise
}

export type CertificationWithEvents = Certification & {
  workflow_events: WorkflowEvent[]
  documents: Document[]
}

export type ProduitWithEntreprise = Produit & {
  entreprise: Entreprise & {
    certifications: Pick<Certification, 'id' | 'statut' | 'type_certification'>[]
  }
}

// Auth types
export type UserRole =
  | 'super_admin'
  | 'cemac_officer'
  | 'chamber_agent'
  | 'company_admin'
  | 'auditor'
  | 'buyer'
  | 'logistics_agent'
  | 'public'

export interface AuthUser {
  id: string
  email: string
  profile: Profile | null
  entreprise: Entreprise | null
}

// API response types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
}

// Form types
export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  email: string
  password: string
  full_name: string
  phone?: string
  country: string
  raison_sociale: string
  secteur_activite?: string
}

export interface CertificationFormData {
  produit_nom: string
  produit_description?: string
  type_certification: string
  pays_production: string
  valeur_ajoutee_locale?: number
}
