import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useAuthStore } from '@/stores/auth.store'

// Mock Supabase — must be hoisted above imports
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      signOut: vi.fn().mockResolvedValue({}),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}))

// Silence zustand persist storage warnings in test
vi.mock('zustand/middleware', async () => {
  const actual = await vi.importActual('zustand/middleware')
  return {
    ...actual,
    persist: (fn: unknown) => fn,
  }
})

const resetStore = () =>
  useAuthStore.setState({
    user: null,
    session: null,
    profile: null,
    entreprise: null,
    isLoading: false,
    isInitialized: false,
  })

describe('useAuthStore — initial state', () => {
  beforeEach(() => resetStore())

  it('starts unauthenticated', () => {
    const { result } = renderHook(() => useAuthStore())
    expect(result.current.isAuthenticated()).toBe(false)
  })

  it('initial role defaults to "public"', () => {
    const { result } = renderHook(() => useAuthStore())
    expect(result.current.role()).toBe('public')
  })

  it('isLoading starts false', () => {
    const { result } = renderHook(() => useAuthStore())
    expect(result.current.isLoading).toBe(false)
  })

  it('isInitialized starts false', () => {
    const { result } = renderHook(() => useAuthStore())
    expect(result.current.isInitialized).toBe(false)
  })
})

describe('useAuthStore — session management', () => {
  beforeEach(() => resetStore())

  it('isAuthenticated returns true after session is set', () => {
    const { result } = renderHook(() => useAuthStore())
    act(() => {
      result.current.setSession({ access_token: 'test-token', user: { id: 'u1' } } as any)
    })
    expect(result.current.isAuthenticated()).toBe(true)
  })

  it('isAuthenticated returns false after session cleared', () => {
    const { result } = renderHook(() => useAuthStore())
    act(() => {
      result.current.setSession({ access_token: 'test-token' } as any)
    })
    act(() => {
      result.current.setSession(null)
    })
    expect(result.current.isAuthenticated()).toBe(false)
  })
})

describe('useAuthStore — profile & role', () => {
  beforeEach(() => resetStore())

  it('role returns profile.role when profile is set', () => {
    const { result } = renderHook(() => useAuthStore())
    act(() => {
      result.current.setProfile({ role: 'company_admin', id: 'u1' } as any)
    })
    expect(result.current.role()).toBe('company_admin')
  })

  it('role returns "public" when profile is null', () => {
    const { result } = renderHook(() => useAuthStore())
    act(() => {
      result.current.setProfile(null)
    })
    expect(result.current.role()).toBe('public')
  })

  it('setUser stores the user', () => {
    const { result } = renderHook(() => useAuthStore())
    act(() => {
      result.current.setUser({ id: 'user-abc', email: 'test@cemac.com' } as any)
    })
    expect(result.current.user?.id).toBe('user-abc')
  })

  it('setEntreprise stores the entreprise', () => {
    const { result } = renderHook(() => useAuthStore())
    act(() => {
      result.current.setEntreprise({ id: 'ent-1', raison_sociale: 'CEMAC Corp' } as any)
    })
    expect(result.current.entreprise?.raison_sociale).toBe('CEMAC Corp')
  })
})

describe('useAuthStore — initialize()', () => {
  beforeEach(() => resetStore())

  it('sets isInitialized to true after initialize()', async () => {
    const { result } = renderHook(() => useAuthStore())
    await act(async () => {
      await result.current.initialize()
    })
    expect(result.current.isInitialized).toBe(true)
  })

  it('sets isLoading to false after initialize() completes', async () => {
    const { result } = renderHook(() => useAuthStore())
    await act(async () => {
      await result.current.initialize()
    })
    expect(result.current.isLoading).toBe(false)
  })
})

describe('useAuthStore — refreshEntreprise()', () => {
  beforeEach(() => resetStore())

  it('reloads the authenticated company lifecycle from Supabase', async () => {
    const { supabase } = await import('@/lib/supabase')
    const refreshed = {
      id: 'ent-1',
      owner_id: 'u1',
      subscription_plan: 'sme',
      subscription_status: 'active',
    }
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: refreshed, error: null }),
    } as any)
    useAuthStore.setState({
      user: { id: 'u1' } as any,
      profile: { id: 'u1', role: 'company_admin' } as any,
    })

    await act(async () => {
      await useAuthStore.getState().refreshEntreprise()
    })
    expect(useAuthStore.getState().entreprise).toMatchObject({
      subscription_status: 'active',
    })
  })
})

describe('useAuthStore — logout()', () => {
  beforeEach(() => resetStore())

  it('clears session and user on logout', async () => {
    const { result } = renderHook(() => useAuthStore())
    act(() => {
      result.current.setSession({ access_token: 'tok' } as any)
      result.current.setUser({ id: '1' } as any)
      result.current.setProfile({ role: 'company_admin' } as any)
    })
    await act(async () => {
      await result.current.logout()
    })
    expect(result.current.user).toBeNull()
    expect(result.current.session).toBeNull()
    expect(result.current.profile).toBeNull()
    expect(result.current.isAuthenticated()).toBe(false)
  })

  it('reverts role to public after logout', async () => {
    const { result } = renderHook(() => useAuthStore())
    act(() => {
      result.current.setProfile({ role: 'cemac_officer' } as any)
    })
    await act(async () => {
      await result.current.logout()
    })
    expect(result.current.role()).toBe('public')
  })

  it('clears entreprise on logout', async () => {
    const { result } = renderHook(() => useAuthStore())
    act(() => {
      result.current.setEntreprise({ id: 'ent-1', raison_sociale: 'Test Corp' } as any)
    })
    await act(async () => {
      await result.current.logout()
    })
    expect(result.current.entreprise).toBeNull()
  })

  it('isAuthenticated is false right after logout completes', async () => {
    const { result } = renderHook(() => useAuthStore())
    act(() => {
      result.current.setSession({ access_token: 'valid-tok', user: { id: 'u1' } } as any)
    })
    expect(result.current.isAuthenticated()).toBe(true)
    await act(async () => { await result.current.logout() })
    expect(result.current.isAuthenticated()).toBe(false)
  })
})

describe('useAuthStore — role guard logic', () => {
  beforeEach(() => resetStore())

  it('super_admin role is accessible', () => {
    const { result } = renderHook(() => useAuthStore())
    act(() => { result.current.setProfile({ role: 'super_admin', id: 'admin-1' } as any) })
    expect(result.current.role()).toBe('super_admin')
  })

  it('cemac_officer role is accessible', () => {
    const { result } = renderHook(() => useAuthStore())
    act(() => { result.current.setProfile({ role: 'cemac_officer', id: 'off-1' } as any) })
    expect(result.current.role()).toBe('cemac_officer')
  })

  it('auditor role is accessible', () => {
    const { result } = renderHook(() => useAuthStore())
    act(() => { result.current.setProfile({ role: 'auditor', id: 'aud-1' } as any) })
    expect(result.current.role()).toBe('auditor')
  })

  it('buyer role is accessible', () => {
    const { result } = renderHook(() => useAuthStore())
    act(() => { result.current.setProfile({ role: 'buyer', id: 'buyer-1' } as any) })
    expect(result.current.role()).toBe('buyer')
  })

  it('role changes are reflected immediately', () => {
    const { result } = renderHook(() => useAuthStore())
    act(() => { result.current.setProfile({ role: 'buyer', id: 'u' } as any) })
    expect(result.current.role()).toBe('buyer')
    act(() => { result.current.setProfile({ role: 'company_admin', id: 'u' } as any) })
    expect(result.current.role()).toBe('company_admin')
  })
})
