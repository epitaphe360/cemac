import { supabase } from './supabase'
import {
  asJsonObject,
  isCmsLocale,
  isJsonObject,
  readLocalizedString,
  readLocalizedValue,
  readString,
  readStringArray,
} from './cms-localization'
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
  LegalSectionView,
  PricingCtaView,
  PricingView,
  ProductCategoryView,
  ProductReferenceView,
  SiteSettingView,
  TaxRateView,
} from './cms-types'
import type { Json } from '@/types/database.types'

interface QueryResult<T> {
  data: T | null
  error: { message: string } | null
}

function unwrap<T>(result: QueryResult<T>): T {
  if (result.error) throw new Error(result.error.message)
  if (result.data === null) throw new Error('La requête CMS n’a retourné aucune donnée.')
  return result.data
}

function parseLegalSections(value: Json): LegalSectionView[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((section) => {
    if (!isJsonObject(section)) return []
    const heading = section.heading
    if (typeof heading !== 'string') return []

    return [{ heading, paragraphs: readStringArray(section.paragraphs) }]
  })
}

function mapCta(value: Json, locale: CmsLocale): PricingCtaView {
  const cta = readLocalizedValue(value, locale, isJsonObject)
  return {
    label: readString(cta, 'label'),
    href: readString(cta, 'href'),
  }
}

export async function getSiteSettings(
  keys?: readonly string[],
): Promise<SiteSettingView[]> {
  if (keys?.length === 0) return []

  const result = keys
    ? await supabase
        .from('site_settings')
        .select('*')
        .eq('is_public', true)
        .in('key', [...keys])
        .order('key')
    : await supabase
        .from('site_settings')
        .select('*')
        .eq('is_public', true)
        .order('key')

  return unwrap(result).map((row) => ({
    key: row.key,
    value: row.value,
    description: row.description,
    updatedAt: row.updated_at,
  }))
}

export async function getSiteSetting(
  key: string,
): Promise<SiteSettingView | null> {
  const result = await supabase
    .from('site_settings')
    .select('*')
    .eq('key', key)
    .eq('is_public', true)
    .maybeSingle()

  if (result.error) throw new Error(result.error.message)
  if (!result.data) return null

  return {
    key: result.data.key,
    value: result.data.value,
    description: result.data.description,
    updatedAt: result.data.updated_at,
  }
}

export async function getContentBlocks<TContent extends CmsJsonObject = CmsJsonObject>(
  page: string,
  locale: CmsLocale,
  section?: string,
): Promise<ContentBlockView<TContent>[]> {
  const result = section
    ? await supabase
        .from('content_blocks')
        .select('*')
        .eq('page', page)
        .eq('section', section)
        .eq('locale', locale)
        .eq('is_published', true)
        .order('sort_order')
    : await supabase
        .from('content_blocks')
        .select('*')
        .eq('page', page)
        .eq('locale', locale)
        .eq('is_published', true)
        .order('sort_order')

  return unwrap(result).flatMap((row) => {
    const content = asJsonObject(row.content)
    if (!content || !isCmsLocale(row.locale)) return []

    return [{
      id: row.id,
      page: row.page,
      section: row.section,
      key: row.key,
      locale: row.locale,
      content: content as TContent,
      mediaUrl: row.media_url,
      sortOrder: row.sort_order,
      publishedAt: row.published_at,
    }]
  })
}

export async function getPricing(locale: CmsLocale): Promise<PricingView> {
  const [plansResult, featuresResult, faqsResult] = await Promise.all([
    supabase
      .from('pricing_plans')
      .select('*')
      .eq('is_published', true)
      .order('sort_order'),
    supabase
      .from('pricing_plan_features')
      .select('*')
      .order('sort_order'),
    supabase
      .from('pricing_faqs')
      .select('*')
      .eq('is_published', true)
      .order('sort_order'),
  ])

  const plans = unwrap(plansResult)
  const features = unwrap(featuresResult)
  const faqs = unwrap(faqsResult)

  return {
    plans: plans.map((plan) => ({
      id: plan.id,
      name: readLocalizedString(plan.name, locale),
      description: readLocalizedString(plan.description, locale),
      monthlyPrice: plan.monthly_price,
      yearlyPrice: plan.yearly_price,
      currency: plan.currency,
      badge: readLocalizedString(plan.badge, locale),
      cta: mapCta(plan.cta, locale),
      features: features
        .filter((feature) => feature.plan_id === plan.id)
        .map((feature) => ({
          id: feature.id,
          key: feature.feature_key,
          label: readLocalizedString(feature.label, locale),
          included: feature.is_included,
          sortOrder: feature.sort_order,
        })),
      sortOrder: plan.sort_order,
    })),
    faqs: faqs.map((faq) => ({
      id: faq.id,
      slug: faq.slug,
      question: readLocalizedString(faq.question, locale),
      answer: readLocalizedString(faq.answer, locale),
      sortOrder: faq.sort_order,
    })),
  }
}

