import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Eye, PencilLine, Plus, RefreshCw, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import type { Json } from '@/types/database.types'
import { useCmsCollection } from '../hooks/useCmsCollection'
import type { CmsInsert, CmsRow, CmsTableName, CmsUpdate } from '../services/cms-admin.service'
import type { CmsCollectionConfig, CmsFieldConfig } from './cms-config'

type FormValues = Record<string, string | boolean>

function localizedPart(value: unknown, locale: 'fr' | 'en') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ''
  const part = (value as Record<string, unknown>)[locale]
  return typeof part === 'string' ? part : ''
}

function initialValues(config: CmsCollectionConfig, row?: Record<string, unknown>): FormValues {
  const entries: Array<[string, string | boolean]> = []
  for (const field of config.fields) {
    const value = row?.[field.name]
    if (field.type === 'localized') {
      entries.push(
        [`${field.name}.fr`, localizedPart(value, 'fr')],
        [`${field.name}.en`, localizedPart(value, 'en')],
      )
      continue
    }
    if (field.type === 'boolean') {
      entries.push([field.name, Boolean(value)])
      continue
    }
    if (field.type === 'json') {
      entries.push([field.name, value === undefined ? '{}' : JSON.stringify(value, null, 2)])
      continue
    }
    if (field.type === 'array') {
      entries.push([field.name, Array.isArray(value) ? value.join('\n') : ''])
      continue
    }
    if (value === null || value === undefined) {
      if (field.name === 'locale') entries.push([field.name, 'fr'])
      else if (field.name === 'currency') entries.push([field.name, 'XAF'])
      else if (field.name === 'sort_order') entries.push([field.name, '0'])
      else entries.push([field.name, ''])
      continue
    }
    entries.push([field.name, String(value)])
  }
  return Object.fromEntries(entries)
}

function parseValues(config: CmsCollectionConfig, values: FormValues): Record<string, Json | undefined> {
  const result: Record<string, Json | undefined> = {}
  for (const field of config.fields) {
    if (field.type === 'localized') {
      const fr = String(values[`${field.name}.fr`] ?? '').trim()
      const en = String(values[`${field.name}.en`] ?? '').trim()
      if (field.required && (!fr || !en)) {
        throw new Error(`${field.label} doit être renseigné en français et en anglais.`)
      }
      result[field.name] = { fr, en }
      continue
    }

    const value = values[field.name]
    const text = typeof value === 'string' ? value.trim() : ''
    if (field.required && field.type !== 'boolean' && !text) {
      throw new Error(`${field.label} est obligatoire.`)
    }
    if (field.type === 'boolean') result[field.name] = Boolean(value)
    else if (field.type === 'number') {
      result[field.name] = text === '' ? null : Number(text)
      if (text !== '' && !Number.isFinite(result[field.name] as number)) {
        throw new Error(`${field.label} doit être un nombre valide.`)
      }
    } else if (field.type === 'json') {
      try {
        result[field.name] = JSON.parse(text || '{}') as Json
      } catch {
        throw new Error(`${field.label} contient du JSON invalide.`)
      }
    } else if (field.type === 'array') {
      result[field.name] = text ? text.split(/\n|,/).map((part) => part.trim()).filter(Boolean) : []
    } else if (field.type === 'url') {
      if (text) {
        try {
          const url = new URL(text)
          if (!['http:', 'https:'].includes(url.protocol)) throw new Error()
        } catch {
          throw new Error(`${field.label} doit être une URL HTTP(S) valide.`)
        }
      }
      result[field.name] = text || null
    } else {
      result[field.name] = text || (field.required ? '' : null)
    }
  }
  return result
}

