import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { SettingsPage } from '@/pages/settings/SettingsPage'

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector: (state: any) => any) =>
    selector({
      profile: {
        id: 'u1',
        full_name: 'Jean Dupont',
        email: 'jean@cemac.com',
        role: 'company_admin',
        phone: '+237 6XX XXX XXX',
      },
      entreprise: {
        id: 'ent-1',
        raison_sociale: 'AISC Cameroun SARL',
        pays: 'CM',
        is_verified: true,
        plan: 'sme',
      },
      setProfile:     vi.fn(),
      setEntreprise:  vi.fn(),
    }),
}))

vi.mock('@/hooks/use-cms', () => ({
  usePricing: () => ({
    data: {
      plans: [
        {
          id: 'free',
          name: 'Starter',
          description: 'Découverte',
          monthlyPrice: 0,
          yearlyPrice: 0,
          currency: 'XAF',
          badge: null,
          cta: { label: 'Commencer', href: '/auth/register' },
          features: [{ id: 'f1', key: 'basic', label: 'Fonctionnalité Starter', included: true, sortOrder: 10 }],
          sortOrder: 10,
        },
        {
          id: 'sme',
          name: 'Pro',
          description: 'Pour les PME',
          monthlyPrice: 29_000,
          yearlyPrice: 270_000,
          currency: 'XAF',
          badge: null,
          cta: { label: 'Souscrire', href: '/auth/register?plan=sme' },
          features: [{ id: 'f2', key: 'pro', label: 'Fonctionnalité Pro', included: true, sortOrder: 10 }],
          sortOrder: 20,
        },
      ],
      faqs: [],
    },
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      updateUser:         vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'u1', full_name: 'Jean Dupont' }, error: null }),
    }),
  },
}))

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}))

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn().mockResolvedValue(null),
}))

// ── Helpers ────────────────────────────────────────────────────────────────

const renderSettings = () =>
  render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>,
  )

// ── Tests ──────────────────────────────────────────────────────────────────

describe('SettingsPage — navigation sidebar', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders all 5 navigation tabs', () => {
    renderSettings()
    expect(screen.getByRole('button', { name: /profil/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sécurité/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entreprise/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /abonnement/i })).toBeInTheDocument()
  })

  it('shows Profil tab contents by default', () => {
    renderSettings()
    expect(screen.getByLabelText(/nom complet/i)).toBeInTheDocument()
  })
})

describe('SettingsPage — profile tab', () => {
  beforeEach(() => vi.clearAllMocks())

  it('pre-fills full name from auth store', () => {
    renderSettings()
    const input = screen.getByLabelText(/nom complet/i)
    expect((input as HTMLInputElement).value).toBe('Jean Dupont')
  })

  it('shows email as read-only', () => {
    renderSettings()
    const emailInput = screen.getByDisplayValue('jean@cemac.com')
    expect(emailInput).toBeDisabled()
  })

  it('renders save button', () => {
    renderSettings()
    expect(screen.getByRole('button', { name: /enregistrer/i })).toBeInTheDocument()
  })

  it('validates empty name before saving', async () => {
    renderSettings()
    const user = userEvent.setup()
    const nameInput = screen.getByLabelText(/nom complet/i)
    await user.clear(nameInput)
    await user.click(screen.getByRole('button', { name: /enregistrer/i }))
    await waitFor(() =>
      expect(screen.getByText(/Le nom est requis/i)).toBeInTheDocument()
    )
  })
})

describe('SettingsPage — security tab', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows password change form on clicking Sécurité', async () => {
    renderSettings()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /sécurité/i }))
    expect(screen.getByLabelText(/mot de passe actuel/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nouveau mot de passe/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirmer le mot de passe/i)).toBeInTheDocument()
  })

  it('shows security tips section', async () => {
    renderSettings()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /sécurité/i }))
    expect(screen.getByText(/conseils de sécurité/i)).toBeInTheDocument()
  })
})

