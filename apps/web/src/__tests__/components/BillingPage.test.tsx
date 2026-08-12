import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BillingPage } from '@/pages/billing/BillingPage'

const invoice = {
  id: 'invoice-1',
  invoice_number: 'INV-2026-001',
  user_id: 'user-1',
  company_id: null,
  plan_name: 'pro',
  amount_ht: 100_000,
  tax_rate: 19.25,
  tax_amount: 17_500,
  amount_ttc: 117_500,
  currency: 'XAF',
  country: 'CM',
  payment_method: 'bank_transfer',
  payment_ref: null,
  status: 'paid',
  billing_period: 'monthly',
  issued_at: '2026-01-01T00:00:00Z',
  due_at: '2026-01-15T00:00:00Z',
  paid_at: '2026-01-02T00:00:00Z',
  notes: null,
  pdf_url: null,
  stripe_invoice_id: 'in_test123',
  stripe_subscription_id: 'sub_test123',
  stripe_payment_intent_id: 'pi_test123',
  hosted_invoice_url: 'https://invoice.stripe.com/i/test',
  stripe_invoice_pdf_url: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
}

vi.mock('@/hooks/use-cms', () => ({
  useTaxRates: () => ({
    data: [{
      countryCode: 'CM',
      countryName: 'Cameroun',
      rate: 17.5,
      effectiveFrom: '2026-01-01',
      source: 'Test CMS',
    }],
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: (resolve: (value: unknown) => void) => resolve({ data: [invoice], error: null }),
    })),
  },
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => selector({
    profile: { id: 'user-1', full_name: 'Jean Dupont', email: 'jean@example.com' },
  }),
}))

describe('BillingPage CMS tax rates', () => {
  it('renders the active CMS rate instead of a coded country table', async () => {
    render(<BillingPage />)
    expect(await screen.findByText(
      (_, element) => element?.tagName === 'P' && element.textContent?.includes('+ TVA 17.5% =') === true,
    )).toBeInTheDocument()
    expect(await screen.findByText('Facture Stripe')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /stripe/i })).toHaveAttribute(
      'href',
      'https://invoice.stripe.com/i/test',
    )
  })
})
