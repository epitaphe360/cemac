import { LoadingSpinner, PageLoader, LoadingTableFull, LoadingCard } from "@/components/shared/LoadingSpinner";
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle, Globe, Package, Mail, Phone,
  ExternalLink, Tag, ShoppingCart, Building2, Award
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'

import { formatCurrency } from '@/lib/utils'
import { CEMAC_COUNTRIES } from '@/lib/constants'
import type { ProduitWithEntreprise } from '@/types'

export function MarketplaceProductDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<ProduitWithEntreprise | null>(null)
  const [loading, setLoading] = useState(true)
  const [showContact, setShowContact] = useState(false)

  useEffect(() => {
    if (!id) return
    const fetch = async () => {
      const { data, error } = await supabase
        .from('produits')
        .select(`
          *,
          entreprise:entreprises!inner (
            id, raison_sociale, sigle, pays, ville, adresse, telephone,
            email_contact, site_web, logo_url, is_verified, description,
            subscription_plan,
            certifications ( id, statut, type_certification )
          )
        `)
        .eq('id', id)
        .single()

      if (!error && data) setProduct(data as unknown as ProduitWithEntreprise)
      setLoading(false)
    }
    fetch()
  }, [id])

  if (loading) return <PageLoader />
  if (!product) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="font-medium">{t('marketplace.detail.not_found')}</p>
        <Link to="/marketplace" className="text-cemac-700 underline text-sm mt-2 block">
          {t('marketplace.detail.back_to_marketplace')}
        </Link>
      </div>
    )
  }

  const country = CEMAC_COUNTRIES.find((c) => c.code === product.pays_origine)
  const ent = product.entreprise as {
    id: string
    raison_sociale: string
    sigle: string | null
    pays: string
    ville: string | null
    adresse: string | null
    telephone: string | null
    email_contact: string | null
    site_web: string | null
    logo_url: string | null
    is_verified: boolean
    description: string | null
    subscription_plan: string
    certifications: { id: string; statut: string; type_certification: string }[]
  }

  const isCertified = ent?.certifications?.some((c) => c.statut === 'approved') ?? false
  const approvedCerts = ent?.certifications?.filter((c) => c.statut === 'approved') ?? []

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Breadcrumb */}
      <div className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#0f3c38_0%,#115e59_52%,#d4a62f_135%)] px-6 py-7 text-white shadow-[0_20px_60px_rgba(15,60,56,0.22)] sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_24%)]" />
        <div className="relative flex flex-wrap items-center gap-3 text-sm text-white/75">
        <Button variant="ghost" size="icon" className="h-9 w-9 bg-white/10 text-white hover:bg-white/15 hover:text-white" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Link to="/marketplace" className="hover:text-white">Marketplace</Link>
        <span>/</span>
        <span className="font-medium truncate text-white">{product.nom}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image produit */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-cemac-50 to-cemac-100 h-72 sm:h-96">
            {product.images?.[0] ? (
              <img
                src={product.images[0]}
                alt={product.nom}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-16 w-16 text-cemac-200" />
              </div>
            )}
            {isCertified && (
              <div className="absolute top-4 right-4">
                <div className="flex items-center gap-2 bg-white/90 backdrop-blur text-cemac-800 px-3 py-1.5 rounded-full text-sm font-semibold shadow-md">
                  <CheckCircle className="h-4 w-4 text-cemac-600" />
                  {t('marketplace.verified_badge')}
                </div>
              </div>
            )}
            {country && (
              <div className="absolute top-4 left-4">
                <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-sm font-medium shadow">
                  <span>{country.flag}</span>
                  <span>{country.name}</span>
                </div>
              </div>
            )}
          </div>

          {/* Infos produit */}
          <Card className="metric-card">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{product.nom}</h1>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {product.categorie && (
                      <Badge variant="secondary">{product.categorie}</Badge>
                    )}
                    {product.sous_categorie && (
                      <Badge variant="outline">{product.sous_categorie}</Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {product.prix_unitaire ? (
                    <>
                      <p className="text-3xl font-bold text-cemac-800">
                        {formatCurrency(product.prix_unitaire, product.devise)}
                      </p>
                      {product.unite && (
                        <p className="text-sm text-muted-foreground">par {product.unite}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-lg text-muted-foreground font-medium">{t('marketplace.private.quote_only')}</p>
                  )}
                </div>
              </div>

              {product.description && (
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-800 mb-2">{t('certification.fields.description')}</h3>
                  <p className="text-gray-700 leading-relaxed">{product.description}</p>
                </div>
              )}

              {product.quantite_disponible != null && (
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <ShoppingCart className="h-4 w-4 text-cemac-600" />
                  <span className="font-medium text-gray-700">
                    {t('marketplace.detail.available_stock')}
                  </span>
                  <span className={product.quantite_disponible > 0 ? 'text-green-700 font-semibold' : 'text-red-600 font-semibold'}>
                    {product.quantite_disponible > 0
                      ? `${product.quantite_disponible} ${product.unite ?? t('marketplace.detail.unit_fallback')}`
                      : t('marketplace.detail.out_of_stock')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <Card className="metric-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-gray-700">{t('marketplace.detail.tags')}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Colonne latérale */}
        <div className="space-y-4">
          {/* Fiche entreprise */}
          <Card className="metric-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {t('marketplace.detail.supplier')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-cemac-50 border border-cemac-100 flex items-center justify-center shrink-0">
                  {ent?.logo_url ? (
                    <img src={ent.logo_url} alt={ent.raison_sociale} className="w-10 h-10 object-contain" />
                  ) : (
                    <span className="text-cemac-700 font-bold text-sm">
                      {(ent?.sigle ?? ent?.raison_sociale ?? '?').slice(0, 2)}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm leading-tight">{ent?.raison_sociale}</p>
                  {ent?.sigle && <p className="text-xs text-muted-foreground">{ent.sigle}</p>}
                  <div className="flex items-center gap-1 mt-1">
                    {ent?.is_verified && (
                      <span className="inline-flex items-center gap-1 text-xs text-cemac-700 font-medium">
                        <CheckCircle className="h-3 w-3" />
                        {t('marketplace.detail.verified_supplier')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {ent?.description && (
                <p className="text-xs text-gray-600 leading-relaxed">{ent.description}</p>
              )}

              <div className="space-y-1.5 text-xs text-gray-600">
                {ent?.ville && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span>{ent.ville}, {CEMAC_COUNTRIES.find((c) => c.code === ent.pays)?.name ?? ent.pays}</span>
                  </div>
                )}
                {ent?.telephone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                    <a href={`tel:${ent.telephone}`} className="hover:text-cemac-700">{ent.telephone}</a>
                  </div>
                )}
                {ent?.site_web && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                    <a
                      href={ent.site_web.startsWith('http') ? ent.site_web : `https://${ent.site_web}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-cemac-700 truncate"
                    >
                      {ent.site_web}
                    </a>
                  </div>
                )}
              </div>

              {/* Certifications de l'entreprise */}
              {approvedCerts.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                    <Award className="h-3 w-3 text-cemac-600" />
                    {t('marketplace.detail.active_certifications')}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {approvedCerts.map((cert) => (
                      <Badge key={cert.id} className="bg-cemac-50 text-cemac-800 border-cemac-200 text-xs">
                        {cert.type_certification.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions contact */}
          <Card className="metric-card">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-900">{t('marketplace.detail.contact_supplier')}</p>

              {ent?.email_contact ? (
                <a href={`mailto:${ent.email_contact}?subject=${encodeURIComponent(t('marketplace.detail.quote_subject', { product: product.nom }))}`}>
                  <Button className="w-full bg-cemac-700 hover:bg-cemac-800">
                    <Mail className="h-4 w-4" />
                    {t('marketplace.detail.send_email')}
                  </Button>
                </a>
              ) : (
                <Button
                  className="w-full bg-cemac-700 hover:bg-cemac-800"
                  onClick={() => setShowContact(true)}
                >
                  <Mail className="h-4 w-4" />
                  {t('marketplace.request_quote')}
                </Button>
              )}

              {ent?.telephone && (
                <a href={`tel:${ent.telephone}`}>
                  <Button variant="outline" className="w-full">
                    <Phone className="h-4 w-4" />
                    {ent.telephone}
                  </Button>
                </a>
              )}

              <p className="text-xs text-muted-foreground text-center">
                {t('marketplace.detail.response_time')}
              </p>
            </CardContent>
          </Card>

          {/* Info CEMAC */}
          {isCertified && (
            <Card className="border-cemac-200 bg-cemac-50/90">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-cemac-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-cemac-800">{t('marketplace.detail.certified_title')}</p>
                    <p className="text-xs text-cemac-700 mt-0.5">
                      {t('marketplace.detail.certified_description')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de contact simple */}
      {showContact && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowContact(false) }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('marketplace.detail.contact_information')}</h3>
              <button
                onClick={() => setShowContact(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none font-light"
              >
                ×
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="font-semibold text-gray-800">{ent?.raison_sociale}</p>
                {ent?.adresse && <p className="text-muted-foreground mt-0.5">{ent.adresse}</p>}
              </div>
              {ent?.telephone && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
                  <Phone className="h-4 w-4 text-cemac-600" />
                  <a href={`tel:${ent.telephone}`} className="font-medium text-cemac-700">{ent.telephone}</a>
                </div>
              )}
              {ent?.email_contact && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
                  <Mail className="h-4 w-4 text-cemac-600" />
                  <a href={`mailto:${ent.email_contact}`} className="font-medium text-cemac-700">{ent.email_contact}</a>
                </div>
              )}
              {ent?.site_web && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
                  <ExternalLink className="h-4 w-4 text-cemac-600" />
                  <a
                    href={ent.site_web.startsWith('http') ? ent.site_web : `https://${ent.site_web}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-cemac-700"
                  >
                    {ent.site_web}
                  </a>
                </div>
              )}
            </div>
            <Button onClick={() => setShowContact(false)} className="w-full mt-4 bg-cemac-700 hover:bg-cemac-800">
              {t('common.close')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
