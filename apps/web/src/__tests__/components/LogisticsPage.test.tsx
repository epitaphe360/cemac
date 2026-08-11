import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LogisticsPage } from '@/pages/logistics/LogisticsPage'

// ── Mock jsPDF (heavy PDF lib) ─────────────────────────────────────────────
vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    setFontSize:  vi.fn(),
    setFont:      vi.fn(),
    setTextColor: vi.fn(),
    setFillColor: vi.fn(),
    rect:         vi.fn(),
    text:         vi.fn(),
    line:         vi.fn(),
    addPage:      vi.fn(),
    save:         vi.fn(),
    output:       vi.fn().mockReturnValue(''),
  })),
}))

// ── Mock supabase ──────────────────────────────────────────────────────────
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      in:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockReturnThis(),
      then:   (resolve: (v: unknown) => void) => resolve({ data: [], error: null }),
    })),
    channel:       vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn(),
  },
}))

// ── Auth store mock ────────────────────────────────────────────────────────
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector: (state: any) => any) =>
    selector({
      profile:    { id: 'u1', full_name: 'Jean Dupont', role: 'company_admin' },
      entreprise: { id: 'ent-1', raison_sociale: 'AISC Cameroun SARL', pays: 'CM' },
    }),
}))

const renderLogistics = () =>
  render(
    <MemoryRouter>
      <LogisticsPage />
    </MemoryRouter>,
  )

describe('LogisticsPage — header', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the page title', async () => {
    renderLogistics()
    expect(await screen.findByText(/logistique/i)).toBeInTheDocument()
  })

  it('renders the three main tabs', async () => {
    renderLogistics()
    await screen.findByText(/logistique/i)
    expect(screen.getByRole('button', { name: /tableau de bord/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /règles d'origine/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /eur\.1/i })).toBeInTheDocument()
  })
})

describe('LogisticsPage — calculator tab', () => {
  beforeEach(() => vi.clearAllMocks())

  it('switches to calculator tab and shows product name field', async () => {
    renderLogistics()
    const user = userEvent.setup()
    const calcTab = await screen.findByRole('button', { name: /règles d'origine/i })
    await user.click(calcTab)
    const headings = await screen.findAllByText(/calculateur de règles d'origine/i)
    expect(headings.length).toBeGreaterThan(0)
  })

  it('shows the calculate button in calculator tab', async () => {
    renderLogistics()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /règles d'origine/i }))
    expect(await screen.findByRole('button', { name: /calculer/i })).toBeInTheDocument()
  })
})

describe('LogisticsPage — EUR.1 tab', () => {
  beforeEach(() => vi.clearAllMocks())

  it('switches to EUR.1 tab and shows the title', async () => {
    renderLogistics()
    const user = userEvent.setup()
    const eur1Tab = await screen.findByRole('button', { name: /eur\.1/i })
    await user.click(eur1Tab)
    expect(await screen.findByText(/demande de certificat eur\.1/i)).toBeInTheDocument()
  })
})

describe('LogisticsPage — dashboard tab', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows corridors title in dashboard', async () => {
    renderLogistics()
    expect(await screen.findByText(/corridors cemac/i)).toBeInTheDocument()
  })

  it('shows alerts title in dashboard', async () => {
    renderLogistics()
    expect(await screen.findByText(/alertes douanières/i)).toBeInTheDocument()
  })
})
