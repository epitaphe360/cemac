import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ContactPage } from '@/pages/landing/ContactPage'

const invoke = vi.hoisted(() => vi.fn())
const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }))

vi.mock('@/lib/supabase', () => ({
  supabase: { functions: { invoke } },
}))
vi.mock('react-hot-toast', () => ({ default: toast }))
vi.mock('@/hooks/use-cms', () => ({
  useContentBlocks: () => ({
    loading: false,
    error: null,
    data: [
      { section: 'hero', content: { title: 'Contact', description: 'Écrivez-nous' } },
      { section: 'response', content: { title: 'Réponse', items: [] } },
      {
        section: 'ui',
        content: {
          form_title: 'Formulaire',
          name_label: 'Nom',
          email_label: 'Email',
          company_label: 'Entreprise',
          country_label: 'Pays',
          country_placeholder: 'Choisir',
          reason_label: 'Motif',
          message_label: 'Message',
          submit: 'Envoyer',
          success_toast: 'Envoyé',
          success_title: 'Merci',
          success_description: 'Message reçu',
          send_another: 'Autre message',
          required_error: 'Champs requis',
          send_error: 'Erreur envoi',
          channels_title: 'Canaux',
          offices_title: 'Bureaux',
          headquarters: 'Siège',
        },
      },
      { section: 'countries', content: { items: [{ code: 'CM', label: 'Cameroun' }] } },
    ],
  }),
  useContact: () => ({
    loading: false,
    error: null,
    data: {
      offices: [{ id: 'o1', countryName: 'Cameroun', city: 'Yaoundé', isHeadquarters: true }],
      reasons: [{ id: 'r1', slug: 'support', label: 'Support' }],
    },
  }),
  useSiteSetting: () => ({
    loading: false,
    error: null,
    data: { value: { email: 'contact@example.com', phone: '+237 000' } },
  }),
}))

async function submitValidForm() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/^Nom/), 'Ada Test')
  await user.type(screen.getByLabelText(/^Email/), 'ada@example.com')
  await user.type(screen.getByLabelText(/^Message/), 'Une demande suffisamment longue.')
  await user.click(screen.getByRole('button', { name: 'Envoyer' }))
}

describe('ContactPage secure submission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    invoke.mockResolvedValue({ data: { accepted: true }, error: null })
  })

  it('uses submit-contact instead of inserting into a public table', async () => {
    render(<MemoryRouter><ContactPage /></MemoryRouter>)
    await submitValidForm()
    await waitFor(() => expect(invoke).toHaveBeenCalledWith(
      'submit-contact',
      expect.objectContaining({
        body: expect.objectContaining({
          name: 'Ada Test',
          email: 'ada@example.com',
          website: '',
        }),
      }),
    ))
    expect(await screen.findByText('Merci')).toBeInTheDocument()
  })

  it('shows a specific retry message for HTTP 429', async () => {
    invoke.mockResolvedValue({
      data: null,
      error: {
        context: new Response(null, { status: 429, headers: { 'Retry-After': '120' } }),
      },
    })
    render(<MemoryRouter><ContactPage /></MemoryRouter>)
    await submitValidForm()
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(
      expect.stringMatching(/2 minute/i),
    ))
    expect(screen.queryByText('Merci')).not.toBeInTheDocument()
  })
})
