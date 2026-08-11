import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TermsPage } from '@/pages/landing/LegalPage'

const legalState = vi.hoisted(() => ({
  data: null as null | {
    id: string
    slug: string
    locale: 'fr'
    title: string
    sections: { heading: string; paragraphs: string[] }[]
    effectiveDate: string
  },
  loading: false,
  error: null as Error | null,
}))

vi.mock('@/hooks/use-cms', () => ({
  useLegalDocument: () => ({ ...legalState, refetch: vi.fn() }),
}))

describe('public CMS legal pages', () => {
  beforeEach(() => {
    legalState.data = null
    legalState.loading = false
    legalState.error = null
  })

  it('shows an explicit loading state', () => {
    legalState.loading = true
    render(<MemoryRouter><TermsPage /></MemoryRouter>)
    expect(screen.getByRole('status')).toHaveTextContent(/chargement/i)
  })

  it('does not fall back to hard-coded legal copy when the document is missing', () => {
    render(<MemoryRouter><TermsPage /></MemoryRouter>)
    expect(screen.getByRole('status')).toHaveTextContent(/indisponible/i)
    expect(screen.queryByText(/Conditions Générales/)).not.toBeInTheDocument()
  })

  it('renders the legal document returned by the CMS', () => {
    legalState.data = {
      id: 'legal-1',
      slug: 'cgu',
      locale: 'fr',
      title: 'Conditions depuis Supabase',
      sections: [{ heading: 'Objet CMS', paragraphs: ['Texte géré dans le CMS.'] }],
      effectiveDate: '2026-06-29',
    }
    render(<MemoryRouter><TermsPage /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Conditions depuis Supabase' })).toBeInTheDocument()
    expect(screen.getByText('Texte géré dans le CMS.')).toBeInTheDocument()
  })
})
