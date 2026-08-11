import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { CertificationListPage } from '@/pages/certification/CertificationListPage'

// ── Mocks ──────────────────────────────────────────────────────────────────

const MOCK_CERTS = vi.hoisted(() => [
  {
    id: 'c1',
    numero_dossier: 'CERT-2026-001',
    produit_nom: 'Cacao brut arabica',
    statut: 'approved',
    entreprise_id: 'ent-1',
    type_certification: 'bio',
    created_at: '2026-01-10T00:00:00Z',
    updated_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'c2',
    numero_dossier: 'CERT-2026-002',
    produit_nom: 'Café Robusta',
    statut: 'under_review',
    entreprise_id: 'ent-1',
    type_certification: 'commerce_equitable',
    created_at: '2026-02-05T00:00:00Z',
    updated_at: '2026-02-10T00:00:00Z',
  },
  {
    id: 'c3',
    numero_dossier: 'CERT-2026-003',
    produit_nom: 'Bois Okoumé',
    statut: 'draft',
    entreprise_id: 'ent-1',
    type_certification: 'sfc',
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
])

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector: (state: any) => any) =>
    selector({
      profile:    { id: 'u1', full_name: 'Jean Dupont', role: 'company_admin' },
      entreprise: { id: 'ent-1', raison_sociale: 'AISC Cameroun SARL' },
    }),
}))

const { mockSubscribe, mockChannel } = vi.hoisted(() => {
  const sub = vi.fn()
  return {
    mockSubscribe: sub,
    mockChannel: {
      on: vi.fn().mockReturnThis(),
      subscribe: sub,
    }
  }
})
vi.mock('@/lib/supabase', () => {
  const queryBuilder: any = {
    select: vi.fn().mockReturnThis(),
    eq:     vi.fn().mockReturnThis(),
    in:     vi.fn().mockReturnThis(),
    order:  vi.fn().mockReturnThis(),
    // Thenable: makes `await queryBuilder` resolve with mock data
    then:   (resolve: (v: unknown) => void) => resolve({ data: MOCK_CERTS, error: null }),
  }
  return {
    supabase: {
      from:          vi.fn().mockReturnValue(queryBuilder),
      channel:       vi.fn().mockReturnValue(mockChannel),
      removeChannel: vi.fn(),
    },
  }
})

// ── Helpers ────────────────────────────────────────────────────────────────

const renderCertList = () =>
  render(
    <MemoryRouter>
      <CertificationListPage />
    </MemoryRouter>,
  )

// ── Tests ──────────────────────────────────────────────────────────────────

describe('CertificationListPage — header', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders "Certifications" page title', async () => {
    renderCertList()
    expect(await screen.findByRole('heading', { name: /certifications/i })).toBeInTheDocument()
  })

  it('renders "Nouveau dossier" button', async () => {
    renderCertList()
    const link = await screen.findByRole('link', { name: /nouveau dossier/i })
    expect(link).toBeInTheDocument()
  })
})

describe('CertificationListPage — list display', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders all 3 loaded certifications', async () => {
    renderCertList()
    expect(await screen.findByText('Cacao brut arabica')).toBeInTheDocument()
    expect(await screen.findByText('Café Robusta')).toBeInTheDocument()
    expect(await screen.findByText('Bois Okoumé')).toBeInTheDocument()
  })

  it('renders certification dossier numbers', async () => {
    renderCertList()
    expect(await screen.findByText(/CERT-2026-001/)).toBeInTheDocument()
    expect(await screen.findByText(/CERT-2026-002/)).toBeInTheDocument()
  })
})

describe('CertificationListPage — search filter', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders search input', async () => {
    renderCertList()
    await screen.findByText('Cacao brut arabica') // wait for data
    const searchInput = screen.getByPlaceholderText(/rechercher/i)
    expect(searchInput).toBeInTheDocument()
  })

  it('filters results by product name on input', async () => {
    renderCertList()
    await screen.findByText('Cacao brut arabica')

    const user = userEvent.setup()
    const searchInput = screen.getByPlaceholderText(/rechercher/i)
    await user.type(searchInput, 'Cacao')

    expect(screen.getByText('Cacao brut arabica')).toBeInTheDocument()
    expect(screen.queryByText('Café Robusta')).not.toBeInTheDocument()
    expect(screen.queryByText('Bois Okoumé')).not.toBeInTheDocument()
  })

  it('filters by dossier number', async () => {
    renderCertList()
    await screen.findByText('CERT-2026-001')

    const user = userEvent.setup()
    const searchInput = screen.getByPlaceholderText(/rechercher/i)
    await user.type(searchInput, 'CERT-2026-003')

    expect(screen.getByText('Bois Okoumé')).toBeInTheDocument()
    expect(screen.queryByText('Cacao brut arabica')).not.toBeInTheDocument()
  })
})

describe('CertificationListPage — status filter', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders status filter dropdown', async () => {
    renderCertList()
    await screen.findByText('Cacao brut arabica')
    const filterSelect = screen.getByRole('combobox')
    expect(filterSelect).toBeInTheDocument()
  })

  it('filters by approved status', async () => {
    renderCertList()
    await screen.findByText('Cacao brut arabica')

    const user = userEvent.setup()
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'approved')

    expect(screen.getByText('Cacao brut arabica')).toBeInTheDocument()
    expect(screen.queryByText('Café Robusta')).not.toBeInTheDocument()
  })
})

describe('CertificationListPage — empty state', () => {
  it('shows empty state message when entreprise has no certifications', async () => {
    const { supabase } = await import('@/lib/supabase')
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      in:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockReturnThis(),
      then:   (resolve: (v: unknown) => void) => resolve({ data: [], error: null }),
    } as any)
    renderCertList()
    await screen.findByText(/0 dossier/i)
  })
})
