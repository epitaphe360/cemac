import { getSupabaseUrl } from '@/lib/public-env'

export const SUPABASE_URL = getSupabaseUrl()

export const APP_NAME = 'CEMAC INTEGRA'
export const APP_VERSION = '2.0.0'

export const CERTIFICATION_STATUSES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  FIELD_VALIDATION: 'field_validation',
  COMMISSION_REVIEW: 'commission_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
  EXPIRED: 'expired',
} as const

export const CERTIFICATION_STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  submitted: 'Soumis',
  under_review: 'En révision',
  field_validation: 'Validation terrain',
  commission_review: 'Commission CEMAC',
  approved: 'Approuvé',
  rejected: 'Rejeté',
  suspended: 'Suspendu',
  expired: 'Expiré',
}

export const CERTIFICATION_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  under_review: 'bg-yellow-100 text-yellow-700',
  field_validation: 'bg-orange-100 text-orange-700',
  commission_review: 'bg-purple-100 text-purple-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  suspended: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-500',
}

export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  CEMAC_OFFICER: 'cemac_officer',
  CHAMBER_AGENT: 'chamber_agent',
  COMPANY_ADMIN: 'company_admin',
  AUDITOR: 'auditor',
  BUYER: 'buyer',
  LOGISTICS_AGENT: 'logistics_agent',
  PUBLIC: 'public',
} as const

export const CEMAC_COUNTRIES = [
  { code: 'CM', name: 'Cameroun', flag: '🇨🇲' },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦' },
  { code: 'CG', name: 'Congo', flag: '🇨🇬' },
  { code: 'TD', name: 'Tchad', flag: '🇹🇩' },
  { code: 'CF', name: 'Centrafrique', flag: '🇨🇫' },
  { code: 'GQ', name: 'Guinée Équatoriale', flag: '🇬🇶' },
] as const

export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  SME: 'sme',
  ENTERPRISE: 'enterprise',
  INSTITUTIONAL: 'institutional',
} as const
