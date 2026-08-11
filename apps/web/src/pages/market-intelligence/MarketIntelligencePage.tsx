import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useCallback, useState, useEffect, useRef } from 'react'
import {
  TrendingUp, BarChart3,
  MessageSquare, Send, Bot, User, RefreshCw, Wifi, WifiOff,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

import { formatCurrency, cn } from '@/lib/utils'
import { CEMAC_COUNTRIES } from '@/lib/constants'
import { useCommoditiesAndKnowledge } from '@/hooks/use-cms'
import { getPrimaryLanguage } from '@/lib/i18n-utils'
import type { CmsLocale } from '@/lib/cms-types'

type Tab = 'prices' | 'trends' | 'assistant'

type Message = { role: 'user' | 'bot'; text: string; time: Date }

function formatBotMessage(text: string) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      return <p key={i} className="font-semibold mb-1">{line.slice(2, -2)}</p>
    }
    if (line.startsWith('• ')) {
      return <li key={i} className="ml-3 list-disc">{line.slice(2)}</li>
    }
    if (line === '') return <br key={i} />
    // inline bold
    const parts = line.split(/\*\*(.*?)\*\*/g)
    return (
      <p key={i} className="leading-relaxed">
        {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
      </p>
    )
  })
}

// ─── Trend chart data (fetched from DB) ───
// (Replaced static hardcoded data with DB queries below)

