import { describe, expect, it } from 'vitest'
import { CMS_COLLECTIONS } from '@/pages/admin/components/cms-config'

describe('CMS admin collection configuration', () => {
  it('covers every mutable CMS and reference collection', () => {
    expect(CMS_COLLECTIONS.map((collection) => collection.table)).toEqual(expect.arrayContaining([
      'site_settings',
      'content_blocks',
      'team_members',
      'partners',
      'milestones',
      'pricing_plans',
      'pricing_plan_features',
      'pricing_faqs',
      'legal_documents',
      'contact_offices',
      'contact_reasons',
      'commodity_baselines',
      'assistant_knowledge',
      'product_categories',
      'tax_rates',
    ]))
  })

  it('defines publication and ordering controls where supported by the schema', () => {
    const content = CMS_COLLECTIONS.find((collection) => collection.table === 'content_blocks')
    const plans = CMS_COLLECTIONS.find((collection) => collection.table === 'pricing_plans')
    const taxes = CMS_COLLECTIONS.find((collection) => collection.table === 'tax_rates')

    expect(content).toMatchObject({ publishField: 'is_published', orderField: 'sort_order' })
    expect(plans).toMatchObject({ publishField: 'is_published', orderField: 'sort_order' })
    expect(taxes).toMatchObject({ publishField: 'is_active', primaryKey: 'country_code' })
  })

  it('provides bilingual editors for localized JSON fields', () => {
    const localizedFields = CMS_COLLECTIONS.flatMap((collection) =>
      collection.fields.filter((field) => field.type === 'localized'),
    )

    expect(localizedFields.length).toBeGreaterThan(10)
    expect(localizedFields.some((field) => field.name === 'name')).toBe(true)
    expect(localizedFields.some((field) => field.name === 'answer')).toBe(true)
    expect(localizedFields.some((field) => field.name === 'country_name')).toBe(true)
  })
})
