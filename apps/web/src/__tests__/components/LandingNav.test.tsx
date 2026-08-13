import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LandingNav } from '@/components/landing/LandingNav'

const mockIsAuthenticated = vi.hoisted(() => vi.fn().mockReturnValue(false))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector?: (state: { isAuthenticated: typeof mockIsAuthenticated }) => unknown) => {
    const state = { isAuthenticated: mockIsAuthenticated }
    return selector ? selector(state) : state
  },
}))

const renderNav = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <LandingNav />
    </MemoryRouter>,
  )

describe('LandingNav — brand', () => {
  beforeEach(() => mockIsAuthenticated.mockReturnValue(false))

  it('renders the CEMAC INTEGRA brand text', () => {
    renderNav()
    expect(screen.getAllByText(/CEMAC/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/INTEGRA/i).length).toBeGreaterThan(0)
  })
})

describe('LandingNav — navigation links', () => {
  beforeEach(() => mockIsAuthenticated.mockReturnValue(false))

  it('renders Accueil link', () => {
    renderNav()
    expect(screen.getAllByText(/Accueil|Home/i).length).toBeGreaterThan(0)
  })

  it('renders Pays link', () => {
    renderNav()
    expect(screen.getAllByText(/Pays|Countries/i).length).toBeGreaterThan(0)
  })

  it('renders Technologie link', () => {
    renderNav()
    expect(screen.getAllByText(/Technologie|Technology/i).length).toBeGreaterThan(0)
  })

  it('renders À propos link', () => {
    renderNav()
    expect(screen.getByText(/propos|About/i)).toBeInTheDocument()
  })
})

describe('LandingNav — unauthenticated state', () => {
  beforeEach(() => mockIsAuthenticated.mockReturnValue(false))

  it('shows sign-in button when not logged in', () => {
    renderNav()
    expect(screen.getByText(/Se connecter|Sign in/i)).toBeInTheDocument()
  })

  it('shows join platform CTA when not logged in', () => {
    renderNav()
    expect(screen.getByText(/Rejoindre la plateforme|Join the platform/i)).toBeInTheDocument()
  })
})

describe('LandingNav — authenticated state', () => {
  beforeEach(() => mockIsAuthenticated.mockReturnValue(true))
  afterEach(() => mockIsAuthenticated.mockReturnValue(false))

  it('shows dashboard link when logged in', () => {
    renderNav()
    expect(screen.getByText(/Tableau de bord|Dashboard/i)).toBeInTheDocument()
  })

  it('hides sign-in button when logged in', () => {
    renderNav()
    expect(screen.queryByText(/Se connecter|Sign in/i)).not.toBeInTheDocument()
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
