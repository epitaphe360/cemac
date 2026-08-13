import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/public-env'

const supabaseUrl = getSupabaseUrl()
const supabaseAnonKey = getSupabaseAnonKey()

// React StrictMode (dev only) double-mounts components, causing two concurrent
// onAuthStateChange subscribers to race for the same navigator.lock key.
// The second subscriber times out after 5 000 ms, steals the lock, and floods
// the console with AbortError messages.  Bypassing navigator.locks in dev
// eliminates the race entirely.  Production keeps the default navigator.locks
// behaviour, which is important for multi-tab token-refresh safety.
const devLock = import.meta.env.DEV
  ? <R>(_name: string, _timeout: number, fn: () => Promise<R>): Promise<R> => fn()
  : undefined

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'cemac-integra-auth',
    ...(devLock && { lock: devLock }),
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

export type SupabaseClient = typeof supabase
