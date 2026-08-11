import { useCallback, useEffect, useRef, useState } from 'react'
import type { CmsQueryState } from '@/lib/cms-types'

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Échec de la requête CMS.')
}

export function useCmsQuery<T>(
  query: () => Promise<T>,
  emptyData: T,
): CmsQueryState<T> {
  const [data, setData] = useState<T>(emptyData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const mountedRef = useRef(false)
  const requestIdRef = useRef(0)

  const execute = useCallback(async () => {
    const requestId = ++requestIdRef.current

    if (mountedRef.current) {
      setLoading(true)
      setError(null)
    }

    try {
      const nextData = await query()
      if (mountedRef.current && requestId === requestIdRef.current) {
        setData(nextData)
      }
    } catch (queryError) {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setData(emptyData)
        setError(toError(queryError))
      }
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [emptyData, query])

  useEffect(() => {
    mountedRef.current = true
    void execute()

    return () => {
      mountedRef.current = false
      requestIdRef.current += 1
    }
  }, [execute])

  return {
    data,
    loading,
    error,
    refetch: execute,
  }
}
