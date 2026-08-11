import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CertificationDetailPage } from '@/pages/certification/CertificationDetailPage'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeCert(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cert-abc',
    numero_dossier: 'CERT-2026-042',
    produit_nom: 'Cacao bio',
    entreprise_id: 'ent-1',
    type_certification: 'bio',
    statut: 'draft',
    date_soumission: null,
    qr_code_data: null,
    notes_agent: null,
    notes_commission: null,
    date_approbation: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
    ...overrides,
  }
}

// ── Supabase mock factory ────────────────────────────────────────────────────

const { mockUpdate, mockInsert, mockFrom } = vi.hoisted(() => ({
  mockUpdate: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
  mockInsert: vi.fn().mockResolvedValue({ error: null }),
  mockFrom: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'cert-abc/file.pdf' }, error: null }),
      }),
    },
  },
}))

vi.mock('qrcode', () => ({
  default: { toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,FAKE') },
}))

vi.mock('@/lib/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/constants')>()
  return { ...actual, SUPABASE_URL: 'https://fake.supabase.co' }
})

// ── Auth store mock (role-switchable) ────────────────────────────────────────

let mockProfile = { id: 'user-1', full_name: 'Test User', role: 'company_admin', country: 'CM' }

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ profile: mockProfile }),
}))

// ── Render helper ────────────────────────────────────────────────────────────

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/certification/cert-abc']}>
      <Routes>
        <Route path="/certification/:id" element={<CertificationDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function setupSupabaseMock(cert: ReturnType<typeof makeCert>) {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'certifications') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: cert, error: null }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }
    }
    if (table === 'workflow_events') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        insert: mockInsert,
      }
    }
    if (table === 'documents') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        insert: mockInsert,
      }
    }
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: mockUpdate,
      insert: mockInsert,
    }
  })
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('CertificationDetailPage — workflow transitions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── T1: company_admin submits draft ──────────────────────────────────────

  it('T1 — company_admin sees Submit button when cert is draft', async () => {
    mockProfile = { id: 'user-1', full_name: 'Amina Bello', role: 'company_admin', country: 'CM' }
    setupSupabaseMock(makeCert({ statut: 'draft' }))

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Soumettre le dossier')).toBeInTheDocument()
    })
  })

  it('T1 — clicking Submit calls certifications.update with statut=submitted', async () => {
    mockProfile = { id: 'user-1', full_name: 'Amina Bello', role: 'company_admin', country: 'CM' }
    const certUpdateEq = vi.fn().mockResolvedValue({ error: null })
    const certUpdate = vi.fn().mockReturnValue({ eq: certUpdateEq })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'certifications') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: makeCert({ statut: 'draft' }), error: null }),
          update: certUpdate,
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      }
    })

    renderPage()
    await screen.findByText('Soumettre le dossier')
    await userEvent.click(screen.getByText('Soumettre le dossier'))

    await waitFor(() => {
      expect(certUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ statut: 'submitted' }),
      )
    })
  })

  // ── T2: chamber_agent takes charge (submitted → under_review) ────────────

  it('T2 — chamber_agent sees Prendre en charge button when statut=submitted', async () => {
    mockProfile = { id: 'user-2', full_name: 'Kébé Diallo', role: 'chamber_agent', country: 'CM' }
    setupSupabaseMock(makeCert({ statut: 'submitted' }))

    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/Prendre en charge/i)).toBeInTheDocument()
    })
  })

  it('T2 — chamber_agent action calls update with statut=under_review', async () => {
    mockProfile = { id: 'user-2', full_name: 'Kébé Diallo', role: 'chamber_agent', country: 'CM' }

    const certUpdateEq = vi.fn().mockResolvedValue({ error: null })
    const certUpdate = vi.fn().mockReturnValue({ eq: certUpdateEq })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'certifications') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: makeCert({ statut: 'submitted' }), error: null }),
          update: certUpdate,
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      }
    })

    renderPage()
    await screen.findByText(/Prendre en charge/i)
    await userEvent.click(screen.getByText(/Prendre en charge/i))

    await waitFor(() => {
      expect(certUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ statut: 'under_review' }),
      )
    })
  })

  // ── T3: auditor launches field validation (under_review → field_validation) ─

  it('T3 — auditor sees Lancer visite terrain button when statut=under_review', async () => {
    mockProfile = { id: 'user-3', full_name: 'Paul Nguema', role: 'auditor', country: 'CM' }
    setupSupabaseMock(makeCert({ statut: 'under_review' }))

    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/Lancer visite terrain/i)).toBeInTheDocument()
    })
  })

  it('T3 — auditor field_validation action calls update with statut=field_validation', async () => {
    mockProfile = { id: 'user-3', full_name: 'Paul Nguema', role: 'auditor', country: 'CM' }

    const certUpdateEq = vi.fn().mockResolvedValue({ error: null })
    const certUpdate = vi.fn().mockReturnValue({ eq: certUpdateEq })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'certifications') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: makeCert({ statut: 'under_review' }), error: null }),
          update: certUpdate,
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      }
    })

    renderPage()
    await screen.findByText(/Lancer visite terrain/i)
    await userEvent.click(screen.getByText(/Lancer visite terrain/i))

    await waitFor(() => {
      expect(certUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ statut: 'field_validation' }),
      )
    })
  })

  // ── T4: auditor submits audit to commission (field_validation → commission_review) ─

  it('T4 — auditor sees Rapport audit section with file picker when statut=field_validation', async () => {
    mockProfile = { id: 'user-3', full_name: 'Paul Nguema', role: 'auditor', country: 'CM' }
    setupSupabaseMock(makeCert({ statut: 'field_validation' }))

    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/Rapport.*audit/i)).toBeInTheDocument()
      expect(screen.getByText(/Joindre le rapport/i)).toBeInTheDocument()
    })
  })

  it('T4 — Transmettre button is disabled without notes', async () => {
    mockProfile = { id: 'user-3', full_name: 'Paul Nguema', role: 'auditor', country: 'CM' }
    setupSupabaseMock(makeCert({ statut: 'field_validation' }))

    renderPage()

    await waitFor(() => {
      const btn = screen.getByText(/Transmettre.*Commission/i).closest('button')
      expect(btn).toBeDisabled()
    })
  })

  it('T4 — auditor audit submit calls update with statut=commission_review', async () => {
    mockProfile = { id: 'user-3', full_name: 'Paul Nguema', role: 'auditor', country: 'CM' }

    const certUpdateEq = vi.fn().mockResolvedValue({ error: null })
    const certUpdate = vi.fn().mockReturnValue({ eq: certUpdateEq })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'certifications') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: makeCert({ statut: 'field_validation' }), error: null }),
          update: certUpdate,
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      }
    })

    renderPage()
    await screen.findByText(/Transmettre.*Commission/i)

    // Enter notes to enable the button
    const textarea = screen.getAllByRole('textbox')[0]
    await userEvent.type(textarea, 'Visite effectuée, conformité confirmée.')

    const btn = screen.getByText(/Transmettre.*Commission/i).closest('button')!
    expect(btn).not.toBeDisabled()
    await userEvent.click(btn)

    await waitFor(() => {
      expect(certUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ statut: 'commission_review' }),
      )
    })
  })

  // ── T5: cemac_officer approves (commission_review → approved) ────────────

  it('T5 — cemac_officer sees Commission decision card when statut=commission_review', async () => {
    mockProfile = { id: 'user-5', full_name: 'Mireille Ondo', role: 'cemac_officer', country: 'CM' }
    setupSupabaseMock(makeCert({ statut: 'commission_review' }))

    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/Décision de la Commission/i)).toBeInTheDocument()
    })
  })

  it('T5 — cemac_officer approve calls update with statut=approved and qr_code_data', async () => {
    mockProfile = { id: 'user-5', full_name: 'Mireille Ondo', role: 'cemac_officer', country: 'CM' }

    const certUpdateEq = vi.fn().mockResolvedValue({ error: null })
    const certUpdate = vi.fn().mockReturnValue({ eq: certUpdateEq })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'certifications') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: makeCert({ statut: 'commission_review' }), error: null }),
          update: certUpdate,
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      }
    })

    renderPage()
    const approveBtn = await screen.findByText(/Approuver/i)
    await userEvent.click(approveBtn)

    await waitFor(() => {
      expect(certUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          statut: 'approved',
          qr_code_data: expect.stringContaining('/verify/cert-abc'),
        }),
      )
    })
  })

  it('T5 — cemac_officer reject calls update with statut=rejected', async () => {
    mockProfile = { id: 'user-5', full_name: 'Mireille Ondo', role: 'cemac_officer', country: 'CM' }

    const certUpdateEq = vi.fn().mockResolvedValue({ error: null })
    const certUpdate = vi.fn().mockReturnValue({ eq: certUpdateEq })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'certifications') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: makeCert({ statut: 'commission_review' }), error: null }),
          update: certUpdate,
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      }
    })

    renderPage()
    const rejectBtn = await screen.findByText(/Rejeter/i)
    await userEvent.click(rejectBtn)

    await waitFor(() => {
      expect(certUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ statut: 'rejected' }),
      )
    })
  })

  // ── T6: Role isolation — wrong role sees nothing ────────────────────────

  it('T6 — company_admin sees no action card when statut=commission_review', async () => {
    mockProfile = { id: 'user-1', full_name: 'Amina Bello', role: 'company_admin', country: 'CM' }
    setupSupabaseMock(makeCert({ statut: 'commission_review' }))

    renderPage()

    await waitFor(() => expect(screen.getByText('Cacao bio')).toBeInTheDocument())

    expect(screen.queryByText(/Décision de la Commission/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Prendre en charge/i)).not.toBeInTheDocument()
  })

  it('T6 — auditor sees no action card when statut=submitted', async () => {
    mockProfile = { id: 'user-3', full_name: 'Paul Nguema', role: 'auditor', country: 'CM' }
    setupSupabaseMock(makeCert({ statut: 'submitted' }))

    renderPage()

    await waitFor(() => expect(screen.getByText('Cacao bio')).toBeInTheDocument())

    expect(screen.queryByText(/Lancer visite terrain/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Rapport d'audit/i)).not.toBeInTheDocument()
  })
})
