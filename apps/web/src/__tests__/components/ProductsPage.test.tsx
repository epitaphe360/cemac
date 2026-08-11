import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ProductsPage } from '@/pages/products/ProductsPage'

vi.mock('@/hooks/use-cms', () => ({
  useProductCategories: () => ({
    data: [{ id: 'cat-1', slug: 'agri-food', label: 'Agro-alimentaire', sortOrder: 10 }],
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

// ── Supabase mock ──────────────────────────────────────────────────────────
const MOCK_PRODUCTS = [
  {
    id: 'p1',
    entreprise_id: 'ent-1',
    nom: 'Cacao Fermenté Bio',
    description: 'Cacao de qualité supérieure',
    categorie: 'Agro-alimentaire',
    sous_categorie: 'Cacao',
    prix_unitaire: 5000,
    devise: 'XAF',
    unite: 'kg',
    quantite_disponible: 500,
    pays_origine: 'CM',
    images: [],
    tags: ['bio', 'cameroun'],
    is_published: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p2',
    entreprise_id: 'ent-1',
    nom: 'Café Robusta',
    description: 'Café arabica premium',
    categorie: 'Agro-alimentaire',
    sous_categorie: 'Café',
    prix_unitaire: 8000,
    devise: 'XAF',
    unite: 'kg',
    quantite_disponible: 200,
    pays_origine: 'CM',
    images: [],
    tags: ['café'],
    is_published: false,
    created_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
  },
]

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select:  vi.fn().mockReturnThis(),
      eq:      vi.fn().mockReturnThis(),
      order:   vi.fn().mockReturnThis(),
      update:  vi.fn().mockReturnThis(),
      insert:  vi.fn().mockReturnThis(),
      delete:  vi.fn().mockReturnThis(),
      single:  vi.fn().mockResolvedValue({ data: MOCK_PRODUCTS[0], error: null }),
      then:    (resolve: (v: unknown) => void) => resolve({ data: MOCK_PRODUCTS, error: null }),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'img.png' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/img.png' } }),
      })),
    },
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

const renderProducts = () =>
  render(
    <MemoryRouter>
      <ProductsPage />
    </MemoryRouter>,
  )

describe('ProductsPage — header', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the page title', async () => {
    renderProducts()
    expect(await screen.findByText(/mes produits/i)).toBeInTheDocument()
  })

  it('renders the "Nouveau produit" button', async () => {
    renderProducts()
    expect(await screen.findByRole('button', { name: /nouveau produit/i })).toBeInTheDocument()
  })
})

describe('ProductsPage — product list', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders all loaded products', async () => {
    renderProducts()
    expect(await screen.findByText('Cacao Fermenté Bio')).toBeInTheDocument()
    expect(await screen.findByText('Café Robusta')).toBeInTheDocument()
  })

  it('shows published/draft badges', async () => {
    renderProducts()
    await screen.findByText('Cacao Fermenté Bio')
    expect(screen.getAllByText(/publié/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/brouillon/i).length).toBeGreaterThan(0)
  })
})

describe('ProductsPage — add modal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('opens the create modal when clicking Nouveau produit', async () => {
    renderProducts()
    const user = userEvent.setup()
    const addBtn = await screen.findByRole('button', { name: /nouveau produit/i })
    await user.click(addBtn)
    expect(await screen.findByText(/nouveau produit/i, { selector: 'h2, h3, [role="heading"]' })).toBeInTheDocument()
  })

  it('closes the modal when clicking the × close button', async () => {
    renderProducts()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /nouveau produit/i }))
    // Wait for modal to open
    await screen.findByText(/nouveau produit/i, { selector: 'h2, h3, [role="heading"]' })
    // The close button contains × as text
    const closeBtn = await screen.findByText('×')
    await user.click(closeBtn)
    // Modal heading should be gone
    expect(screen.queryByText(/nouveau produit/i, { selector: 'h2, h3, [role="heading"]' })).not.toBeInTheDocument()
  })

  it('loads product categories from the CMS', async () => {
    renderProducts()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /nouveau produit/i }))
    expect(await screen.findByRole('option', { name: 'Agro-alimentaire' })).toBeInTheDocument()
  })
})
