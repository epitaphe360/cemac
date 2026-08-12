import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LogisticsPage } from '@/pages/logistics/LogisticsPage'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: (resolve: (value: unknown) => void) => resolve({ data: [], error: null }),
    })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn(),
  },
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      profile: { id: 'u1', full_name: 'Jean Dupont', role: 'company_admin' },
      entreprise: {
        id: 'ent-1',
        raison_sociale: 'AISC Cameroun SARL',
        pays: 'CM',
        subscription_plan: 'free',
        subscription_status: 'inactive',
      },
    }),
}))

const renderLogistics = () =>
  render(
    <MemoryRouter>
      <LogisticsPage />
    </MemoryRouter>,
  )

describe('LogisticsPage — expeditions list', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the expeditions title', async () => {
    renderLogistics()
    expect(await screen.findByText(/expéditions et convois/i)).toBeInTheDocument()
  })

  it('shows plan requirement for free company admins', async () => {
    renderLogistics()
    expect(await screen.findByText(/abonnement enterprise ou institutional/i)).toBeInTheDocument()
  })

  it('renders KPI labels for real expedition tracking', async () => {
    renderLogistics()
    expect(await screen.findByText(/^total$/i)).toBeInTheDocument()
    expect(screen.getAllByText(/en transit/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/^livrées$/i).length).toBeGreaterThan(0)
  })
})
