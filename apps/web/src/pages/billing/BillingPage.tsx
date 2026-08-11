import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Receipt, Download, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Invoice } from '@/types'

const CEMAC_TAX_RATES: Record<string, { rate: number; label: string }> = {
  CM: { rate: 19.25, label: 'TVA' },
  GA: { rate: 18,    label: 'TVA' },
  CG: { rate: 18.9,  label: 'TVA' },
  TD: { rate: 18,    label: 'TVA' },
  CF: { rate: 19,    label: 'TVA' },
  GQ: { rate: 15,    label: 'TVA' },
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  mtn_momo:      'MTN Mobile Money',
  orange_money:  'Orange Money',
  bank_transfer: 'Virement bancaire',
}

async function downloadInvoicePdf(inv: Invoice, userName: string) {
  // Dynamic import to keep bundle lean
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const taxInfo = CEMAC_TAX_RATES[inv.country] ?? { rate: inv.tax_rate, label: 'TVA' }
  const pageW = doc.internal.pageSize.getWidth()

  // ── Header ──────────────────────────────────────────────────────────────
  doc.setFillColor(0, 80, 60)
  doc.rect(0, 0, pageW, 36, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('CEMAC INTEGRA', 15, 16)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Plateforme Régionale de Commerce · Zone CEMAC', 15, 23)
  doc.text('Yaoundé, Cameroun · cemac-integra.com', 15, 29)

  // Invoice label
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('FACTURE', pageW - 15, 14, { align: 'right' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(inv.invoice_number, pageW - 15, 20, { align: 'right' })
  doc.text(`Émise le : ${new Date(inv.issued_at).toLocaleDateString('fr-FR')}`, pageW - 15, 26, { align: 'right' })
  doc.text(`Échéance : ${new Date(inv.due_at).toLocaleDateString('fr-FR')}`, pageW - 15, 32, { align: 'right' })

  // ── Client info ─────────────────────────────────────────────────────────
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Facturé à :', 15, 48)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(userName, 15, 55)
  doc.text(`Pays : ${inv.country}`, 15, 61)

  // ── Line items ──────────────────────────────────────────────────────────
  const tableTop = 73
  doc.setFillColor(240, 248, 244)
  doc.rect(15, tableTop, pageW - 30, 7, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 30)
  doc.text('Description', 17, tableTop + 5)
  doc.text('Période', 100, tableTop + 5)
  doc.text('Montant HT', 145, tableTop + 5)

  doc.setFont('helvetica', 'normal')
  const y1 = tableTop + 14
  const planLabel = inv.plan_name.charAt(0).toUpperCase() + inv.plan_name.slice(1)
  doc.text(`Abonnement CEMAC INTEGRA — Plan ${planLabel}`, 17, y1)
  doc.text(inv.billing_period === 'yearly' ? 'Annuel' : 'Mensuel', 100, y1)
  doc.text(`${inv.amount_ht.toLocaleString('fr-FR')} XAF`, 145, y1)

  // ── Totals ──────────────────────────────────────────────────────────────
  const totY = y1 + 16
  doc.setDrawColor(210, 210, 210)
  doc.line(100, totY - 4, pageW - 15, totY - 4)
  doc.setFontSize(9)
  doc.text('Montant HT :', 105, totY)
  doc.text(`${inv.amount_ht.toLocaleString('fr-FR')} XAF`, pageW - 15, totY, { align: 'right' })

  doc.text(`${taxInfo.label} ${taxInfo.rate}% :`, 105, totY + 7)
  doc.text(`${inv.tax_amount.toLocaleString('fr-FR')} XAF`, pageW - 15, totY + 7, { align: 'right' })

  doc.setFillColor(0, 80, 60)
  doc.rect(100, totY + 11, pageW - 115, 9, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('TOTAL TTC :', 105, totY + 17.5)
  doc.text(`${inv.amount_ttc.toLocaleString('fr-FR')} XAF`, pageW - 15, totY + 17.5, { align: 'right' })

  // ── Payment info ─────────────────────────────────────────────────────────
  doc.setTextColor(30, 30, 30)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('Mode de paiement :', 15, totY + 28)
  doc.setFont('helvetica', 'normal')
  doc.text(PAYMENT_METHOD_LABELS[inv.payment_method] ?? inv.payment_method, 65, totY + 28)
  if (inv.payment_ref) {
    doc.text('Référence :', 15, totY + 35)
    doc.text(inv.payment_ref, 65, totY + 35)
  }
  if (inv.status === 'paid' && inv.paid_at) {
    doc.text('Date de paiement :', 15, totY + 42)
    doc.text(new Date(inv.paid_at).toLocaleDateString('fr-FR'), 65, totY + 42)
  }

  // ── Footer ───────────────────────────────────────────────────────────────
  const footY = doc.internal.pageSize.getHeight() - 18
  doc.setDrawColor(210, 210, 210)
  doc.line(15, footY - 3, pageW - 15, footY - 3)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  doc.text('CEMAC INTEGRA · Plateforme digitale de commerce certifié · Zone CEMAC · AfCFTA', pageW / 2, footY + 2, { align: 'center' })
  doc.text('Ce document est une facture officielle générée automatiquement par CEMAC INTEGRA.', pageW / 2, footY + 7, { align: 'center' })

  doc.save(`${inv.invoice_number}.pdf`)
}

export function BillingPage() {
  const { t } = useTranslation()
  const profile = useAuthStore((s) => s.profile)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    if (!profile?.id) return
    supabase
      .from('invoices')
      .select('*')
      .eq('user_id', profile.id)
      .order('issued_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error('Impossible de charger les factures')
        else setInvoices(data ?? [])
        setLoading(false)
      })
  }, [profile?.id])

  const handleDownload = async (inv: Invoice) => {
    setDownloadingId(inv.id)
    try {
      await downloadInvoicePdf(inv, profile?.full_name ?? profile?.email ?? 'Client')
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors de la génération du PDF')
    }
    setDownloadingId(null)
  }

  const paidTotal = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount_ttc, 0)
  const pendingTotal = invoices.filter((i) => i.status === 'pending').reduce((s, i) => s + i.amount_ttc, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-cemac-50 flex items-center justify-center">
            <Receipt className="h-5 w-5 text-cemac-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('billing.title')}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t('billing.description')}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {!loading && invoices.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total payé', value: `${paidTotal.toLocaleString('fr-FR')} XAF`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'En attente', value: `${pendingTotal.toLocaleString('fr-FR')} XAF`, icon: Clock,      color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: 'Total factures', value: String(invoices.length), icon: Receipt,    color: 'text-cemac-700',  bg: 'bg-cemac-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className={`p-3 rounded-xl ${bg}`}><Icon className={`h-5 w-5 ${color}`} /></div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Invoice list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cemac-200 border-t-cemac-700" />
        </div>
      ) : invoices.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Receipt className="h-10 w-10 text-gray-300 mx-auto mb-4" />
            <p className="font-semibold text-gray-700">{t('billing.no_invoices')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('billing.no_invoices_hint')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const taxInfo = CEMAC_TAX_RATES[inv.country] ?? { rate: inv.tax_rate, label: 'TVA' }
            return (
              <Card key={inv.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                    {/* Invoice number + date */}
                    <div className="flex-shrink-0">
                      <p className="font-mono text-sm font-bold text-cemac-700">{inv.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(inv.issued_at)}</p>
                    </div>

                    {/* Plan + period */}
                    <div className="flex-1">
                      <p className="text-sm font-semibold capitalize">Plan {inv.plan_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {inv.billing_period === 'yearly' ? t('billing.period_yearly') : t('billing.period_monthly')}
                        {' · '}{PAYMENT_METHOD_LABELS[inv.payment_method] ?? inv.payment_method}
                        {inv.payment_ref ? ` · Réf: ${inv.payment_ref}` : ''}
                      </p>
                    </div>

                    {/* Tax breakdown */}
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">{inv.amount_ht.toLocaleString('fr-FR')} XAF HT</p>
                      <p className="text-xs text-muted-foreground">+ {taxInfo.label} {taxInfo.rate}% = {inv.tax_amount.toLocaleString('fr-FR')} XAF</p>
                    </div>

                    {/* Total TTC */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-bold text-gray-900">{inv.amount_ttc.toLocaleString('fr-FR')} XAF</p>
                      <p className="text-xs text-muted-foreground">TTC</p>
                    </div>

                    {/* Status badge */}
                    <div className="flex-shrink-0">
                      <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold',
                        inv.status === 'paid' ? 'bg-green-100 text-green-800' :
                        inv.status === 'cancelled' ? 'bg-gray-100 text-gray-600' :
                        'bg-yellow-100 text-yellow-800')}>
                        {t(`billing.status_${inv.status}`)}
                      </span>
                    </div>

                    {/* Download button */}
                    <div className="flex-shrink-0">
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleDownload(inv)} disabled={downloadingId === inv.id}>
                        {downloadingId === inv.id
                          ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
                          : <Download className="h-3.5 w-3.5" />
                        }
                        PDF
                      </Button>
                    </div>
                  </div>

                  {/* Mobile tax detail */}
                  <div className="sm:hidden mt-2 text-xs text-muted-foreground">
                    {inv.amount_ht.toLocaleString('fr-FR')} XAF HT + {taxInfo.label} {taxInfo.rate}% ({inv.tax_amount.toLocaleString('fr-FR')} XAF)
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
