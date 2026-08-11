import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { VerifyCertificationPage } from '@/pages/verify/VerifyCertificationPage'

// ── Mock QRCode library ────────────────────────────────────────────────────
vi.mock('qrcode', () => ({
  default: { toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mock') },
}))

// ── Mock supabase ──────────────────────────────────────────────────────────
const mockSingle = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      single: mockSingle,
    })),
  },
}))

const MOCK_CERT = {
  id: 'cert-123',
  numero_dossier: 'CERT-2026-001',
  produit_nom: 'Cacao Arabica Bio',
  statut: 'approved',
  type_certification: 'bio',
  created_at: '2026-01-10T00:00:00Z',
  updated_at: '2026-01-15T00:00:00Z',
  date_expiration: '2027-01-10T00:00:00Z',
  approved_at: '2026-01-15T00:00:00Z',
  valeur_ajoutee_locale: 60,
  entreprises: { raison_sociale: 'AISC Cameroun SARL', pays: 'CM' },
}

const renderVerifyPage = (id = 'cert-123') =>
  render(
    <MemoryRouter initialEntries={[`/verify/${id}`]}>
      <Routes>
        <Route path="/verify/:id" element={<VerifyCertificationPage />} />
      </Routes>
    </MemoryRouter>,
  )

describe('VerifyCertificationPage — approved cert', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSingle.mockResolvedValue({ data: MOCK_CERT, error: null })
  })

  it('shows the product name after loading', async () => {
    renderVerifyPage()
    expect(await screen.findByText('Cacao Arabica Bio')).toBeInTheDocument()
  })

  it('shows the dossier number', async () => {
    renderVerifyPage()
    expect(await screen.findByText('CERT-2026-001')).toBeInTheDocument()
  })

  it('shows the company name', async () => {
    renderVerifyPage()
    expect(await screen.findByText('AISC Cameroun SARL')).toBeInTheDocument()
  })
})

describe('VerifyCertificationPage — not found', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } })
  })

  it('shows not-found title when cert does not exist', async () => {
    renderVerifyPage('unknown-id')
    expect(await screen.findByText(/certification introuvable/i)).toBeInTheDocument()
  })

  it('shows back-home link', async () => {
    renderVerifyPage('unknown-id')
    expect(await screen.findByRole('link', { name: /retour/i })).toBeInTheDocument()
  })
})
