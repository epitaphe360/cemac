import { useCallback } from 'react'
import {
  getAboutCollections,
  getAssistantKnowledge,
  getCommodityBaselines,
  getCommoditiesAndKnowledge,
  getContact,
  getContentBlocks,
  getLegalDocument,
  getPricing,
  getProductCategories,
  getProductReference,
  getSiteSetting,
  getSiteSettings,
  getTaxRates,
} from '@/lib/cms-client'
import type {
  AboutCollectionsView,
  CmsJsonObject,
  CmsLocale,
  CommodityView,
  CommoditiesKnowledgeView,
  ContactView,
  ContentBlockView,
  KnowledgeEntryView,
  LegalDocumentView,
  PricingView,
  ProductCategoryView,
  ProductReferenceView,
  SiteSettingView,
  TaxRateView,
} from '@/lib/cms-types'
import { useCmsQuery } from './use-cms-query'

const EMPTY_SETTINGS: SiteSettingView[] = []
const EMPTY_BLOCKS: ContentBlockView[] = []
const EMPTY_PRICING: PricingView = { plans: [], faqs: [] }
const EMPTY_ABOUT: AboutCollectionsView = {
  team: [],
  partners: [],
  milestones: [],
  stats: [],
}
const EMPTY_CONTACT: ContactView = { offices: [], reasons: [] }
const EMPTY_COMMODITIES: CommodityView[] = []
const EMPTY_KNOWLEDGE: KnowledgeEntryView[] = []
const EMPTY_COMMODITIES_KNOWLEDGE: CommoditiesKnowledgeView = {
  commodities: [],
  knowledge: [],
}
const EMPTY_PRODUCT_CATEGORIES: ProductCategoryView[] = []
const EMPTY_TAX_RATES: TaxRateView[] = []
const EMPTY_PRODUCT_REFERENCE: ProductReferenceView = {
  categories: [],
  taxRates: [],
}

export function useSiteSettings() {
  const query = useCallback(() => getSiteSettings(), [])
  return useCmsQuery(query, EMPTY_SETTINGS)
}

export function useSiteSetting(key: string) {
  const query = useCallback(() => getSiteSetting(key), [key])
  return useCmsQuery<SiteSettingView | null>(query, null)
}

export function useContentBlocks<TContent extends CmsJsonObject = CmsJsonObject>(
  page: string,
  locale: CmsLocale,
  section?: string,
) {
  const query = useCallback(
    () => getContentBlocks<TContent>(page, locale, section),
    [locale, page, section],
  )

  return useCmsQuery(
    query,
    EMPTY_BLOCKS as ContentBlockView<TContent>[],
  )
}

export function usePricing(locale: CmsLocale) {
  const query = useCallback(() => getPricing(locale), [locale])
  return useCmsQuery(query, EMPTY_PRICING)
}

export function useAboutCollections(locale: CmsLocale) {
  const query = useCallback(() => getAboutCollections(locale), [locale])
  return useCmsQuery(query, EMPTY_ABOUT)
}

export function useContact(locale: CmsLocale) {
  const query = useCallback(() => getContact(locale), [locale])
  return useCmsQuery(query, EMPTY_CONTACT)
}

export function useLegalDocument(slug: string, locale: CmsLocale) {
  const query = useCallback(
    () => getLegalDocument(slug, locale),
    [locale, slug],
  )
  return useCmsQuery<LegalDocumentView | null>(query, null)
}

export function useCommoditiesAndKnowledge(locale: CmsLocale) {
  const query = useCallback(
    () => getCommoditiesAndKnowledge(locale),
    [locale],
  )
  return useCmsQuery(query, EMPTY_COMMODITIES_KNOWLEDGE)
}

export function useCommodityBaselines(locale: CmsLocale) {
  const query = useCallback(() => getCommodityBaselines(locale), [locale])
  return useCmsQuery(query, EMPTY_COMMODITIES)
}

export function useAssistantKnowledge(locale: CmsLocale) {
  const query = useCallback(() => getAssistantKnowledge(locale), [locale])
  return useCmsQuery(query, EMPTY_KNOWLEDGE)
}

export function useProductReference(locale: CmsLocale) {
  const query = useCallback(() => getProductReference(locale), [locale])
  return useCmsQuery(query, EMPTY_PRODUCT_REFERENCE)
}

export function useProductCategories(locale: CmsLocale) {
  const query = useCallback(() => getProductCategories(locale), [locale])
  return useCmsQuery(query, EMPTY_PRODUCT_CATEGORIES)
}

export function useTaxRates(locale: CmsLocale) {
  const query = useCallback(() => getTaxRates(locale), [locale])
  return useCmsQuery(query, EMPTY_TAX_RATES)
}

export { useCmsQuery } from './use-cms-query'
