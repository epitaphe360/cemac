import { useCallback, useEffect, useState } from 'react'
import {
  createCmsRow,
  deleteCmsRow,
  listCmsRows,
  updateCmsRow,
  type CmsInsert,
  type CmsRow,
  type CmsTableName,
  type CmsUpdate,
} from '../services/cms-admin.service'

export function useCmsCollection<T extends CmsTableName>(
  table: T,
  primaryKey: keyof CmsRow<T> & string,
) {
  const [rows, setRows] = useState<CmsRow<T>[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRows(await listCmsRows(table))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erreur Supabase inconnue')
    } finally {
      setLoading(false)
    }
  }, [table])

  useEffect(() => {
    void reload()
  }, [reload])

  const create = async (values: CmsInsert<T>) => {
    setSaving(true)
    setError(null)
    try {
      const row = await createCmsRow(table, values)
      setRows((current) => [...current, row])
      return row
    } catch (cause) {
      const nextError = cause instanceof Error ? cause.message : 'Erreur Supabase inconnue'
      setError(nextError)
      throw cause
    } finally {
      setSaving(false)
    }
  }

  const update = async (row: CmsRow<T>, values: CmsUpdate<T>) => {
    setSaving(true)
    setError(null)
    try {
      const key = String(row[primaryKey])
      const updated = await updateCmsRow(table, primaryKey, key, values)
      setRows((current) =>
        current.map((item) => String(item[primaryKey]) === key ? updated : item),
      )
      return updated
    } catch (cause) {
      const nextError = cause instanceof Error ? cause.message : 'Erreur Supabase inconnue'
      setError(nextError)
      throw cause
    } finally {
      setSaving(false)
    }
  }

  const remove = async (row: CmsRow<T>) => {
    setSaving(true)
    setError(null)
    try {
      const key = String(row[primaryKey])
      await deleteCmsRow(table, primaryKey, key)
      setRows((current) => current.filter((item) => String(item[primaryKey]) !== key))
    } catch (cause) {
      const nextError = cause instanceof Error ? cause.message : 'Erreur Supabase inconnue'
      setError(nextError)
      throw cause
    } finally {
      setSaving(false)
    }
  }

  return { rows, loading, saving, error, reload, create, update, remove }
}
