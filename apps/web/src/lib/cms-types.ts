import type { Json } from '@/types/database.types'

export type CmsLocale = 'fr' | 'en'
export type CmsJsonObject = Record<string, Json | undefined>

export interface CmsQueryState<T> {
  data: T
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export interface SiteSettingView {
  key: string
  value: Json
  description: string | null
  updatedAt: string
}

export interface ContentBlockView<TContent extends CmsJsonObject = CmsJsonObject> {
  id: string
  page: string
  section: string
  key: string
  locale: CmsLocale
  content: TContent
  mediaUrl: string | null
  sortOrder: number
  publishedAt: string | null
}

export interface PricingFeatureView {
  id: string
  key: string
  label: string | null
  included: boolean
  sortOrder: number
}

export interface PricingCtaView {
  label: string | null
  href: string | null
}

export interface PricingPlanView {
  id: string
  name: string | null
  description: string | null
  monthlyPrice: number | null
  yearlyPrice: number | null
  currency: string
  badge: string | null
  cta: PricingCtaView
  features: PricingFeatureView[]
  sortOrder: number
}

export interface PricingFaqView {
  id: string
  slug: string
  question: string | null
  answer: string | null
  sortOrder: number
}

export interface PricingView {
  plans: PricingPlanView[]
  faqs: PricingFaqView[]
}

export interface TeamMemberView {
  id: string
  slug: string
  fullName: string
  role: string | null
  countryCode: string | null
  countryLabel: string | null
  initials: string | null
  photoUrl: string | null
  sortOrder: number
}

export interface PartnerView {
  id: string
  slug: string
  name: string
  description: string | null
  logoUrl: string | null
  websiteUrl: string | null
  sortOrder: number
}

export interface MilestoneView {
  id: string
  slug: string
  year: number
  title: string | null
  description: string | null
  sortOrder: number
}

export interface MarketingStatView {
  key: string
  label: string | null
  displayValue: string | null
  numericValue: number | null
  source: string | null
  sortOrder: number
}

export interface AboutCollectionsView {
  team: TeamMemberView[]
  partners: PartnerView[]
  milestones: MilestoneView[]
  stats: MarketingStatView[]
}

export interface ContactOfficeView {
  id: string
  slug: string
  countryCode: string
  countryName: string | null
  city: string
  address: string | null
  phone: string | null
  email: string | null
  isHeadquarters: boolean
  sortOrder: number
}

export interface ContactReasonView {
  id: string
  slug: string
  label: string | null
  sortOrder: number
}

export interface ContactView {
  offices: ContactOfficeView[]
  reasons: ContactReasonView[]
}

export interface LegalSectionView {
  heading: string
  paragraphs: string[]
}

export interface LegalDocumentView {
  id: string
  slug: string
  locale: CmsLocale
  title: string
  sections: LegalSectionView[]
  effectiveDate: string
}

export interface CommodityView {
  id: string
  key: string
  worldBankIndicator: string | null
  name: string | null
  countryCode: string
  xafUnit: string | null
  category: string | null
  usdUnit: string
  usdPrice: number
  sourceUrl: string | null
  sortOrder: number
}

export interface KnowledgeEntryView {
  id: string
  slug: string
  patterns: string[]
  suggestion: string | null
  answer: string | null
  tags: string[]
  sortOrder: number
}

export interface CommoditiesKnowledgeView {
  commodities: CommodityView[]
  knowledge: KnowledgeEntryView[]
}

export interface ProductCategoryView {
  id: string
  slug: string
  label: string | null
  sortOrder: number
}

export interface TaxRateView {
  countryCode: string
  countryName: string | null
  rate: number
  effectiveFrom: string
  source: string | null
}

export interface ProductReferenceView {
  categories: ProductCategoryView[]
  taxRates: TaxRateView[]
}