function Field({
  field,
  values,
  setValue,
  disabled,
}: {
  field: CmsFieldConfig
  values: FormValues
  setValue: (name: string, value: string | boolean) => void
  disabled?: boolean
}) {
  if (field.type === 'localized') {
    return (
      <fieldset className="grid gap-2 rounded-md border p-3 sm:col-span-2">
        <legend className="px-1 text-xs font-medium">{field.label}{field.required ? ' *' : ''}</legend>
        <Input aria-label={`${field.label} français`} placeholder="Français" value={String(values[`${field.name}.fr`] ?? '')} onChange={(event) => setValue(`${field.name}.fr`, event.target.value)} disabled={disabled} />
        <Input aria-label={`${field.label} anglais`} placeholder="English" value={String(values[`${field.name}.en`] ?? '')} onChange={(event) => setValue(`${field.name}.en`, event.target.value)} disabled={disabled} />
      </fieldset>
    )
  }

  if (field.type === 'boolean') {
    return (
      <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
        <input type="checkbox" checked={Boolean(values[field.name])} onChange={(event) => setValue(field.name, event.target.checked)} disabled={disabled} />
        {field.label}
      </label>
    )
  }

  if (field.type === 'select') {
    return (
      <label className="space-y-1 text-xs font-medium">
        {field.label}{field.required ? ' *' : ''}
        <select className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm" value={String(values[field.name] ?? '')} onChange={(event) => setValue(field.name, event.target.value)} disabled={disabled}>
          <option value="">— Sélectionner —</option>
          {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
    )
  }

  if (field.type === 'textarea' || field.type === 'json' || field.type === 'array') {
    return (
      <label className="space-y-1 text-xs font-medium sm:col-span-2">
        {field.label}{field.required ? ' *' : ''}
        <textarea
          aria-label={field.label}
          rows={field.type === 'json' ? 7 : 3}
          className="w-full rounded-md border border-input bg-white px-3 py-2 font-mono text-sm"
          value={String(values[field.name] ?? '')}
          onChange={(event) => setValue(field.name, event.target.value)}
          disabled={disabled}
        />
      </label>
    )
  }

  return (
    <label className="space-y-1 text-xs font-medium">
      {field.label}{field.required ? ' *' : ''}
      <Input
        aria-label={field.label}
        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : 'text'}
        step={field.type === 'number' ? 'any' : undefined}
        value={String(values[field.name] ?? '')}
        onChange={(event) => setValue(field.name, event.target.value)}
        disabled={disabled}
      />
    </label>
  )
}

