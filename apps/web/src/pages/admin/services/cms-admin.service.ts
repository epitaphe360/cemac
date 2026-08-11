import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

export type CmsTableName =
  | 'site_settings'
  | 'content_blocks'
  | 'team_members'
  | 'partners'
  | 'milestones'
  | 'marketing_stats'
  | 'pricing_plans'
  | 'pricing_plan_features'
  | 'pricing_faqs'
  | 'legal_documents'
  | 'contact_offices'
  | 'contact_reasons'
  | 'commodity_baselines'
  | 'assistant_knowledge'
  | 'product_categories'
  | 'tax_rates'

export type CmsRow<T extends CmsTableName> =
  Database['public']['Tables'][T]['Row']
export type CmsInsert<T extends CmsTableName> =
  Database['public']['Tables'][T]['Insert']
export type CmsUpdate<T extends CmsTableName> =
  Database['public']['Tables'][T]['Update']

interface CmsResult<T> {
  data: T | null
  error: { message: string; details?: string | null; hint?: string | null } | null
}

interface CmsFilter<T> extends PromiseLike<CmsResult<T[]>> {
  eq(column: string, value: string): CmsFilter<T>
  select(columns?: string): CmsFilter<T>
  single(): Promise<CmsResult<T>>
}

interface CmsTable<T extends CmsTableName> {
  select(columns?: string): CmsFilter<CmsRow<T>>
  insert(values: CmsInsert<T>): CmsFilter<CmsRow<T>>
  update(values: CmsUpdate<T>): CmsFilter<CmsRow<T>>
  delete(): CmsFilter<CmsRow<T>>
}

// Supabase ne conserve pas la corrélation table/payload lorsqu'un nom de table
// est générique. Cette frontière restaure cette corrélation avec les types DB.
function cmsTable<T extends CmsTableName>(table: T): CmsTable<T> {
  return supabase.from(table) as unknown as CmsTable<T>
}

function message(error: { message: string; details?: string | null; hint?: string | null }) {
  return [error.message, error.details, error.hint].filter(Boolean).join(' — ')
}

export async function listCmsRows<T extends CmsTableName>(
  table: T,
): Promise<CmsRow<T>[]> {
  const { data, error } = await cmsTable(table).select('*')
  if (error) throw new Error(message(error))
  return data ?? []
}

export async function createCmsRow<T extends CmsTableName>(
  table: T,
  values: CmsInsert<T>,
): Promise<CmsRow<T>> {
  const { data, error } = await cmsTable(table)
    .insert(values)
    .select('*')
    .single()
  if (error) throw new Error(message(error))
  if (!data) throw new Error('La création n’a retourné aucune donnée.')
  return data
}

export async function updateCmsRow<T extends CmsTableName>(
  table: T,
  primaryKey: string,
  primaryValue: string,
  values: CmsUpdate<T>,
): Promise<CmsRow<T>> {
  const { data, error } = await cmsTable(table)
    .update(values)
    .eq(primaryKey, primaryValue)
    .select('*')
    .single()
  if (error) throw new Error(message(error))
  if (!data) throw new Error('La mise à jour n’a retourné aucune donnée.')
  return data
}

export async function deleteCmsRow(
  table: CmsTableName,
  primaryKey: string,
  primaryValue: string,
): Promise<void> {
  const { error } = await cmsTable(table).delete().eq(primaryKey, primaryValue)
  if (error) throw new Error(message(error))
}
