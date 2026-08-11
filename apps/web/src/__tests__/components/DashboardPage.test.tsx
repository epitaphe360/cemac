import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'dashboard.welcome':              'Bienvenue',
        'dashboard.company.badge':        'Pilotage entreprise',
        'dashboard.company.summary':      'Vue synthétique des dossiers, produits et flux récents.',
        'dashboard.company.recent_certifications': 'Certifications récentes',
        'dashboard.company.no_certifications': 'Aucune certification pour l\'instant',
        'dashboard.company.first_application': 'Déposer votre premier dossier',
        'dashboard.company.publish_product': 'Publier un produit',
        'dashboard.company.market_analysis': 'Analyse de marché',
        'dashboard.company.upgrade_title': 'Passez au plan PME',
        'dashboard.company.upgrade_description': 'Accédez à toutes les fonctionnalités : API, rapports IA, automatisation',
        'dashboard.company.upgrade_cta': 'Upgrader — 29 000 XAF/mois',
        'dashboard.stats.certifications': 'Certifications',
        'dashboard.stats.approved':       'Approuvées',
        'dashboard.stats.pending':        'En cours',
        'dashboard.stats.products':       'Produits',
        'dashboard.quick_actions':        'Actions rapides',
        'certification.new':              'Nouvelle certification',
        'common.view_all':                'Tout voir',
      }
      return map[key] ?? key
    },
    i18n: { language: 'fr', changeLanguage: vi.fn() },
  }),
}))

const mockEntreprise = vi.hoisted(() => ({
  id: 'ent-1',
  raison_sociale: 'AISC Cameroun SARL',
  pays: 'CM',
  plan: 'sme',
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector: (state: any) => any) =>
    selector({
      entreprise:  mockEntreprise,
      profile:     { id: 'u1', full_name: 'Jean Dupont', role: 'company_admin' },
      role:        () => 'company_admin',
      isAuthenticated: () => true,
    }),
}))

// Supabase mock: certifications + produits queries
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'certifications') {
        return {
          select: vi.fn().mockReturnThis(),
          eq:     vi.fn().mockReturnThis(),
          order:  vi.fn().mockReturnThis(),
          limit:  vi.fn().mockResolvedValue({
            data: [
              { id: 'c1', numero_dossier: 'CERT-001', produit_nom: 'Cacao brut', statut: 'approved', created_at: '2026-01-10T00:00:00Z' },
              { id: 'c2', numero_dossier: 'CERT-002', produit_nom: 'Café Robusta', statut: 'under_review', created_at: '2026-02-05T00:00:00Z' },
            ],
            count: null,
            error: null,
          }),
          // For stats query (no limit) — returns all certs
          then: vi.fn().mockImplementation((cb) => cb({ data: [
            { statut: 'approved' },
            { statut: 'under_review' },
            { statut: 'submitted' },
            { statut: 'draft' },
          ], error: null })),
        }
      }
      if (table === 'produits') {
        return {
          select: vi.fn().mockReturnThis(),
          eq:     vi.fn().mockReturnThis(),
          then:   vi.fn().mockImplementation((cb) => cb({ count: 7, error: null })),
        }
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() }
    }),
  },
}))

// ── Helpers ────────────────────────────────────────────────────────────────

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  )

// ── Tests ──────────────────────────────────────────────────────────────────

describe('DashboardPage — header', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders welcome message with user first name', () => {
    renderDashboard()
    expect(screen.getByText(/Bienvenue/i)).toBeInTheDocument()
    expect(screen.getByText(/Jean/i)).toBeInTheDocument()
  })

  it('renders the company name', () => {
    renderDashboard()
    expect(screen.getByText(/AISC Cameroun SARL/i)).toBeInTheDocument()
  })

  it('renders "Nouvelle certification" button', () => {
    renderDashboard()
    const links = screen.getAllByRole('link', { name: /nouvelle certification/i })
    expect(links.length).toBeGreaterThan(0)
    expect(links[0]).toBeInTheDocument()
  })
})

describe('DashboardPage — stat cards layout', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders exactly 4 stat card labels', () => {
    renderDashboard()
    // All 4 statsCards render with their translated labels
    expect(screen.getByText('Certifications')).toBeInTheDocument()
    expect(screen.getByText('Approuvées')).toBeInTheDocument()
    expect(screen.getByText('En cours')).toBeInTheDocument()
    expect(screen.getByText('Produits')).toBeInTheDocument()
  })
})

describe('DashboardPage — recent certifications section', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders "Certifications récentes" section heading', () => {
    renderDashboard()
    expect(screen.getByText(/certifications récentes/i)).toBeInTheDocument()
  })

  it('renders "Tout voir" link to /certifications', () => {
    renderDashboard()
    expect(screen.getByRole('link', { name: /tout voir/i })).toBeInTheDocument()
  })
})

describe('DashboardPage — quick access', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the quick access / upgrade section or action links', () => {
    renderDashboard()
    // The dashboard should contain navigation links
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThan(1)
  })
})
