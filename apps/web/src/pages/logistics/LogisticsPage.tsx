import { LoadingSpinner, LoadingCard } from "@/components/shared/LoadingSpinner";
import { useState, useEffect } from 'react'
import { jsPDF } from 'jspdf'
import {
  Truck, Package, Calculator, FileText,
  CheckCircle, Clock, MapPin, AlertTriangle, ArrowRight, Download,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDate, cn } from '@/lib/utils'
import type { Certification, Corridor, LogisticsAlert } from '@/types'
import toast from 'react-hot-toast'

type Tab = 'dashboard' | 'calculator' | 'eur1'

const ORIGIN_RULES = {
  cemac:  { threshold: 40, label: 'CEMAC',   accord: 'TEC CEMAC' },
  zlecaf: { threshold: 30, label: 'ZLECAF',  accord: 'AfCFTA' },
  eu:     { threshold: 50, label: 'UE',      accord: 'APE (Accord de Partenariat Économique)' },
  cedeao: { threshold: 35, label: 'CEDEAO',  accord: 'TEC CEDEAO' },
} as const

type Zone = keyof typeof ORIGIN_RULES

interface CalcResult {
  localValue: number
  qualifies: boolean
  threshold: number
  zone: string
}

export function LogisticsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const { t } = useTranslation()
  const entreprise = useAuthStore((s) => s.entreprise)

  const [certifications, setCertifications] = useState<Certification[]>([])
  const [loading, setLoading] = useState(true)

  // Live corridors and alerts from DB
  const [corridors, setCorridors] = useState<Corridor[]>([])
  const [alerts, setAlerts] = useState<LogisticsAlert[]>([])

  // Calculator state
  const [calcForm, setCalcForm] = useState({ productName: '', hsCode: '', totalCost: '', importedMaterials: '', zone: 'cemac' as Zone })
  const [calcResult, setCalcResult] = useState<CalcResult | null>(null)

  // EUR.1 form state
  const [eur1Form, setEur1Form] = useState({
    certificationId: '', exporterName: '', importerName: '',
    destination: '', description: '', grossWeight: '', packages: '',
  })

  useEffect(() => {
    // Load user certifications
    if (entreprise?.id) {
      supabase
        .from('certifications')
        .select('*')
        .eq('entreprise_id', entreprise.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => { if (data) setCertifications(data) })
    }
    // Load corridors and active alerts from DB
    Promise.all([
      supabase.from('corridors').select('*').order('created_at'),
      supabase.from('logistics_alerts').select('*').eq('is_active', true).order('created_at', { ascending: false }),
    ]).then(([corRes, altRes]) => {
      if (corRes.data) setCorridors(corRes.data)
      if (altRes.data) setAlerts(altRes.data)
      setLoading(false)
    })
  }, [entreprise?.id])

  const approvedCerts = certifications.filter((c) => c.statut === 'approved')
  const inTransit = certifications.filter((c) =>
    ['submitted', 'under_review', 'field_validation', 'commission_review'].includes(c.statut)
  )

  const handleCalculate = () => {
    const total = parseFloat(calcForm.totalCost)
    const imported = parseFloat(calcForm.importedMaterials)
    if (isNaN(total) || isNaN(imported) || total <= 0) {
      toast.error(t('logistics.calculator.error_invalid_costs'))
      return
    }
    if (imported > total) {
      toast.error(t('logistics.calculator.error_imported_exceeds'))
      return
    }
    const localValue = ((total - imported) / total) * 100
    const rule = ORIGIN_RULES[calcForm.zone]
    setCalcResult({ localValue, qualifies: localValue >= rule.threshold, threshold: rule.threshold, zone: rule.label })
  }

  const handleEur1Submit = (e: React.FormEvent) => {
    e.preventDefault()

    // ─── Génération du PDF EUR.1 ─────────────────────────────────────────
    const cert = approvedCerts.find((c) => c.id === eur1Form.certificationId)
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'A4' })
    const pageW = 210
    const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const refNumber = `EUR1-${cert?.numero_dossier ?? 'N/A'}-${Date.now().toString().slice(-5)}`

    // ── Fond de page et entête ──────────────────────────────────────────
    doc.setFillColor(29, 57, 55)         // cemac-900
    doc.rect(0, 0, pageW, 30, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('CERTIFICAT DE CIRCULATION DES MARCHANDISES', pageW / 2, 13, { align: 'center' })
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text('PROJET NON OFFICIEL — EUR.1', pageW / 2, 16, { align: 'center' })
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Document préparatoire non enregistré et sans valeur douanière', pageW / 2, 22, { align: 'center' })
    doc.text(`N° ${refNumber}`, pageW / 2, 27, { align: 'center' })

    // ── Corps : blocs info ──────────────────────────────────────────────
    let y = 40
    doc.setTextColor(30, 30, 30)

    const drawBlock = (title: string, lines: [string, string][], startY: number): number => {
      doc.setFillColor(240, 246, 245)
      doc.rect(14, startY, pageW - 28, 7, 'F')
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(29, 57, 55)
      doc.text(title.toUpperCase(), 16, startY + 5)
      doc.setTextColor(30, 30, 30)
      let innerY = startY + 12
      lines.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.text(label + ' :', 16, innerY)
        doc.setFont('helvetica', 'normal')
        doc.text(value || '—', 70, innerY)
        innerY += 7
      })
      return innerY + 4
    }

    y = drawBlock('1. Exportateur', [
      ['Raison sociale', eur1Form.exporterName],
      ['Pays d\'origine', cert?.pays_production ?? 'CEMAC'],
    ], y)

    y = drawBlock('2. Importateur / Destinataire', [
      ['Raison sociale', eur1Form.importerName],
      ['Pays de destination', eur1Form.destination],
    ], y)

    y = drawBlock('3. Marchandises', [
      ['Description', eur1Form.description],
      ['Poids brut (kg)', eur1Form.grossWeight || '—'],
      ['Nombre de colis', eur1Form.packages || '—'],
    ], y)

    y = drawBlock('4. Certification CEMAC de référence', [
      ['N° de dossier', cert?.numero_dossier ?? '—'],
      ['Produit certifié', cert?.produit_nom ?? '—'],
      ['Type', cert?.type_certification?.replace(/_/g, ' ') ?? '—'],
      ['Valeur ajoutée locale', cert?.valeur_ajoutee_locale ? `${cert.valeur_ajoutee_locale} %` : '—'],
    ], y)

    // ── Déclaration & Date ──────────────────────────────────────────────
    y += 4
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(80, 80, 80)
    const declaration = `Je soussigné certifie que les marchandises décrites ci-dessus sont originaires de l'espace CEMAC `
      + `au sens de l'Accord de Partenariat Économique UE-ACP et satisfont aux conditions d'origine requises. `
      + `Ce certificat a été établi sur la base de la certification CEMAC INTEGRA référencée ci-dessus.`
    const splitDecl = doc.splitTextToSize(declaration, pageW - 28)
    doc.text(splitDecl, 14, y)
    y += splitDecl.length * 5 + 8

    // Signatory zone
    doc.setDrawColor(180, 180, 180)
    doc.line(14, y, 95, y)
    doc.line(115, y, 196, y)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text('Signature de l\'exportateur', 14, y + 5)
    doc.text(`Fait le ${today}`, 115, y + 5)

    // ── Pied de page ────────────────────────────────────────────────────
    doc.setFillColor(29, 57, 55)
    doc.rect(0, 280, pageW, 17, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('CEMAC INTEGRA — Plateforme de certification numérique de la zone CEMAC', pageW / 2, 287, { align: 'center' })
    doc.text('Ce document est fourni à titre de référence. La validité officielle est subordonnée à l\'apposition du cachet de la chambre de commerce.', pageW / 2, 292, { align: 'center' })

    // ── Téléchargement ──────────────────────────────────────────────────
    doc.save(`EUR1_${refNumber}.pdf`)
    toast.success(`Projet EUR.1 généré (${refNumber}) — document non officiel`)
    setEur1Form({ certificationId: '', exporterName: '', importerName: '', destination: '', description: '', grossWeight: '', packages: '' })
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard',  label: t('logistics.tabs.dashboard'),   icon: Truck },
    { id: 'calculator', label: t('logistics.tabs.calculator'),  icon: Calculator },
    { id: 'eur1',       label: t('logistics.tabs.eur1'),        icon: FileText },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#0f3443_0%,#0f766e_52%,#e0aa2c_130%)] px-6 py-7 text-white shadow-[0_20px_60px_rgba(15,52,67,0.22)] sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_24%)]" />
        <div className="relative">
        <div className="hero-chip mb-4 border-white/15 bg-white/10 text-white">{t('logistics.badge')}</div>
        <h1 className="text-3xl font-black tracking-tight text-white">{t('logistics.title')}</h1>
        <p className="mt-2 text-sm text-white/75">
          {t('logistics.description')}
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

      {/* ─── DASHBOARD TAB ─── */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* KPI */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
            { label: t('logistics.kpi.ready'),    value: approvedCerts.length, icon: CheckCircle, color: 'text-green-600',  bg: 'bg-green-50'  },
              { label: t('logistics.kpi.in_transit'), value: inTransit.length,     icon: Clock,        color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { label: t('logistics.kpi.countries'),  value: new Set(certifications.map((c) => c.pays_production)).size, icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: t('logistics.kpi.total'),      value: certifications.length, icon: Package,      color: 'text-cemac-700',  bg: 'bg-cemac-50'  },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <Card key={label} className="metric-card hover:-translate-y-1">
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className={`p-3 rounded-xl ${bg}`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{loading ? '…' : value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Approved certifications */}
          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="text-base">{t('logistics.dashboard.certified_title')}</CardTitle>
              <CardDescription>{t('logistics.dashboard.certified_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingCard />
              ) : approvedCerts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-muted-foreground">{t('logistics.dashboard.no_approved')}</p>
                </div>
              ) : (
                <div className="divide-y">
                  {approvedCerts.map((cert) => (
                    <div key={cert.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{cert.produit_nom}</p>
                        <p className="text-xs text-muted-foreground">{cert.numero_dossier} · {cert.pays_production}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <StatusBadge status={cert.statut} />
                        {cert.date_expiration && (
                          <span className="text-xs text-muted-foreground hidden sm:block">
                            Exp. {formatDate(cert.date_expiration)}
                          </span>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActiveTab('eur1')
                            setEur1Form((p) => ({ ...p, certificationId: cert.id, description: cert.produit_nom }))
                          }}
                        >
                          EUR.1 <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Corridors + Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="metric-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-cemac-700" />
                  {t('logistics.dashboard.corridors_title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0 divide-y">
                {loading ? (
                  <LoadingSpinner size="sm" className="py-4" />
                ) : corridors.length === 0 ? (
                  <p className="py-4 text-sm text-center text-muted-foreground">{t('logistics.dashboard.no_corridors')}</p>
                ) : corridors.map((co) => (
                  <div key={co.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{co.route}</p>
                      <p className="text-xs text-muted-foreground">{co.mode} · {co.days}</p>
                    </div>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      co.status === 'Opérationnel' ? 'bg-green-100 text-green-700' :
                      co.status === 'Ralenti'       ? 'bg-yellow-100 text-yellow-700' :
                                                      'bg-red-100 text-red-700'
                    )}>
                      {co.status}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="metric-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  {t('logistics.dashboard.alerts_title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <LoadingSpinner size="sm" className="py-4" />
                ) : alerts.length === 0 ? (
                  <p className="py-4 text-sm text-center text-muted-foreground">{t('logistics.dashboard.no_alerts')}</p>
                ) : alerts.map((al) => (
                  <div key={al.id} className={cn(
                    'p-3 rounded-lg text-sm',
                    al.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                    al.type === 'danger'  ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'
                  )}>
                    <p className="font-semibold">{al.country}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{al.message}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ─── CALCULATOR TAB ─── */}
      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('logistics.calculator.title')}</CardTitle>
              <CardDescription>{t('logistics.calculator.desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">{t('logistics.calculator.product_name')}</label>
                  <Input
                    placeholder={t('logistics.calculator.product_name_placeholder')}
                    value={calcForm.productName}
                    onChange={(e) => setCalcForm((p) => ({ ...p, productName: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">{t('logistics.calculator.hs_code')}</label>
                  <Input
                    placeholder={t('logistics.calculator.hs_code_placeholder')}
                    value={calcForm.hsCode}
                    onChange={(e) => setCalcForm((p) => ({ ...p, hsCode: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">{t('logistics.calculator.total_cost')}</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Ex: 1 000 000"
                    value={calcForm.totalCost}
                    onChange={(e) => setCalcForm((p) => ({ ...p, totalCost: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">{t('logistics.calculator.imported_materials')}</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Ex: 300 000"
                    value={calcForm.importedMaterials}
                    onChange={(e) => setCalcForm((p) => ({ ...p, importedMaterials: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{t('logistics.calculator.target_zone')}</label>
                <select
                  className="w-full h-9 px-3 rounded-md border border-input bg-white text-sm focus:outline-none focus:ring-1 focus:ring-cemac-600"
                  value={calcForm.zone}
                  onChange={(e) => setCalcForm((p) => ({ ...p, zone: e.target.value as Zone }))}
                >
                  {(Object.keys(ORIGIN_RULES) as Zone[]).map((key) => (
                    <option key={key} value={key}>
                      {ORIGIN_RULES[key].label} — seuil {ORIGIN_RULES[key].threshold}% ({ORIGIN_RULES[key].accord})
                    </option>
                  ))}
                </select>
              </div>

              <Button onClick={handleCalculate} className="w-full">
                <Calculator className="h-4 w-4 mr-2" />
                {t('logistics.calculator.btn_calculate')}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {calcResult && (
              <Card className={cn('border-2', calcResult.qualifies ? 'border-green-400 bg-green-50' : 'border-red-300 bg-red-50')}>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', calcResult.qualifies ? 'bg-green-100' : 'bg-red-100')}>
                      {calcResult.qualifies
                        ? <CheckCircle className="h-6 w-6 text-green-600" />
                        : <AlertTriangle className="h-6 w-6 text-red-600" />}
                    </div>
                    <div>
                      <p className={cn('text-lg font-bold', calcResult.qualifies ? 'text-green-800' : 'text-red-800')}>
                        {calcResult.qualifies ? 'Produit ÉLIGIBLE ✓' : 'Produit NON ÉLIGIBLE ✗'}
                      </p>
                      <p className="text-sm text-muted-foreground">Zone {calcResult.zone}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Valeur ajoutée locale</span>
                      <span className="font-bold">{calcResult.localValue.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-700', calcResult.qualifies ? 'bg-green-500' : 'bg-red-500')}
                        style={{ width: `${Math.min(calcResult.localValue, 100)}%` }}
                      />
                    </div>
                    <div className="relative">
                      <div
                        className="absolute top-0 w-px h-3 bg-gray-600"
                        style={{ left: `${calcResult.threshold}%` }}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground pt-1">
                        <span>0%</span>
                        <span className="text-cemac-700 font-semibold">Seuil {calcResult.threshold}%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>

                  <div className={cn('rounded-lg p-3 text-sm', calcResult.qualifies ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                    {calcResult.qualifies
                      ? `✅ Votre valeur ajoutée locale (${calcResult.localValue.toFixed(1)}%) satisfait le seuil requis de ${calcResult.threshold}% pour la zone ${calcResult.zone}. Vous pouvez demander un certificat d'origine.`
                      : `❌ La valeur ajoutée locale (${calcResult.localValue.toFixed(1)}%) est en dessous du seuil de ${calcResult.threshold}% requis pour la zone ${calcResult.zone}. Augmentez la part locale.`}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Référentiel des seuils d'origine</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-muted-foreground">Zone</th>
                      <th className="text-center py-2 font-medium text-muted-foreground">Seuil min.</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Accord</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.keys(ORIGIN_RULES) as Zone[]).map((key) => (
                      <tr key={key} className="border-b last:border-0">
                        <td className="py-2.5 font-medium">{ORIGIN_RULES[key].label}</td>
                        <td className="py-2.5 text-center">
                          <span className="bg-cemac-50 text-cemac-800 px-2 py-0.5 rounded text-xs font-semibold">
                            {ORIGIN_RULES[key].threshold}%
                          </span>
                        </td>
                        <td className="py-2.5 text-muted-foreground text-xs">{ORIGIN_RULES[key].accord}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ─── EUR.1 TAB ─── */}
      {activeTab === 'eur1' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('logistics.eur1.title')}</CardTitle>
              <CardDescription>
                {t('logistics.eur1.desc')}
              </CardDescription>
              <p className="text-xs text-amber-700">
                Ce module génère uniquement un projet PDF local. La demande n’est pas enregistrée et le document n’est pas un certificat officiel.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEur1Submit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">{t('logistics.eur1.cert_label')} *</label>
                  <select
                    className="w-full h-9 px-3 rounded-md border border-input bg-white text-sm focus:outline-none focus:ring-1 focus:ring-cemac-600"
                    value={eur1Form.certificationId}
                    onChange={(e) => setEur1Form((p) => ({ ...p, certificationId: e.target.value }))}
                    required
                  >
                    <option value="">{t('logistics.eur1.cert_placeholder')}</option>
                    {approvedCerts.map((c) => (
                      <option key={c.id} value={c.id}>{c.numero_dossier} — {c.produit_nom}</option>
                    ))}
                  </select>
                  {approvedCerts.length === 0 && (
                    <p className="text-xs text-muted-foreground">{t('logistics.eur1.no_approved')}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">{t('logistics.eur1.exporter_label')} *</label>
                    <Input
                      placeholder={t('logistics.eur1.company_placeholder')}
                      value={eur1Form.exporterName}
                      onChange={(e) => setEur1Form((p) => ({ ...p, exporterName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">{t('logistics.eur1.importer_label')} *</label>
                    <Input
                      placeholder={t('logistics.eur1.company_placeholder')}
                      value={eur1Form.importerName}
                      onChange={(e) => setEur1Form((p) => ({ ...p, importerName: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">{t('logistics.eur1.destination_label')} *</label>
                  <Input
                    placeholder={t('logistics.eur1.destination_placeholder')}
                    value={eur1Form.destination}
                    onChange={(e) => setEur1Form((p) => ({ ...p, destination: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">{t('logistics.eur1.goods_label')} *</label>
                  <textarea
                    className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-white text-sm focus:outline-none focus:ring-1 focus:ring-cemac-600 resize-none"
                    placeholder={t('logistics.eur1.goods_placeholder')}
                    value={eur1Form.description}
                    onChange={(e) => setEur1Form((p) => ({ ...p, description: e.target.value }))}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">{t('logistics.eur1.weight_label')}</label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Ex: 500"
                      value={eur1Form.grossWeight}
                      onChange={(e) => setEur1Form((p) => ({ ...p, grossWeight: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">{t('logistics.eur1.packages_label')}</label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Ex: 12"
                      value={eur1Form.packages}
                      onChange={(e) => setEur1Form((p) => ({ ...p, packages: e.target.value }))}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  {t('logistics.eur1.btn_generate')}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="bg-cemac-700 text-white border-0">
              <CardContent className="pt-6 space-y-3">
                <FileText className="h-8 w-8 text-cemac-200" />
                <h3 className="font-semibold text-lg">Certificat de circulation EUR.1</h3>
                <p className="text-cemac-200 text-sm leading-relaxed">
                  Le certificat EUR.1 est le titre attestant l'origine préférentielle des marchandises
                  dans le cadre des Accords de Partenariat Économique (APE) entre l'Union Européenne
                  et les pays ACP, permettant une réduction ou exonération des droits de douane.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-cemac-800 rounded-lg p-3">
                    <p className="text-xs font-semibold text-cemac-100">Délai de traitement</p>
                    <p className="text-sm font-bold mt-0.5">3 – 5 jours ouvrés</p>
                  </div>
                  <div className="bg-cemac-800 rounded-lg p-3">
                    <p className="text-xs font-semibold text-cemac-100">Validité</p>
                    <p className="text-sm font-bold mt-0.5">10 mois</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Documents requis</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {[
                    'Certification CEMAC INTEGRA approuvée',
                    'Facture pro-forma ou commerciale',
                    'Liste de colisage (packing list)',
                    'Déclaration d\'exportation douanière',
                    'Justificatif de règles d\'origine (≥ 50 % valeur locale)',
                    'Certificat sanitaire ou phytosanitaire si requis',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
