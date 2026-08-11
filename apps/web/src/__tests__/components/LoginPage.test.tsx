import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { LoginPage } from '@/pages/auth/LoginPage'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

// ── Mocks (vi.hoisted ensures they exist before vi.mock factory runs) ───────
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

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
    },
  },
}))

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}))

// ── Helpers ────────────────────────────────────────────────────────────────
const renderLoginPage = () =>
  render(
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>,
  )

const signIn = vi.mocked(supabase.auth.signInWithPassword)
const mockToast = toast as unknown as { error: ReturnType<typeof vi.fn>; success: ReturnType<typeof vi.fn> }

// ── Tests ──────────────────────────────────────────────────────────────────
describe('LoginPage — rendering', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders email and password inputs', () => {
    renderLoginPage()
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument()
  })

  it('renders the submit button', () => {
    renderLoginPage()
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument()
  })

  it('has a link to the registration page', () => {
    renderLoginPage()
    expect(screen.getByRole('link', { name: /créer un compte/i })).toBeInTheDocument()
  })
})

describe('LoginPage — form validation', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows validation error when email is missing', async () => {
    renderLoginPage()
    const user = userEvent.setup()
    // Leave email empty — HTML5 has no "required" attr so it won't block submit,
    // but zod will catch empty string with "Email invalide"
    await user.type(screen.getByLabelText(/mot de passe/i), 'password123')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))
    await waitFor(() =>
      expect(screen.getByText(/email invalide/i)).toBeInTheDocument(),
    )
  })

  it('shows error for password shorter than 6 characters', async () => {
    renderLoginPage()
    const user = userEvent.setup()
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'test@cemac.com')
    await user.type(screen.getByLabelText(/mot de passe/i), '123')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))
    await waitFor(() =>
      expect(screen.getByText(/minimum 6/i)).toBeInTheDocument(),
    )
  })

  it('does not call supabase when email is empty', async () => {
    renderLoginPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /se connecter/i }))
    await waitFor(() => expect(signIn).not.toHaveBeenCalled())
  })
})

describe('LoginPage — submission', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls signInWithPassword with correct credentials', async () => {
    signIn.mockResolvedValueOnce({ data: { session: null, user: null }, error: null } as any)
    renderLoginPage()
    const user = userEvent.setup()
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'user@cemac.com')
    await user.type(screen.getByLabelText(/mot de passe/i), 'password123')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))
    await waitFor(() =>
      expect(signIn).toHaveBeenCalledWith({
        email: 'user@cemac.com',
        password: 'password123',
      }),
    )
  })

  it('calls initialize() and navigates to /dashboard on success', async () => {
    signIn.mockResolvedValueOnce({ data: { session: null, user: null }, error: null } as any)
    renderLoginPage()
    const user = userEvent.setup()
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'user@cemac.com')
    await user.type(screen.getByLabelText(/mot de passe/i), 'password123')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))
    await waitFor(() => {
      expect(mockInitialize).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('shows error toast when credentials are wrong', async () => {
    signIn.mockResolvedValueOnce({
      data: { session: null, user: null },
      error: { message: 'Invalid login credentials', name: 'AuthError', status: 400 } as any,
    })
    renderLoginPage()
    const user = userEvent.setup()
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'wrong@test.com')
    await user.type(screen.getByLabelText(/mot de passe/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))
    await waitFor(() =>
      expect(mockToast.error).toHaveBeenCalledWith('Email ou mot de passe incorrect'),
    )
  })

  it('does not navigate on auth failure', async () => {
    signIn.mockResolvedValueOnce({
      data: { session: null, user: null },
      error: { message: 'Invalid', name: 'AuthError', status: 400 } as any,
    })
    renderLoginPage()
    const user = userEvent.setup()
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'user@cemac.com')
    await user.type(screen.getByLabelText(/mot de passe/i), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))
    await waitFor(() => expect(mockNavigate).not.toHaveBeenCalled())
  })
})

describe('LoginPage — password visibility toggle', () => {
  beforeEach(() => vi.clearAllMocks())

  it('password field starts as type="password"', () => {
    renderLoginPage()
    expect(screen.getByLabelText(/mot de passe/i)).toHaveAttribute('type', 'password')
  })

  it('toggles to type="text" after clicking the eye button', async () => {
    renderLoginPage()
    const user = userEvent.setup()
    // The toggle button is type="button" and is NOT the submit button
    const allButtons = screen.getAllByRole('button')
    const toggleBtn = allButtons.find(
      (b) => !b.textContent?.match(/connexion/i) && b.getAttribute('type') === 'button',
    )
    expect(toggleBtn).toBeDefined()
    await user.click(toggleBtn!)
    expect(screen.getByLabelText(/mot de passe/i)).toHaveAttribute('type', 'text')
  })
})
