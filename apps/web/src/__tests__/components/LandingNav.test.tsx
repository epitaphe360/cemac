import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LandingNav } from '@/components/landing/LandingNav'

// ── Mocks ──────────────────────────────────────────────────────────────────
// vi.hoisted ensures the fn reference is available when mock factories run
const mockIsAuthenticated = vi.hoisted(() => vi.fn().mockReturnValue(false))

vi.mock('@/stores/auth.store', () => ({
  // useAuthStore is called WITHOUT a selector in LandingNav:
  //   const { isAuthenticated } = useAuthStore()
  useAuthStore: (selector?: (state: any) => any) => {
    const state = { isAuthenticated: mockIsAuthenticated }
    return selector ? selector(state) : state
  },
}))

// ── Helpers ────────────────────────────────────────────────────────────────
const renderNav = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <LandingNav />
    </MemoryRouter>,
  )

// ── Tests ──────────────────────────────────────────────────────────────────
describe('LandingNav — brand', () => {
  beforeEach(() => mockIsAuthenticated.mockReturnValue(false))

  it('renders the CEMAC INTEGRA brand text', () => {
    renderNav()
    expect(screen.getByText('CEMAC')).toBeInTheDocument()
    expect(screen.getByText(/INTEGRA/i)).toBeInTheDocument()
  })
})

describe('LandingNav — navigation links', () => {
  beforeEach(() => mockIsAuthenticated.mockReturnValue(false))

  it('renders Marketplace link', () => {
    renderNav()
    expect(screen.getByText(/Marketplace/i)).toBeInTheDocument()
  })

  it('renders Contact link', () => {
    renderNav()
    expect(screen.getByText(/Contact/i)).toBeInTheDocument()
  })

  it('renders Tarifs link', () => {
    renderNav()
    expect(screen.getByText(/Tarifs/i)).toBeInTheDocument()
  })

  it('renders À propos link', () => {
    renderNav()
    expect(screen.getByText(/propos/i)).toBeInTheDocument()
  })
})

describe('LandingNav — unauthenticated state', () => {
  beforeEach(() => mockIsAuthenticated.mockReturnValue(false))

  it('shows "Connexion" button when not logged in', () => {
    renderNav()
    expect(screen.getByText(/Connexion/)).toBeInTheDocument()
  })

  it('shows "Commencer gratuitement" CTA when not logged in', () => {
    renderNav()
    expect(screen.getByText(/Commencer gratuitement/i)).toBeInTheDocument()
  })
})

describe('LandingNav — authenticated state', () => {
  beforeEach(() => mockIsAuthenticated.mockReturnValue(true))
  afterEach(() => mockIsAuthenticated.mockReturnValue(false))

  it('shows "Tableau de bord" link when logged in', () => {
    renderNav()
    expect(screen.getByText(/Tableau de bord/i)).toBeInTheDocument()
  })

  it('hides "Connexion" button when logged in', () => {
    renderNav()
    expect(screen.queryByText(/^Connexion$/)).not.toBeInTheDocument()
  })
})

describe('LandingNav — language switcher', () => {
  beforeEach(() => mockIsAuthenticated.mockReturnValue(false))

  it('renders the language switcher button', () => {
    renderNav()
    expect(screen.getByText(/^FR$|^EN$/)).toBeInTheDocument()
  })

  it('opens language dropdown on click', async () => {
    renderNav()
    const user = userEvent.setup()
    const langButton = screen.getByText(/^FR$|^EN$/)
    await user.click(langButton)
    expect(screen.getByText(/Français/i)).toBeInTheDocument()
    expect(screen.getByText(/English/i)).toBeInTheDocument()
  })
})
