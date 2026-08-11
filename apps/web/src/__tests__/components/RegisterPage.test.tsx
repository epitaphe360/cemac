import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

// ── Mocks ──────────────────────────────────────────────────────────────────
const mockNavigate = vi.hoisted(() => vi.fn())
const mockInitialize = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector: (state: any) => any) =>
    selector({ initialize: mockInitialize }),
}))

vi.mock('@/hooks/use-cms', () => ({
  usePricing: () => ({
    data: { plans: [], faqs: [] },
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
    },
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}))

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}))

// ── Helpers ────────────────────────────────────────────────────────────────
const renderRegisterPage = () =>
  render(
    <BrowserRouter>
      <RegisterPage />
    </BrowserRouter>,
  )

const signUp = vi.mocked(supabase.auth.signUp)
const mockToast = toast as unknown as { error: ReturnType<typeof vi.fn>; success: ReturnType<typeof vi.fn> }

/** Fill step 1 with valid data and advance to step 2 */
const completeStep1 = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByRole('textbox', { name: /email/i }), `co${Date.now()}@test.com`)
  await user.type(screen.getByLabelText(/mot de passe/i), 'Secure123!')
  await user.type(screen.getByRole('textbox', { name: /nom complet/i }), 'Jean Dupont')
  // Select Cameroun from the <select id="country"> dropdown
  await user.selectOptions(screen.getByLabelText(/pays/i), 'CM')
  await user.click(screen.getByRole('button', { name: /suivant/i }))
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe('RegisterPage — step 1 rendering', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows email, password, and name fields on step 1', () => {
    renderRegisterPage()
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /nom complet/i })).toBeInTheDocument()
  })

  it('has a "Suivant" button on step 1', () => {
    renderRegisterPage()
    expect(screen.getByRole('button', { name: /suivant/i })).toBeInTheDocument()
  })

  it('has a link to the login page ("Se connecter")', () => {
    renderRegisterPage()
    expect(screen.getByRole('link', { name: /se connecter/i })).toBeInTheDocument()
  })

  it('shows the CEMAC countries in the country dropdown', () => {
    renderRegisterPage()
    const countrySelect = screen.getByLabelText(/pays/i)
    expect(countrySelect).toBeInTheDocument()
    expect(countrySelect).toContainHTML('CM')
  })
})

describe('RegisterPage — step 1 validation', () => {
  beforeEach(() => vi.clearAllMocks())

  it('blocks progression with empty email', async () => {
    renderRegisterPage()
    const user = userEvent.setup()
    // Leave email empty and click Suivant — zod catches empty string
    await user.click(screen.getByRole('button', { name: /suivant/i }))
    await waitFor(() => expect(screen.getByText(/email invalide/i)).toBeInTheDocument())
  })

  it('blocks progression when email is empty (no email entered)', async () => {
    renderRegisterPage()
    const user = userEvent.setup()
    // Leave email blank, fill other fields — zod catches empty string
    await user.type(screen.getByLabelText(/mot de passe/i), 'ValidPass1!')
    await user.type(screen.getByRole('textbox', { name: /nom complet/i }), 'Jean Dupont')
    await user.click(screen.getByRole('button', { name: /suivant/i }))
    await waitFor(() => expect(screen.getByText(/email invalide/i)).toBeInTheDocument())
  })

  it('blocks progression with password shorter than 8 chars', async () => {
    renderRegisterPage()
    const user = userEvent.setup()
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'test@test.com')
    await user.type(screen.getByLabelText(/mot de passe/i), '1234')
    await user.click(screen.getByRole('button', { name: /suivant/i }))
    await waitFor(() => expect(screen.getByText(/minimum 8/i)).toBeInTheDocument())
  })

  it('blocks progression with name shorter than 2 chars', async () => {
    renderRegisterPage()
    const user = userEvent.setup()
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'test@test.com')
    await user.type(screen.getByLabelText(/mot de passe/i), 'ValidPass1!')
    await user.type(screen.getByRole('textbox', { name: /nom complet/i }), 'X')
    await user.click(screen.getByRole('button', { name: /suivant/i }))
    await waitFor(() => expect(screen.getByText(/nom requis/i)).toBeInTheDocument())
  })
})

describe('RegisterPage — step 1 → step 2 navigation', () => {
  beforeEach(() => vi.clearAllMocks())

  it('advances to step 2 after valid step 1 (shows Raison sociale)', async () => {
    renderRegisterPage()
    const user = userEvent.setup()
    await completeStep1(user)
    await waitFor(
      () =>
        expect(screen.getByLabelText(/raison sociale/i)).toBeInTheDocument(),
      { timeout: 5000 },
    )
  })

  it('shows "Votre entreprise" heading on step 2', async () => {
    renderRegisterPage()
    const user = userEvent.setup()
    await completeStep1(user)
    await waitFor(() =>
      expect(screen.getByText(/votre entreprise/i)).toBeInTheDocument(),
    )
  })

  it('"← Retour" button goes back to step 1', async () => {
    renderRegisterPage()
    const user = userEvent.setup()
    await completeStep1(user)
    await waitFor(() => screen.getByRole('button', { name: /retour/i }))
    await user.click(screen.getByRole('button', { name: /retour/i }))
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument(),
    )
  })
})

describe('RegisterPage — submission', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls supabase.auth.signUp on final form submit', async () => {
    signUp.mockResolvedValueOnce({
      data: { user: { id: 'new-user-id' } as any, session: null },
      error: null,
    })
    renderRegisterPage()
    const user = userEvent.setup()
    await completeStep1(user)
    const raisonInput = await screen.findByLabelText(/raison sociale/i)
    await user.type(raisonInput, 'CEMAC Corp SARL')
    await user.click(screen.getByRole('button', { name: /créer le compte/i }))
    await waitFor(() =>
      expect(signUp).toHaveBeenCalledWith(
        expect.objectContaining({ email: expect.stringContaining('@test.com') }),
      ),
    )
  })

  it('shows error toast when signUp fails', async () => {
    signUp.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Email already registered', name: 'AuthError', status: 422 } as any,
    })
    renderRegisterPage()
    const user = userEvent.setup()
    await completeStep1(user)
    const raisonInput = await screen.findByLabelText(/raison sociale/i)
    await user.type(raisonInput, 'Test Corp')
    await user.click(screen.getByRole('button', { name: /créer le compte/i }))
    await waitFor(() => expect(mockToast.error).toHaveBeenCalled())
  })
})
