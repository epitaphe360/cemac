import { useMemo, useState } from 'react'
import { CMS_COLLECTIONS } from './cms-config'
import { CmsCollectionEditor } from './CmsCollectionEditor'

export function CmsAdminPanel() {
  const [table, setTable] = useState(CMS_COLLECTIONS[0].table)
  const config = useMemo(
    () => CMS_COLLECTIONS.find((collection) => collection.table === table) ?? CMS_COLLECTIONS[0],
    [table],
  )
  const groups = [...new Set(CMS_COLLECTIONS.map((collection) => collection.group))]

  return (
    <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="h-fit rounded-lg border bg-white p-2 lg:sticky lg:top-4">
        <p className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Collections CMS</p>
        {groups.map((group) => (
          <div key={group} className="mb-3">
            <p className="px-2 py-1 text-xs font-medium text-gray-500">{group}</p>
            {CMS_COLLECTIONS.filter((collection) => collection.group === group).map((collection) => (
              <button
                key={collection.table}
                type="button"
                onClick={() => setTable(collection.table)}
                className={`w-full rounded-md px-2 py-2 text-left text-sm ${table === collection.table ? 'bg-cemac-50 font-medium text-cemac-800' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                {collection.label}
              </button>
            ))}
          </div>
        ))}
      </aside>
      <CmsCollectionEditor key={config.table} config={config} />
    </div>
  )
}
