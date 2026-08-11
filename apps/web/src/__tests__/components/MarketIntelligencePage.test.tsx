import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { MarketIntelligencePage } from '@/pages/market-intelligence/MarketIntelligencePage'

const CMS_DATA = {
  commodities: [{
    id: 'commodity-1',
    key: 'raw-cocoa',
    worldBankIndicator: 'PCOCOA',
    name: 'Cacao brut',
    countryCode: 'CM',
    xafUnit: 'tonne',
    category: 'Agricole',
    usdUnit: 'metric_ton',
    usdPrice: 8900,
    sourceUrl: null,
    sortOrder: 10,
  }],
  knowledge: [{
    id: 'knowledge-1',
    slug: 'origin-rules',
    patterns: ['seuil.*origine', 'règle.*origine'],
    suggestion: "Quels sont les seuils d'origine CEMAC ?",
    answer: 'Réponse CMS sur les seuils d’origine.',
    tags: ['origin'],
    sortOrder: 10,
  }],
}

vi.mock('@/hooks/use-cms', () => ({
  useCommoditiesAndKnowledge: () => ({
    data: CMS_DATA,
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

// ── Mock supabase ──────────────────────────────────────────────────────────
// Build a query mock that is also a real Promise (needed for Promise.all)
function makeQuery(resolved = { data: [], count: 0, error: null }) {
  const p = Promise.resolve(resolved) as Promise<typeof resolved> & Record<string, unknown>
  const chain: Record<string, unknown> = {
    select:  vi.fn(() => chain),
    eq:      vi.fn(() => chain),
    gte:     vi.fn(() => chain),
    order:   vi.fn(() => chain),
    limit:   vi.fn(() => chain),
    // forward Promise methods so Promise.all works
    then:    p.then.bind(p),
    catch:   p.catch.bind(p),
    finally: p.finally.bind(p),
  }
  return chain
}

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn(() => makeQuery()) },
}))

// ── Mock fetch (Frankfurter + World Bank APIs) ─────────────────────────────
global.fetch = vi.fn().mockRejectedValue(new Error('Network error')) as typeof fetch

const renderMI = () =>
  render(
    <MemoryRouter>
      <MarketIntelligencePage />
    </MemoryRouter>,
  )

describe('MarketIntelligencePage — header', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the page title', async () => {
    renderMI()
    expect(await screen.findByText(/intelligence de marché/i)).toBeInTheDocument()
  })

  it('renders the three tabs', async () => {
    renderMI()
    await screen.findByText(/intelligence de marché/i)
    expect(screen.getByRole('button', { name: /observatoire des prix/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /tendances/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /assistant/i })).toBeInTheDocument()
  })
})

describe('MarketIntelligencePage — prices tab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error')) as typeof fetch
  })

  it('renders commodity table headers', async () => {
    renderMI()
    const headers = await screen.findAllByText(/commodité/i)
    expect(headers.length).toBeGreaterThan(0)
    expect(await screen.findAllByText(/pays/i)).toBeTruthy()
    expect(await screen.findAllByText(/prix/i)).toBeTruthy()
  })

  it('renders CMS commodity rows when market APIs are offline', async () => {
    renderMI()
    expect(await screen.findByText(/cacao brut/i)).toBeInTheDocument()
  })
})

describe('MarketIntelligencePage — trends tab', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows trends content on tab click', async () => {
    renderMI()
    const user = userEvent.setup()
    const trendsTab = await screen.findByRole('button', { name: /tendances/i })
    await user.click(trendsTab)
    expect(await screen.findByText(/tendances de marché/i)).toBeInTheDocument()
  })
})

describe('MarketIntelligencePage — assistant tab', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows assistant title on tab click', async () => {
    renderMI()
    const user = userEvent.setup()
    const assistantTab = await screen.findByRole('button', { name: /^assistant ia cemac$/i })
    await user.click(assistantTab)
    // Title appears in the card header after switching
    const titles = await screen.findAllByText(/assistant ia cemac/i)
    expect(titles.length).toBeGreaterThan(0)
  })

  it('shows suggestion buttons', async () => {
    renderMI()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /^assistant ia cemac$/i }))
    // At least one suggestion should be visible
    expect(await screen.findByText(/seuils d'origine/i)).toBeInTheDocument()
  })

  it('sends a message when clicking a suggestion', async () => {
    renderMI()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /^assistant ia cemac$/i }))
    const suggestion = await screen.findByText(/seuils d'origine/i)
    await user.click(suggestion)
    // The suggestion text should appear as a user message in the chat
    expect(await screen.findAllByText(/seuils d'origine/i)).toHaveLength(2)
  })
})