export function CmsCollectionEditor({ config }: { config: CmsCollectionConfig }) {
  const collection = useCmsCollection(config.table, config.primaryKey as never)
  const [editing, setEditing] = useState<Record<string, unknown> | null | undefined>(undefined)
  const [values, setValues] = useState<FormValues>(() => initialValues(config))
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null)

  const rows = useMemo(() => [...collection.rows].sort((left, right) => {
    if (!config.orderField) return String(left[config.displayField as keyof typeof left] ?? '').localeCompare(String(right[config.displayField as keyof typeof right] ?? ''))
    return Number(left[config.orderField as keyof typeof left] ?? 0) - Number(right[config.orderField as keyof typeof right] ?? 0)
  }), [collection.rows, config.displayField, config.orderField])

  const open = (row?: CmsRow<CmsTableName>) => {
    const record = row as unknown as Record<string, unknown> | undefined
    setEditing(record ?? null)
    setValues(initialValues(config, record))
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      const payload = parseValues(config, values)
      if (editing) {
        const primaryValue = editing[config.primaryKey]
        const current = collection.rows.find((row) => String(row[config.primaryKey as keyof typeof row]) === String(primaryValue))
        if (!current) throw new Error('Élément introuvable, rechargez la collection.')
        await collection.update(current, payload as CmsUpdate<typeof config.table>)
        toast.success('Contenu mis à jour')
      } else {
        await collection.create(payload as CmsInsert<typeof config.table>)
        toast.success('Contenu créé')
      }
      setEditing(undefined)
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Enregistrement impossible')
    }
  }

  const togglePublished = async (row: CmsRow<CmsTableName>) => {
    if (!config.publishField) return
    try {
      const current = Boolean(row[config.publishField as keyof typeof row])
      const publication = { [config.publishField]: !current } as Record<string, Json>
      if (config.table === 'content_blocks') {
        publication.published_at = current ? null : new Date().toISOString()
      }
      await collection.update(row, publication as CmsUpdate<typeof config.table>)
      toast.success(current ? 'Contenu dépublié' : 'Contenu publié')
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Mise à jour impossible')
    }
  }

  const move = async (row: CmsRow<CmsTableName>, delta: number) => {
    if (!config.orderField) return
    try {
      const current = Number(row[config.orderField as keyof typeof row] ?? 0)
      await collection.update(row, { [config.orderField]: Math.max(0, current + delta) } as CmsUpdate<typeof config.table>)
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Réordonnancement impossible')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-900">{config.label}</h3>
          <p className="text-xs text-muted-foreground">{rows.length} élément(s) · données protégées par les politiques RLS</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void collection.reload()} disabled={collection.loading}><RefreshCw className="mr-1 h-4 w-4" />Actualiser</Button>
          <Button size="sm" onClick={() => open()}><Plus className="mr-1 h-4 w-4" />Ajouter</Button>
        </div>
      </div>

      {collection.error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{collection.error}</div>}

      {editing !== undefined && (
        <Card>
          <CardHeader><CardTitle className="text-base">{editing ? 'Modifier' : 'Créer'} — {config.label}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={save} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {config.fields.map((field) => (
                <Field key={field.name} field={field} values={values} setValue={(name, value) => setValues((current) => ({ ...current, [name]: value }))} disabled={collection.saving || (Boolean(editing) && field.name === config.primaryKey)} />
              ))}
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={collection.saving}>{collection.saving ? <LoadingSpinner size="sm" /> : 'Enregistrer'}</Button>
                <Button type="button" variant="outline" onClick={() => setEditing(undefined)}>Annuler</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {collection.loading ? <div className="flex justify-center py-12"><LoadingSpinner /></div> : (
        <div className="grid gap-3">
          {rows.map((row) => {
            const record = row as unknown as Record<string, unknown>
            const titleValue = record[config.displayField]
            const title = typeof titleValue === 'object' ? localizedPart(titleValue, 'fr') : String(titleValue ?? record[config.primaryKey])
            const isPublished = config.publishField ? Boolean(record[config.publishField]) : undefined
            return (
              <Card key={String(record[config.primaryKey])}>
                <CardContent className="flex flex-wrap items-center gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{title || '(sans titre)'}</p>
                    <p className="text-xs text-muted-foreground">{String(record[config.primaryKey])}</p>
                  </div>
                  {config.publishField && (
                    <button type="button" onClick={() => void togglePublished(row as CmsRow<CmsTableName>)} className={`rounded-full px-2 py-1 text-xs font-medium ${isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {isPublished ? 'Publié' : 'Brouillon'}
                    </button>
                  )}
                  {config.orderField && (
                    <div className="flex items-center">
                      <button aria-label="Monter" className="p-1" onClick={() => void move(row as CmsRow<CmsTableName>, -1)}><ChevronUp className="h-4 w-4" /></button>
                      <span className="min-w-6 text-center text-xs">{String(record[config.orderField] ?? 0)}</span>
                      <button aria-label="Descendre" className="p-1" onClick={() => void move(row as CmsRow<CmsTableName>, 1)}><ChevronDown className="h-4 w-4" /></button>
                    </div>
                  )}
                  <button aria-label="Aperçu" className="p-1 text-gray-600" onClick={() => setPreview(record)}><Eye className="h-4 w-4" /></button>
                  <button aria-label="Modifier" className="p-1 text-cemac-700" onClick={() => open(row as CmsRow<CmsTableName>)}><PencilLine className="h-4 w-4" /></button>
                  <button
                    aria-label="Supprimer"
                    className="p-1 text-red-600"
                    onClick={async () => {
                      if (!window.confirm(`Supprimer « ${title} » ?`)) return
                      try {
                        await collection.remove(row as CmsRow<CmsTableName>)
                        toast.success('Contenu supprimé')
                      } catch (cause) {
                        toast.error(cause instanceof Error ? cause.message : 'Suppression impossible')
                      }
                    }}
                  ><Trash2 className="h-4 w-4" /></button>
                </CardContent>
              </Card>
            )
          })}
          {!rows.length && <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">Aucun contenu dans cette collection.</p>}
        </div>
      )}

      {preview && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Aperçu basique</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setPreview(null)}>Fermer</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {['media_url', 'photo_url', 'logo_url'].map((key) => {
              const url = preview[key]
              return typeof url === 'string' && url ? <img key={key} src={url} alt="" className="max-h-48 rounded-md border object-contain" /> : null
            })}
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-gray-950 p-4 text-xs text-gray-100">{JSON.stringify(preview, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
