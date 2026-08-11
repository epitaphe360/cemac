import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[CEMAC INTEGRA] Variables d\'environnement manquantes : VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont requises.\n' +
    'Copiez apps/web/.env.example vers apps/web/.env et renseignez vos valeurs Supabase.'
  )
}

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