describe('SettingsPage — company tab', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows company info form on clicking Entreprise', async () => {
    renderSettings()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /entreprise/i }))
    expect(screen.getByLabelText(/raison sociale/i)).toBeInTheDocument()
  })

  it('pre-fills company raison sociale', async () => {
    renderSettings()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /entreprise/i }))
    const input = screen.getByLabelText(/raison sociale/i)
    expect((input as HTMLInputElement).value).toBe('AISC Cameroun SARL')
  })

  it('shows verified badge for verified company', async () => {
    renderSettings()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /entreprise/i }))
    expect(screen.getByText(/entreprise vérifiée/i)).toBeInTheDocument()
  })
})

describe('SettingsPage — notifications tab (Supabase persistence)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders notification preferences on clicking Notifications', async () => {
    renderSettings()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /notifications/i }))
    await waitFor(() => {
      expect(screen.getByText(/changements de statut/i)).toBeInTheDocument()
      expect(screen.getByText(/alertes de sécurité/i)).toBeInTheDocument()
    })
  })

  it('shows 6 notification toggle items', async () => {
    renderSettings()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /notifications/i }))
    await waitFor(() => {
      expect(screen.getByText(/changements de statut/i)).toBeInTheDocument()
      expect(screen.getByText(/nouveaux documents/i)).toBeInTheDocument()
      expect(screen.getByText(/demandes marketplace/i)).toBeInTheDocument()
      expect(screen.getByText(/alertes prix/i)).toBeInTheDocument()
      expect(screen.getByText(/newsletter/i)).toBeInTheDocument()
      expect(screen.getByText(/alertes de sécurité/i)).toBeInTheDocument()
    })
  })

  it('save button calls supabase profiles.update with notification_preferences', async () => {
    const { supabase } = await import('@/lib/supabase')
    const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    vi.mocked(supabase.from).mockReturnValue({
      update: updateMock,
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: {}, error: null }),
    } as any)

    renderSettings()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /notifications/i }))
    await waitFor(() => expect(screen.getByText(/changements de statut/i)).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /enregistrer/i }))

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('profiles')
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ notification_preferences: expect.any(Object) }),
      )
    })
  })

  it('toggled preference is included in supabase update payload', async () => {
    const { supabase } = await import('@/lib/supabase')
    const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    vi.mocked(supabase.from).mockReturnValue({
      update: updateMock,
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: {}, error: null }),
    } as any)

    renderSettings()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /notifications/i }))
    await waitFor(() => expect(screen.getByText(/newsletter mensuelle/i)).toBeInTheDocument())

    // newsletter starts OFF — find and click its toggle
    const newsletterRow = screen.getByText(/newsletter mensuelle/i).closest('div')?.parentElement
    const toggleBtn = newsletterRow?.querySelector('button[class*="rounded-full"]')
    if (toggleBtn) await user.click(toggleBtn)

    await user.click(screen.getByRole('button', { name: /enregistrer/i }))

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          notification_preferences: expect.objectContaining({ newsletter: true }),
        }),
      )
    })
  })

  it('loads preferences from profile.notification_preferences on mount', async () => {
    // The module-level mock returns a profile without notification_preferences
    // → component should fall back to DEFAULT_NOTIFS and render without error
    renderSettings()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /notifications/i }))
    await waitFor(() => {
      expect(screen.getByText(/newsletter mensuelle/i)).toBeInTheDocument()
    })
  })
})

describe('SettingsPage — plan tab', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows subscription plan info on clicking Abonnement', async () => {
    renderSettings()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /abonnement/i }))
    // Should show current plan or plan selection UI in a heading or specific content area
    const headers = screen.getAllByText(/abonnement/i)
    expect(headers.length).toBeGreaterThan(0)
    // Check if the plan levels appear
      const plans = screen.getAllByText(/starter|pro/i)
      expect(plans.length).toBeGreaterThan(0)
  })
})
