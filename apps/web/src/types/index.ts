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

// Insert types
export type InsertEntreprise = Database['public']['Tables']['entreprises']['Insert']
export type InsertCertification = Database['public']['Tables']['certifications']['Insert']
export type InsertProduit = Database['public']['Tables']['produits']['Insert']

// Update types
export type UpdateEntreprise = Database['public']['Tables']['entreprises']['Update']
export type UpdateCertification = Database['public']['Tables']['certifications']['Update']

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