export function MarketIntelligencePage() {
  const [activeTab, setActiveTab] = useState<Tab>('prices')
  const { i18n, t } = useTranslation()
  const locale = getPrimaryLanguage(i18n.resolvedLanguage ?? i18n.language) as CmsLocale
  const {
    data: cmsData,
    loading: cmsLoading,
    error: cmsError,
  } = useCommoditiesAndKnowledge(locale)

  // Trend chart state (real data from DB)
  const [trendMonths, setTrendMonths] = useState<string[]>([])
  const [trendData, setTrendData] = useState<{ certifications: number[]; marketplace: number[] }>({ certifications: [], marketplace: [] })
  const [trendLoading, setTrendLoading] = useState(true)
  const [countryCounts, setCountryCounts] = useState<Record<string, number>>({})
  const [categoryFilter, setCategoryFilter] = useState('Tous')
  const [countryFilter, setCountryFilter] = useState('all')
  const [productCount, setProductCount] = useState<number | null>(null)

  // ── Live market data state ──────────────────────────────────────────────
  // usdToXaf: real-time from Frankfurter API (https://api.frankfurter.app)
  // wbPrices: annual USD prices from World Bank Pink Sheet (source=21)
  // NOT real-time spot prices — clearly indicated in the UI
  const [usdToXaf, setUsdToXaf] = useState<number | null>(null)
  const [wbPrices, setWbPrices] = useState<Record<string, number>>({})
  const [dataSource, setDataSource] = useState<'live' | 'reference' | 'loading'>('loading')
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const categories = Array.from(new Set(cmsData.commodities.map((commodity) => commodity.category).filter(Boolean))) as string[]
  const commodities = cmsData.commodities.map((commodity) => {
    const usdPrice = commodity.worldBankIndicator && wbPrices[commodity.worldBankIndicator]
      ? wbPrices[commodity.worldBankIndicator]
      : commodity.usdPrice
    const price = usdToXaf === null ? null : Math.round(usdPrice * usdToXaf)
    const source = commodity.worldBankIndicator && wbPrices[commodity.worldBankIndicator] ? 'Banque mondiale' : 'Référence CMS'
    return {
      id: commodity.id,
      name: commodity.name ?? commodity.key,
      country: commodity.countryCode,
      price,
      unit: commodity.xafUnit ?? commodity.usdUnit,
      category: commodity.category ?? '',
      source,
      usdPrice,
    }
  })
  const suggestions = cmsData.knowledge.filter(
    (entry): entry is typeof entry & { suggestion: string } => Boolean(entry.suggestion),
  )

  const fetchMarketData = useCallback(async () => {
    setRefreshing(true)
    let exchangeOk = false
    let wbOk = false

    // ── 1. Fetch USD → XAF exchange rate ──
    // XAF n'est pas dans Frankfurter. Le XAF est ancré à l'EUR à parité fixe (1 EUR = 655.957 XAF).
    // On récupère USD→EUR (live), puis on applique la parité officielle pour obtenir USD→XAF.
    const EUR_XAF_FIXED = 655.957
    try {
      const fxRes = await fetch('https://api.frankfurter.app/latest?from=USD&to=EUR', { signal: AbortSignal.timeout(6000) })
      if (fxRes.ok) {
        const fxData = await fxRes.json()
        if (fxData?.rates?.EUR) { setUsdToXaf(fxData.rates.EUR * EUR_XAF_FIXED); exchangeOk = true }
      }
    } catch { /* keep previous rate */ }

    // ── 2. Fetch commodity prices from World Bank Pink Sheet (source=21) ──
    // Annual reference prices in USD — NOT real-time. Updated quarterly by World Bank.
    const indicators = cmsData.commodities.flatMap((commodity) =>
      commodity.worldBankIndicator ? [commodity.worldBankIndicator] : [],
    )
    try {
      if (indicators.length === 0) throw new Error('Aucun indicateur de marché configuré.')
      const wbRes = await fetch(
        `https://api.worldbank.org/v2/country/all/indicator/${indicators.join(';')}?format=json&source=21&mrv=1&per_page=30`,
        { signal: AbortSignal.timeout(10000) }
      )
      if (wbRes.ok) {
        const wbData = await wbRes.json()
        const entries: { indicator: { id: string }; value: number | null }[] = Array.isArray(wbData) && wbData.length > 1 ? wbData[1] : []
        const newPrices: Record<string, number> = {}
        entries.forEach((entry) => {
          if (entry.value !== null && entry.indicator?.id && !newPrices[entry.indicator.id]) {
            let val = entry.value
            // Unit normalisation: PCOTTIND (USD/kg → USD/tonne), PSUGAUSA (cents/lb → USD/tonne)
            if (entry.indicator.id === 'PCOTTIND') val = val * 1000
            if (entry.indicator.id === 'PSUGAUSA') val = val * 22.046 // cents/lb to USD/tonne
            newPrices[entry.indicator.id] = val
          }
        })
        if (Object.keys(newPrices).length > 0) { setWbPrices(newPrices); wbOk = true }
      }
    } catch { /* keep static baselines */ }

    setDataSource(exchangeOk || wbOk ? 'live' : 'reference')
    setLastRefresh(new Date())
    setRefreshing(false)
  }, [cmsData.commodities])

  // Chatbot state
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      role: 'bot',
      text: t('market_intelligence.assistant.welcome_message'),
      time: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase
      .from('produits')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true)
      .then(({ count }) => setProductCount(count))

    // Fetch trend data for the last 9 months
    const nineMonthsAgo = new Date()
    nineMonthsAgo.setMonth(nineMonthsAgo.getMonth() - 8)
    nineMonthsAgo.setDate(1)
    nineMonthsAgo.setHours(0, 0, 0, 0)
    Promise.all([
      supabase.from('certifications').select('created_at, pays_production').gte('created_at', nineMonthsAgo.toISOString()),
      supabase.from('produits').select('created_at').eq('is_published', true).gte('created_at', nineMonthsAgo.toISOString()),
    ]).then(([certsRes, prodsRes]) => {
      const months: string[] = []
      const certCounts: number[] = []
      const prodCounts: number[] = []
      for (let mOffset = 8; mOffset >= 0; mOffset--) {
        const d = new Date()
        d.setMonth(d.getMonth() - mOffset)
        months.push(d.toLocaleDateString('fr-FR', { month: 'short' }))
        const y = d.getFullYear()
        const m = d.getMonth()
        certCounts.push(certsRes.data?.filter((c) => { const cd = new Date(c.created_at); return cd.getFullYear() === y && cd.getMonth() === m }).length ?? 0)
        prodCounts.push(prodsRes.data?.filter((p) => { const pd = new Date(p.created_at); return pd.getFullYear() === y && pd.getMonth() === m }).length ?? 0)
      }
      setTrendMonths(months)
      setTrendData({ certifications: certCounts, marketplace: prodCounts })
      if (!certsRes.error) {
        setCountryCounts((certsRes.data ?? []).reduce<Record<string, number>>((counts, cert) => {
          counts[cert.pays_production] = (counts[cert.pays_production] ?? 0) + 1
          return counts
        }, {}))
      }
      setTrendLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!cmsLoading && cmsData.commodities.length > 0) {
      void fetchMarketData()
    }
  }, [cmsData.commodities.length, cmsLoading, fetchMarketData])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const filteredCommodities = commodities.filter((c) => {
    const matchCat = categoryFilter === 'Tous' || c.category === categoryFilter
    const matchCountry = countryFilter === 'all' || c.country === countryFilter
    return matchCat && matchCountry
  })

  const sendMessage = (text: string) => {
    if (!text.trim()) return
    const userMsg: Message = { role: 'user', text: text.trim(), time: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      const faqEntry = cmsData.knowledge.find((entry) => entry.patterns.some((pattern) => {
        try {
          return new RegExp(pattern, 'i').test(text)
        } catch {
          return false
        }
      }))
      const botText = faqEntry?.answer ?? 'Aucune réponse disponible dans la base de connaissances.'

      setMessages((prev) => [...prev, { role: 'bot', text: botText, time: new Date() }])
      setIsTyping(false)
    }, 900)
  }

  const maxTrend = trendData.certifications.length > 0 ? Math.max(...trendData.certifications, 1) : 1

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'prices',    label: t('market_intelligence.tabs.prices'),    icon: BarChart3 },
    { id: 'trends',    label: t('market_intelligence.tabs.trends'),    icon: TrendingUp },
    { id: 'assistant', label: t('market_intelligence.tabs.assistant'), icon: MessageSquare },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#183253_0%,#0f766e_48%,#e0aa2c_140%)] px-6 py-7 text-white shadow-[0_20px_60px_rgba(24,50,83,0.22)] sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_24%)]" />
        <div className="relative">
        <div className="hero-chip mb-4 border-white/15 bg-white/10 text-white">{t('market_intelligence.badge')}</div>
        <h1 className="text-3xl font-black tracking-tight text-white">{t('market_intelligence.title')}</h1>
        <p className="mt-2 text-sm text-white/75">
          {t('market_intelligence.description')}
        </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex w-fit gap-1 rounded-2xl bg-white/80 p-1.5 shadow-sm backdrop-blur-sm">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
              activeTab === id ? 'bg-cemac-700 text-white shadow-[0_10px_20px_rgba(16,105,91,0.25)]' : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ─── PRICES TAB ─── */}
      {activeTab === 'prices' && (
        <div className="space-y-4">
          {/* Summary banner */}
          <div className="rounded-[28px] bg-gradient-to-r from-cemac-700 via-cemac-800 to-cemac-950 p-5 text-white shadow-[0_16px_40px_rgba(16,105,91,0.22)]">
            <div className="flex flex-wrap gap-6 items-center justify-between">
              <div>
                <h2 className="font-semibold text-lg">{t('market_intelligence.prices.banner_title')}</h2>
                <div className="flex items-center gap-2 mt-1">
                  {dataSource === 'live' ? (
                    <span className="flex items-center gap-1 text-green-300 text-xs font-medium">
                      <Wifi className="h-3 w-3" /> Taux de change en direct (Frankfurter) · Prix réf. World Bank
                    </span>
                  ) : dataSource === 'reference' ? (
                    <span className="flex items-center gap-1 text-yellow-300 text-xs font-medium">
                      <WifiOff className="h-3 w-3" /> API de marché indisponible · Conversion XAF indisponible
                    </span>
                  ) : (
                    <span className="text-cemac-200 text-xs">Chargement des données de marché…</span>
                  )}
                </div>
                {lastRefresh && (
                  <p className="text-cemac-300 text-xs mt-0.5">
                    Actualisé le {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    {usdToXaf && <> · 1 USD = {usdToXaf.toFixed(2)} XAF</>}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{cmsLoading ? '…' : cmsData.commodities.length}</p>
                    <p className="text-cemac-200">{t('market_intelligence.prices.commodities')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{productCount ?? '…'}</p>
                    <p className="text-cemac-200">{t('market_intelligence.prices.marketplace_products')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">6</p>
                    <p className="text-cemac-200">{t('market_intelligence.prices.cemac_countries')}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10 shrink-0"
                  onClick={() => void fetchMarketData()}
                  disabled={refreshing}
                  title="Actualiser les données de marché"
                >
                  <RefreshCw className={cn('h-5 w-5', refreshing && 'animate-spin')} />
                </Button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              className="h-9 px-3 rounded-md border border-input bg-white text-sm focus:outline-none focus:ring-1 focus:ring-cemac-600"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="Tous">{t('market_intelligence.prices.all_categories')}</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <select
              className="h-9 px-3 rounded-md border border-input bg-white text-sm focus:outline-none focus:ring-1 focus:ring-cemac-600"
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
            >
              <option value="all">{t('market_intelligence.prices.all_countries')}</option>
              {CEMAC_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Price table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                {cmsLoading ? (
                  <div className="flex justify-center py-12"><LoadingSpinner /></div>
                ) : cmsError ? (
                  <p role="alert" className="py-10 text-center text-sm text-red-600">Impossible de charger les références de marché.</p>
                ) : cmsData.commodities.length === 0 ? (
                  <p role="status" className="py-10 text-center text-sm text-muted-foreground">Références de marché indisponibles.</p>
                ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('market_intelligence.prices.col_commodity')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('market_intelligence.prices.col_country')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('market_intelligence.prices.col_category')}</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">{t('market_intelligence.prices.col_price')}</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">{t('market_intelligence.prices.col_unit')}</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCommodities.map((c) => {
                      const country = CEMAC_COUNTRIES.find((cc) => cc.code === c.country)
                      return (
                        <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {country ? `${country.flag} ${country.name}` : c.country}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary" className="text-xs">{c.category}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums">
                            {c.price === null
                              ? `${c.usdPrice.toLocaleString(locale)} USD`
                              : formatCurrency(c.price)}
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground">/{c.unit}</td>
                          <td className="px-4 py-3 text-right text-xs text-muted-foreground">{c.source}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                )}
                {filteredCommodities.length === 0 && (
                  <p className="text-center py-10 text-sm text-muted-foreground">{t('market_intelligence.prices.no_results')}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── TRENDS TAB ─── */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Certifications créées ce mois', value: trendData.certifications.at(-1) ?? 0, color: 'text-cemac-700', bg: 'bg-cemac-50' },
              { label: 'Produits publiés ce mois', value: trendData.marketplace.at(-1) ?? 0, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Produits publiés au total', value: productCount ?? 0, color: 'text-green-600', bg: 'bg-green-50' },
            ].map(({ label, value, color, bg }) => (
              <Card key={label}>
                <CardContent className="pt-6">
                  <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold mb-3 ${bg} ${color}`}>
                    Données Supabase
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Bar chart — Certifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('market_intelligence.trends.certs_chart_title')}</CardTitle>
              <CardDescription>{t('market_intelligence.trends.certs_chart_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {trendLoading ? (
                <div className="flex items-center justify-center h-48"><LoadingSpinner /></div>
              ) : (
                <div className="flex items-end gap-2 h-48">
                  {trendMonths.map((month, i) => {
                    const val = trendData.certifications[i] ?? 0
                    const h = maxTrend > 0 ? (val / maxTrend) * 100 : 0
                    const isLast = i === trendMonths.length - 1
                    return (
                      <div key={month} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs font-semibold text-gray-700">{val}</span>
                        <div
                          className={cn('w-full rounded-t-md transition-all', isLast ? 'bg-cemac-700' : 'bg-cemac-200')}
                          style={{ height: `${Math.max(h, 2)}%` }}
                          title={`${month}: ${val}`}
                        />
                        <span className="text-xs text-muted-foreground">{month}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Line-style trend — Marketplace */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('market_intelligence.trends.mkt_chart_title')}</CardTitle>
              <CardDescription>{t('market_intelligence.trends.mkt_chart_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {trendLoading ? (
                <div className="flex items-center justify-center py-8"><LoadingSpinner /></div>
              ) : (
                <div className="space-y-3">
                  {trendMonths.map((month, i) => {
                    const val = trendData.marketplace[i] ?? 0
                    const maxMkt = Math.max(...trendData.marketplace, 1)
                    const isLast = i === trendMonths.length - 1
                    return (
                      <div key={month} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-6">{month}</span>
                        <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all duration-500', isLast ? 'bg-blue-500' : 'bg-blue-300')}
                            style={{ width: `${(val / maxMkt) * 100}%` }}
                          />
                        </div>
                        <span className={cn('text-xs font-semibold w-8 text-right tabular-nums', isLast ? 'text-blue-700' : 'text-gray-600')}>
                          {val}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Country breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Répartition par pays CEMAC</CardTitle>
              <CardDescription>Certifications créées sur les neuf derniers mois</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {CEMAC_COUNTRIES.map((country) => {
                  const count = countryCounts[country.code] ?? 0
                  const total = Object.values(countryCounts).reduce((sum, value) => sum + value, 0)
                  const pct = total > 0 ? (count / total) * 100 : 0
                  return (
                  <div key={country.code} className="flex items-center gap-3">
                    <span className="text-sm w-40 shrink-0">{country.flag} {country.name}</span>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cemac-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-8 text-right text-cemac-700">{count}</span>
                  </div>
                )})}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── ASSISTANT TAB ─── */}
      {activeTab === 'assistant' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat window */}
          <div className="lg:col-span-3">
            <Card className="flex flex-col h-[600px]">
              <CardHeader className="border-b pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-cemac-700 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{t('market_intelligence.assistant.title')}</CardTitle>
                    <p className="text-xs text-muted-foreground">{t('market_intelligence.assistant.subtitle')}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto"
                    onClick={() => setMessages([{
                      role: 'bot',
                      text: t('market_intelligence.assistant.reset_message'),
                      time: new Date(),
                    }])}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    {msg.role === 'bot' && (
                      <div className="w-7 h-7 rounded-full bg-cemac-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="h-4 w-4 text-cemac-700" />
                      </div>
                    )}
                    <div className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-3 text-sm',
                      msg.role === 'user'
                        ? 'bg-cemac-700 text-white rounded-tr-none'
                        : 'bg-gray-100 text-gray-900 rounded-tl-none'
                    )}>
                      {msg.role === 'bot' ? (
                        <div className="space-y-0.5">{formatBotMessage(msg.text)}</div>
                      ) : (
                        msg.text
                      )}
                      <p className={cn('text-xs mt-1.5 opacity-60', msg.role === 'user' ? 'text-right' : '')}>
                        {msg.time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-cemac-100 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-cemac-700" />
                    </div>
                    <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((d) => (
                          <div key={d} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="border-t p-4">
                <form
                  onSubmit={(e) => { e.preventDefault(); sendMessage(input) }}
                  className="flex gap-2"
                >
                  <Input
                    placeholder={t('market_intelligence.assistant.input_placeholder')}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1"
                    disabled={isTyping || cmsLoading || Boolean(cmsError) || cmsData.knowledge.length === 0}
                  />
                  <Button type="submit" disabled={!input.trim() || isTyping || cmsLoading || Boolean(cmsError) || cmsData.knowledge.length === 0}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </Card>
          </div>

          {/* Suggestions */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t('market_intelligence.assistant.suggestions_title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {cmsLoading ? (
                  <LoadingSpinner size="sm" className="py-4" />
                ) : cmsError ? (
                  <p role="alert" className="text-sm text-red-600">Impossible de charger la base de connaissances.</p>
                ) : cmsData.knowledge.length === 0 ? (
                  <p role="status" className="text-sm text-muted-foreground">Assistant indisponible.</p>
                ) : null}
                {suggestions.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => sendMessage(entry.suggestion)}
                    disabled={isTyping || cmsLoading || Boolean(cmsError) || cmsData.knowledge.length === 0}
                    className="w-full text-left text-sm px-3 py-2.5 rounded-lg border hover:bg-cemac-50 hover:border-cemac-200 hover:text-cemac-800 transition-colors disabled:opacity-50"
                  >
                    {entry.suggestion}
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-cemac-50 border-cemac-200">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-cemac-800">Note :</strong> L'assistant IA répond à partir d'une base de connaissances CEMAC/ZLECAF mise à jour trimestriellement.
                  Pour des cas complexes, consultez un expert douanier agréé.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
