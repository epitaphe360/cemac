import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile, Entreprise, UserRole } from '@/types'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  entreprise: Entreprise | null
  isLoading: boolean
  isInitialized: boolean

  // Actions
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  setEntreprise: (entreprise: Entreprise | null) => void
  refreshEntreprise: () => Promise<Entreprise | null>
  initialize: () => Promise<void>
  logout: () => Promise<void>

  // Computed
  role: () => UserRole
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      profile: null,
      entreprise: null,
      isLoading: false,
      isInitialized: false,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setProfile: (profile) => set({ profile }),
      setEntreprise: (entreprise) => set({ entreprise }),
      refreshEntreprise: async () => {
        const userId = get().user?.id ?? get().session?.user?.id
        if (!userId || get().profile?.role !== 'company_admin') {
          set({ entreprise: null })
          return null
        }
        const { data, error } = await supabase
          .from('entreprises')
          .select('*')
          .eq('owner_id', userId)
          .maybeSingle()
        if (error) throw error
        set({ entreprise: data ?? null })
        return data ?? null
      },

      role: () => (get().profile?.role as UserRole) ?? 'public',
      isAuthenticated: () => !!get().session,

      initialize: async () => {
        // Clear stale persisted state before fetching fresh data
        set({ isLoading: true, profile: null, entreprise: null })
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            set({ user: session.user, session })
            // Fetch profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
            if (profile) {
              set({ profile })
              // Fetch entreprise if company_admin
              if (profile.role === 'company_admin') {
                const { data: entreprise } = await supabase
                  .from('entreprises')
                  .select('*')
                  .eq('owner_id', session.user.id)
                  .single()
                set({ entreprise: entreprise ?? null })
              }
            }
          } else {
            set({ user: null, session: null })
          }
        } finally {
          set({ isLoading: false, isInitialized: true })
        }
      },

      logout: async () => {
        await supabase.auth.signOut()
        set({
          user: null,
          session: null,
          profile: null,
          entreprise: null,
        })
      },
    }),
    {
      name: 'cemac-auth',
      partialize: (state) => ({
        // Ne pas persister les données sensibles
        profile: state.profile,
        entreprise: state.entreprise,
      }),
    }
  )
)
