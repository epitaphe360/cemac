import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ShoppingCart, Star, PackageSearch, TrendingUp, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function BuyerDashboard() {
  const { t } = useTranslation()
  const [stats, setStats] = useState({ availableProducts: 0, favorites: 0 })
  const [recentProducts, setRecentProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: productsData } = await supabase
        .from('produits')
        .select('*, entreprise:entreprises(raison_sociale)')
        .order('created_at', { ascending: false })
      
      if (productsData) {
        setStats({
          availableProducts: productsData.length,
          favorites: 0 // placeholder
        })
        setRecentProducts(productsData.slice(0, 4))
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#173b57_0%,#115e59_52%,#f0b437_130%)] px-6 py-7 text-white shadow-[0_20px_60px_rgba(13,59,87,0.22)] sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_22%)]" />
        <div className="relative flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="hero-chip mb-4 border-white/15 bg-white/10 text-white">{t('dashboard.buyer.badge')}</div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            {t('dashboard.buyer.title')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/75">{t('dashboard.buyer.description')}</p>
        </div>
        <Link to="/marketplace">
          <Button className="bg-white text-cemac-900 hover:bg-white/90">
            <PackageSearch className="h-4 w-4 mr-2" />
            {t('dashboard.buyer.explore_market')}
          </Button>
        </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="metric-card">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-xl bg-blue-50"><ShoppingCart className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '…' : stats.availableProducts}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('dashboard.buyer.available_products')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-xl bg-pink-50"><Star className="h-5 w-5 text-pink-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '…' : stats.favorites}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('dashboard.buyer.favorite_suppliers')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="metric-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t('dashboard.buyer.market_updates')}</CardTitle>
              <Link to="/marketplace" className="text-sm text-cemac-700 hover:underline flex items-center gap-1">
                {t('common.view_all')} <ArrowRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />)}
                </div>
              ) : recentProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">{t('dashboard.buyer.no_products')}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recentProducts.map((product) => (
                    <Link key={product.id} to={`/marketplace/${product.id}`}>
                      <div className="flex items-center rounded-2xl border border-transparent p-3 transition-all hover:border-cemac-100 hover:bg-cemac-50/60 hover:shadow-sm">
                        <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center mr-3">
                           {product.images?.[0] ? <img src={product.images[0]} className="h-full w-full object-cover rounded" alt=""/> : <PackageSearch className="h-6 w-6 text-gray-400" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{product.nom}</p>
                          <p className="text-xs text-muted-foreground">{product.entreprise?.raison_sociale}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
           <Card className="border-0 bg-gradient-to-br from-gray-900 via-[#153a37] to-cemac-900 text-white shadow-[0_16px_40px_rgba(14,45,41,0.28)]">
            <CardContent className="pt-6">
              <TrendingUp className="h-8 w-8 mb-4 text-cemac-400" />
              <h3 className="font-semibold text-lg mb-2">{t('dashboard.buyer.intelligence_title')}</h3>
              <p className="text-sm text-gray-300 mb-4">
                {t('dashboard.buyer.intelligence_description')}
              </p>
              <Link to="/market-intelligence">
                <Button variant="secondary" size="sm" className="w-full">
                  {t('dashboard.buyer.open_reports')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}