export async function getAboutCollections(
  locale: CmsLocale,
): Promise<AboutCollectionsView> {
  const [teamResult, partnersResult, milestonesResult, statsResult] =
    await Promise.all([
      supabase.from('team_members').select('*').eq('is_published', true).order('sort_order'),
      supabase.from('partners').select('*').eq('is_published', true).order('sort_order'),
      supabase.from('milestones').select('*').eq('is_published', true).order('year'),
      supabase.from('marketing_stats').select('*').eq('is_published', true).order('sort_order'),
    ])

  return {
    team: unwrap(teamResult).map((member) => ({
      id: member.id,
      slug: member.slug,
      fullName: member.full_name,
      role: readLocalizedString(member.role, locale),
      countryCode: member.country_code,
      countryLabel: readLocalizedString(member.country_label, locale),
      initials: member.initials,
      photoUrl: member.photo_url,
      sortOrder: member.sort_order,
    })),
    partners: unwrap(partnersResult).map((partner) => ({
      id: partner.id,
      slug: partner.slug,
      name: partner.name,
      description: readLocalizedString(partner.description, locale),
      logoUrl: partner.logo_url,
      websiteUrl: partner.website_url,
      sortOrder: partner.sort_order,
    })),
    milestones: unwrap(milestonesResult).map((milestone) => ({
      id: milestone.id,
      slug: milestone.slug,
      year: milestone.year,
      title: readLocalizedString(milestone.title, locale),
      description: readLocalizedString(milestone.description, locale),
      sortOrder: milestone.sort_order,
    })),
    stats: unwrap(statsResult).map((stat) => ({
      key: stat.key,
      label: readLocalizedString(stat.label, locale),
      displayValue: readLocalizedString(stat.display_value, locale),
      numericValue: stat.numeric_value,
      source: stat.source,
      sortOrder: stat.sort_order,
    })),
  }
}

export async function getContact(locale: CmsLocale): Promise<ContactView> {
  const [officesResult, reasonsResult] = await Promise.all([
    supabase.from('contact_offices').select('*').eq('is_published', true).order('sort_order'),
    supabase.from('contact_reasons').select('*').eq('is_published', true).order('sort_order'),
  ])

  return {
    offices: unwrap(officesResult).map((office) => ({
      id: office.id,
      slug: office.slug,
      countryCode: office.country_code,
      countryName: readLocalizedString(office.country_name, locale),
      city: office.city,
      address: readLocalizedString(office.address, locale),
      phone: office.phone,
      email: office.email,
      isHeadquarters: office.is_headquarters,
      sortOrder: office.sort_order,
    })),
    reasons: unwrap(reasonsResult).map((reason) => ({
      id: reason.id,
      slug: reason.slug,
      label: readLocalizedString(reason.label, locale),
      sortOrder: reason.sort_order,
    })),
  }
}

export async function getLegalDocument(
  slug: string,
  locale: CmsLocale,
): Promise<LegalDocumentView | null> {
  const result = await supabase
    .from('legal_documents')
    .select('*')
    .eq('slug', slug)
    .eq('locale', locale)
    .eq('is_published', true)
    .maybeSingle()

  if (result.error) throw new Error(result.error.message)
  const document = result.data
  if (!document || !isCmsLocale(document.locale)) return null

  return {
    id: document.id,
    slug: document.slug,
    locale: document.locale,
    title: document.title,
    sections: parseLegalSections(document.sections),
    effectiveDate: document.effective_date,
  }
}

export async function getCommodityBaselines(
  locale: CmsLocale,
): Promise<CommodityView[]> {
  const result = await supabase
    .from('commodity_baselines')
    .select('*')
    .eq('is_published', true)
    .order('sort_order')

  return unwrap(result).map((commodity) => ({
    id: commodity.id,
    key: commodity.key,
    worldBankIndicator: commodity.world_bank_indicator,
    name: readLocalizedString(commodity.name, locale),
    countryCode: commodity.country_code,
    xafUnit: readLocalizedString(commodity.xaf_unit, locale),
    category: readLocalizedString(commodity.category, locale),
    usdUnit: commodity.usd_unit,
    usdPrice: commodity.usd_price,
    sourceUrl: commodity.source_url,
    sortOrder: commodity.sort_order,
  }))
}

export async function getAssistantKnowledge(
  locale: CmsLocale,
): Promise<KnowledgeEntryView[]> {
  const result = await supabase
    .from('assistant_knowledge')
    .select('*')
    .eq('is_published', true)
    .order('sort_order')

  return unwrap(result).map((entry) => ({
    id: entry.id,
    slug: entry.slug,
    patterns: entry.patterns,
    suggestion: readLocalizedString(entry.suggestion, locale),
    answer: readLocalizedString(entry.answer, locale),
    tags: entry.tags,
    sortOrder: entry.sort_order,
  }))
}

export async function getCommoditiesAndKnowledge(
  locale: CmsLocale,
): Promise<CommoditiesKnowledgeView> {
  const [commodities, knowledge] = await Promise.all([
    getCommodityBaselines(locale),
    getAssistantKnowledge(locale),
  ])
  return { commodities, knowledge }
}

export async function getProductCategories(
  locale: CmsLocale,
): Promise<ProductCategoryView[]> {
  const result = await supabase
    .from('product_categories')
    .select('*')
    .eq('is_published', true)
    .order('sort_order')

  return unwrap(result).map((category) => ({
      id: category.id,
      slug: category.slug,
      label: readLocalizedString(category.label, locale),
      sortOrder: category.sort_order,
    }))
}

export async function getTaxRates(locale: CmsLocale): Promise<TaxRateView[]> {
  const result = await supabase
    .from('tax_rates')
    .select('*')
    .eq('is_active', true)
    .order('country_code')

  return unwrap(result).map((tax) => ({
    countryCode: tax.country_code,
    countryName: readLocalizedString(tax.country_name, locale),
    rate: tax.rate,
    effectiveFrom: tax.effective_from,
    source: tax.source,
  }))
}

export async function getProductReference(
  locale: CmsLocale,
): Promise<ProductReferenceView> {
  const [categories, taxRates] = await Promise.all([
    getProductCategories(locale),
    getTaxRates(locale),
  ])
  return { categories, taxRates }
}
