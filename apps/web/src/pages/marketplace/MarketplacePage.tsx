import { PageLoader } from "@/components/shared/LoadingSpinner";
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, Filter, CheckCircle, Globe } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { formatCurrency } from '@/lib/utils'
import { CEMAC_COUNTRIES } from '@/lib/constants'
import type { ProduitWithEntreprise } from '@/types'
import toast from 'react-hot-toast'

export function MarketplacePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const detailBase = location.pathname.startsWith('/marketplace-public') ? '/marketplace-public' : '/marketplace'
  const [products, setProducts] = useState<ProduitWithEntreprise[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCountry, setFilterCountry] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('produits')
        .select(`
          *,
          entreprise:entreprises (
            id, raison_sociale, pays, logo_url, is_verified,
            certifications ( id, statut, type_certification )
          )
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (error) {
        toast.error(t('errors.load_failed', 'Impossible de charger la marketplace'))
      } else if (data) {
        // Only show products whose enterprise is visible and verified
        const visible = (data as unknown as ProduitWithEntreprise[]).filter(
          (p) => p.entreprise && (p.entreprise as { is_verified: boolean }).is_verified
        )
        setProducts(visible)
      }
      setLoading(false)
    }
    fetch()
  }, [t])

  const categories = [...new Set(products.map((p) => p.categorie).filter(Boolean))]

  const filtered = products.filter((p) => {
    const matchSearch = p.nom.toLowerCase().includes(search.toLowerCase())
      || (p.entreprise as { raison_sociale: string })?.raison_sociale?.toLowerCase().includes(search.toLowerCase())
    const matchCountry = filterCountry === 'all' || p.pays_origine === filterCountry
    const matchCat = filterCategory === 'all' || p.categorie === filterCategory
    return matchSearch && matchCountry && matchCat
  })

  const isCertified = (p: ProduitWithEntreprise): boolean => {
    const ent = p.entreprise as { certifications: { statut: string }[] }
    return ent?.certifications?.some((c) => c.statut === 'approved') ?? false
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* En-tête */}
      <div className="page-hero">
        <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="hero-chip mb-4 border-white/15 bg-white/10 text-white">{t('marketplace.private.badge')}</div>
          <h1 className="text-3xl font-black tracking-tight text-white">Marketplace</h1>
          <p className="mt-2 text-sm text-white/75">
            {t('marketplace.private.hero')}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/85 backdrop-blur-sm">
          <Globe className="h-4 w-4" />
          <span>{t('marketplace.private.product_count', { count: filtered.length })}</span>
        </div>
        </div>
      </div>

      {/* Bannière */}
      <div className="rounded-[28px] bg-gradient-to-r from-cemac-700 via-cemac-800 to-cemac-950 p-6 text-white shadow-[0_16px_40px_rgba(16,105,91,0.22)]">
        <h2 className="text-lg font-semibold mb-1">{t('marketplace.private.banner_title')}</h2>
        <p className="text-sm text-cemac-200">
          {t('marketplace.private.banner_description')}
        </p>
      </div>

      {/* Filtres */}
      <div className="app-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('marketplace.search_placeholder')}
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <select
            aria-label={t('marketplace.private.all_countries')}
            className="h-10 rounded-xl border border-input bg-white/85 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-cemac-600"
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
          >
            <option value="all">{t('marketplace.private.all_countries')}</option>
            {CEMAC_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
            ))}
          </select>
        </div>
        {categories.length > 0 && (
          <select
            aria-label={t('marketplace.private.all_categories')}
            className="h-10 rounded-xl border border-input bg-white/85 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-cemac-600"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">{t('marketplace.private.all_categories')}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat!}>{cat}</option>
            ))}
          </select>
        )}
      </div>

      {/* Grille produits */}
      {loading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">{t('marketplace.private.no_products')}</p>
          <p className="text-sm mt-1">{t('marketplace.private.adjust_filters')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => {
            const certified = isCertified(product)
            const ent = product.entreprise as { raison_sociale: string; pays: string; logo_url: string | null; is_verified: boolean }
            const country = CEMAC_COUNTRIES.find((c) => c.code === product.pays_origine)

            return (
              <Card key={product.id} className="group cursor-pointer overflow-hidden border-white/80 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(10,45,39,0.12)]" onClick={() => navigate(`${detailBase}/${product.id}`)}>
                {/* Image produit */}
                <div className="relative h-52 overflow-hidden bg-gradient-to-br from-cemac-50 to-cemac-100">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.nom}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl">{country?.flag ?? '🌍'}</span>
                    </div>
                  )}
                  {certified && (
                    <div className="absolute top-2 right-2">
                      <div className="flex items-center gap-1 bg-white/90 backdrop-blur text-cemac-700 px-2 py-1 rounded-full text-xs font-semibold shadow">
                        <CheckCircle className="h-3 w-3" />
                        {t('marketplace.verified_badge')}
                      </div>
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
                      {product.nom}
                    </h3>
                  </div>

                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {product.description ?? t('marketplace.private.default_description')}
                  </p>

                  <div className="flex items-center gap-1.5 flex-wrap mb-3">
                    {product.categorie && (
                      <Badge variant="secondary" className="text-xs">{product.categorie}</Badge>
                    )}
                    {country && (
                      <Badge variant="outline" className="text-xs">{country.flag} {country.name}</Badge>
                    )}
                  </div>

                  <div className="flex items-end justify-between gap-3">
                    <div>
                      {product.prix_unitaire ? (
                        <div>
                          <p className="font-bold text-gray-900">
                            {formatCurrency(product.prix_unitaire, product.devise)}
                          </p>
                          {product.unite && (
                            <p className="text-xs text-muted-foreground">/{product.unite}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">{t('marketplace.private.quote_only')}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[120px]">{ent?.raison_sociale}</p>
                    </div>
                    <Button size="sm" variant="outline" className="shrink-0 border-cemac-200 bg-white/80">
                      {t('marketplace.contact_producer')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
