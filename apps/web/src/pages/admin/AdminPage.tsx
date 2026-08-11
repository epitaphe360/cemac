import { LoadingSpinner, PageLoader, LoadingTableFull, LoadingCard } from "@/components/shared/LoadingSpinner";
﻿import { useState, useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Shield, Users, Award, Building2, BarChart3,
  Search, CheckCircle, XCircle, Clock,
  Eye, EyeOff, Package, FileText, History, Landmark, MapPin,
  AlertTriangle, Plus, Trash2, PencilLine, ToggleLeft, ToggleRight,
  Settings2, Save, RefreshCw, ChevronDown, ChevronUp,
  Receipt, MessageSquare, TrendingUp,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useTranslation } from 'react-i18next'
import { formatDate, cn } from '@/lib/utils'
import { CERTIFICATION_STATUS_LABELS, CEMAC_COUNTRIES } from '@/lib/constants'
import type { Profile, Entreprise, Certification, Document, WorkflowEvent, Produit, ChambreCommerce, Corridor, LogisticsAlert, ContactRequest, PricingPlan, TaxRate } from '@/types'
import { CmsAdminPanel } from './components/CmsAdminPanel'
import { ApiConfigStatusPanel } from './components/ApiConfigStatusPanel'
import toast from 'react-hot-toast'

type Tab = 'overview' | 'certifications' | 'users' | 'companies' | 'products' | 'documents' | 'audit' | 'chambers' | 'logistics' | 'cms' | 'api_config' | 'billing' | 'contact_requests'

const ADMIN_ROLES = ['super_admin', 'cemac_officer', 'chamber_agent'] as const

const ROLE_LABELS: Record<string, string> = {
  super_admin:     'Super Admin',
  cemac_officer:   'Agent CEMAC',
  chamber_agent:   'Chambre Commerce',
  company_admin:   'Entreprise',
  auditor:         'Auditeur',
  buyer:           'Acheteur',
  logistics_agent: 'Logistique',
  public:          'Public',
}

const ROLE_COLORS: Record<string, string> = {
  super_admin:     'bg-red-100 text-red-800',
  cemac_officer:   'bg-cemac-100 text-cemac-800',
  chamber_agent:   'bg-purple-100 text-purple-800',
  company_admin:   'bg-blue-100 text-blue-800',
  auditor:         'bg-orange-100 text-orange-800',
  buyer:           'bg-green-100 text-green-800',
  logistics_agent: 'bg-yellow-100 text-yellow-800',
  public:          'bg-gray-100 text-gray-600',
}

const SUBSCRIPTION_LABELS: Record<string, string> = {
  free:          'Gratuit',
  sme:           'Pro',
  enterprise:    'Entreprise',
  institutional: 'Institution',
}

interface GlobalStats {
  totalUsers: number
  totalCompanies: number
  totalCertifications: number
  approved: number
  pending: number
  rejected: number
}

export function AdminPage() {
  const role = useAuthStore((s) => s.role)()

  // Guard: redirect non-admin users
  if (!(ADMIN_ROLES as readonly string[]).includes(role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <AdminPageInner />
}

function AdminPageInner() {
  const { t } = useTranslation()
  const adminProfile = useAuthStore((s) => s.profile)
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  // ── Overview stats ───────────────────────────────────────────────────────
  const [stats, setStats] = useState<GlobalStats>({ totalUsers: 0, totalCompanies: 0, totalCertifications: 0, approved: 0, pending: 0, rejected: 0 })
  const [statsLoading, setStatsLoading] = useState(true)

  // ── Certifications ───────────────────────────────────────────────────────
  const [certifications, setCertifications] = useState<(Certification & { entreprise?: { raison_sociale: string; pays: string } })[]>([])
  const [certsLoading, setCertsLoading] = useState(false)
  const [certSearch, setCertSearch] = useState('')
  const [certStatusFilter, setCertStatusFilter] = useState('all')
  const [updatingCert, setUpdatingCert] = useState<string | null>(null)

  // ── Users ────────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<Profile[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('all')
  const [updatingUser, setUpdatingUser] = useState<string | null>(null)

  // ── Companies ────────────────────────────────────────────────────────────
  const [companies, setCompanies] = useState<Entreprise[]>([])
  const [companiesLoading, setCompaniesLoading] = useState(false)
  const [companySearch, setCompanySearch] = useState('')
  const [updatingCompany, setUpdatingCompany] = useState<string | null>(null)

  // ── Products ─────────────────────────────────────────────────────────────
  const [products, setProducts] = useState<(Produit & { entreprise?: { raison_sociale: string } })[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [updatingProduct, setUpdatingProduct] = useState<string | null>(null)

  // ── Documents ────────────────────────────────────────────────────────────
  const [documents, setDocuments] = useState<(Document & { certification?: { numero_dossier: string; produit_nom: string } })[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [docSearch, setDocSearch] = useState('')

  // ── Audit log ────────────────────────────────────────────────────────────
  const [auditEvents, setAuditEvents] = useState<(WorkflowEvent & { certification?: { numero_dossier: string }; profile?: { email: string; full_name: string | null } })[]>([])
  const [auditLoading, setAuditLoading] = useState(false)

  // ── Chambres ─────────────────────────────────────────────────────────────
  const [chambers, setChambers] = useState<ChambreCommerce[]>([])
  const [chambersLoading, setChambersLoading] = useState(false)
  const [chamberSearch, setChamberSearch] = useState('')
  const [chamberForm, setChamberForm] = useState({ nom: '', pays: '', ville: '', email: '', telephone: '' })
  const [savingChamber, setSavingChamber] = useState(false)
  const [editingChamber, setEditingChamber] = useState<ChambreCommerce | null>(null)

  // ── Corridors ────────────────────────────────────────────────────────────
  const [corridors, setCorridors] = useState<Corridor[]>([])
  const [alerts, setAlerts] = useState<LogisticsAlert[]>([])
  const [logisticsLoading, setLogisticsLoading] = useState(false)
  const [updatingCorridor, setUpdatingCorridor] = useState<string | null>(null)
  const [updatingAlert, setUpdatingAlert] = useState<string | null>(null)
  const [corridorForm, setCorridorForm] = useState({ route: '', mode: 'Route' as Corridor['mode'], days: '', status: 'Opérationnel' as Corridor['status'] })
  const [alertForm, setAlertForm] = useState({ country: '', message: '', type: 'info' as LogisticsAlert['type'] })
  const [savingCorridor, setSavingCorridor] = useState(false)
  const [savingAlert, setSavingAlert] = useState(false)

  // Conservé uniquement le temps de rendre l'ancien panneau inatteignable ;
  // les données sensibles ne sont plus chargées depuis api_configs.
  const legacyApiEditorEnabled = false
  const apiConfigsLoading = false
  const [apiConfigs, setApiConfigs] = useState<Array<{ key: string; config: Record<string, string>; is_active: boolean }>>([])
  const [apiConfigsDraft, setApiConfigsDraft] = useState<Record<string, Record<string, string>>>({})
  const [apiConfigsVisible, setApiConfigsVisible] = useState<Record<string, boolean>>({})
  const [apiConfigsExpanded, setApiConfigsExpanded] = useState<Record<string, boolean>>({})
  const [savingApiConfig, setSavingApiConfig] = useState<string | null>(null)

  // ── Billing / Invoices ───────────────────────────────────────────────────
  interface AdminInvoice {
    id: string; invoice_number: string; user_id: string; company_id: string | null
    plan_name: string; amount_ht: number; tax_rate: number; tax_amount: number
    amount_ttc: number; currency: string; country: string; payment_method: string
    payment_ref: string | null; status: 'pending' | 'paid' | 'cancelled'
    billing_period: string; issued_at: string; due_at: string; paid_at: string | null
    notes: string | null
    profile?: { email: string; full_name: string | null }
  }
  const [invoices, setInvoices] = useState<AdminInvoice[]>([])
  const [invoicesLoading, setInvoicesLoading] = useState(false)
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('all')
  const [updatingInvoice, setUpdatingInvoice] = useState<string | null>(null)
  const [showCreateInvoice, setShowCreateInvoice] = useState(false)
  const [invoiceForm, setInvoiceForm] = useState({
    user_email: '', plan_name: 'sme', payment_method: 'bank_transfer',
    payment_ref: '', billing_period: 'monthly', country: 'CM', notes: '',
  })
  const [creatingInvoice, setCreatingInvoice] = useState(false)
  const [billingPlans, setBillingPlans] = useState<PricingPlan[]>([])
  const [billingTaxRates, setBillingTaxRates] = useState<TaxRate[]>([])

  // ── Contact Requests ─────────────────────────────────────────────────────
  const [contacts, setContacts] = useState<ContactRequest[]>([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [contactSearch, setContactSearch] = useState('')

  // ── Synchronisation : flags de chargement par onglet ────────────────────
  // Utiliser un Set en ref pour savoir quels onglets ont déjà été chargés
  // (sans déclencher de re-render). refreshKey force un rechargement manuel.
  const fetchedTabs = useRef<Set<Tab>>(new Set())
  const [refreshKey, setRefreshKey] = useState(0)

  const refreshCurrentTab = () => {
    fetchedTabs.current.delete(activeTab)
    // Réinitialise les données de l'onglet actif pour forcer le re-fetch
    if (activeTab === 'certifications') { setCertifications([]); setCertsLoading(false) }
    else if (activeTab === 'users')      { setUsers([]); setUsersLoading(false) }
    else if (activeTab === 'companies')  { setCompanies([]); setCompaniesLoading(false) }
    else if (activeTab === 'products')   { setProducts([]); setProductsLoading(false) }
    else if (activeTab === 'documents')  { setDocuments([]); setDocumentsLoading(false) }
    else if (activeTab === 'audit')      { setAuditEvents([]); setAuditLoading(false) }
    else if (activeTab === 'chambers')   { setChambers([]); setChambersLoading(false) }
    else if (activeTab === 'logistics')  { setCorridors([]); setAlerts([]); setLogisticsLoading(false) }
    else if (activeTab === 'billing')    { setInvoices([]); setInvoicesLoading(false) }
    else if (activeTab === 'contact_requests') { setContacts([]); setContactsLoading(false) }
    else if (activeTab === 'overview')   { setStatsLoading(true) }
    setRefreshKey((k) => k + 1)
  }

  // ── Load global stats (overview) ─────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'overview' && fetchedTabs.current.has('overview')) return
    const fetchStats = async () => {
      setStatsLoading(true)
      try {
        const [usersRes, companiesRes, certsRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('entreprises').select('id', { count: 'exact', head: true }),
          supabase.from('certifications').select('statut'),
        ])
        if (certsRes.error) throw certsRes.error
        const certs = certsRes.data ?? []
        setStats({
          totalUsers:          usersRes.count ?? 0,
          totalCompanies:      companiesRes.count ?? 0,
          totalCertifications: certs.length,
          approved:  certs.filter((c) => c.statut === 'approved').length,
          pending:   certs.filter((c) => ['submitted', 'under_review', 'field_validation', 'commission_review'].includes(c.statut)).length,
          rejected:  certs.filter((c) => c.statut === 'rejected').length,
        })
        fetchedTabs.current.add('overview')
      } catch {
        toast.error(t('admin.toasts.stats_error', 'Erreur lors du chargement des statistiques'))
      } finally {
        setStatsLoading(false)
      }
    }
    fetchStats()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey])

  // ── Lazy-load tab data ───────────────────────────────────────────────────
  useEffect(() => {
    if (fetchedTabs.current.has(activeTab)) return
    const isChamberAgent = adminProfile?.role === 'chamber_agent' && !!adminProfile?.country

    if (activeTab === 'certifications') {
      setCertsLoading(true)
      supabase
        .from('certifications')
        .select(`*, entreprise:entreprises!certifications_entreprise_id_fkey (raison_sociale, pays)`)
        .order('created_at', { ascending: false })
        .limit(200)
        .then(({ data, error }) => {
          if (error) { toast.error(t('admin.toasts.load_error', 'Erreur chargement certifications')); }
          else {
            const d = (data ?? []) as unknown as Array<Certification & { entreprise: { pays: string } | null }>
            const filtered = isChamberAgent ? d.filter((c) => c.entreprise?.pays === adminProfile!.country) : d
            setCertifications(filtered as unknown as Certification[])
            fetchedTabs.current.add('certifications')
          }
          setCertsLoading(false)
        })
    }
    if (activeTab === 'users') {
      setUsersLoading(true)
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(200)
        .then(({ data, error }) => {
          if (error) { toast.error(t('admin.toasts.load_error', 'Erreur chargement utilisateurs')); }
          else {
            const filtered = isChamberAgent ? (data ?? []).filter((u) => u.country === adminProfile!.country) : (data ?? [])
            setUsers(filtered)
            fetchedTabs.current.add('users')
          }
          setUsersLoading(false)
        })
    }
    if (activeTab === 'companies') {
      setCompaniesLoading(true)
      supabase.from('entreprises').select('*').order('created_at', { ascending: false }).limit(200)
        .then(({ data, error }) => {
          if (error) { toast.error(t('admin.toasts.load_error', 'Erreur chargement entreprises')); }
          else {
            const filtered = isChamberAgent ? (data ?? []).filter((c) => c.pays === adminProfile!.country) : (data ?? [])
            setCompanies(filtered)
            fetchedTabs.current.add('companies')
          }
          setCompaniesLoading(false)
        })
    }
    if (activeTab === 'products') {
      setProductsLoading(true)
      supabase
        .from('produits')
        .select(`*, entreprise:entreprises (raison_sociale)`)
        .order('created_at', { ascending: false })
        .limit(300)
        .then(({ data, error }) => {
          if (error) toast.error(t('admin.toasts.load_error', 'Erreur chargement produits'))
          else { setProducts((data ?? []) as unknown as typeof products); fetchedTabs.current.add('products') }
          setProductsLoading(false)
        })
    }
    if (activeTab === 'documents') {
      setDocumentsLoading(true)
      supabase
        .from('documents')
        .select(`*, certification:certifications!documents_certification_id_fkey (numero_dossier, produit_nom)`)
        .order('created_at', { ascending: false })
        .limit(200)
        .then(({ data, error }) => {
          if (error) toast.error(t('admin.toasts.load_error', 'Erreur chargement documents'))
          else { setDocuments((data ?? []) as unknown as typeof documents); fetchedTabs.current.add('documents') }
          setDocumentsLoading(false)
        })
    }
    if (activeTab === 'audit') {
      setAuditLoading(true)
      supabase
        .from('workflow_events')
        .select(`*, certification:certifications!workflow_events_certification_id_fkey (numero_dossier), profile:profiles!workflow_events_created_by_fkey (email, full_name)`)
        .order('created_at', { ascending: false })
        .limit(300)
        .then(({ data, error }) => {
          if (error) toast.error(t('admin.toasts.load_error', 'Erreur chargement journal'))
          else { setAuditEvents((data ?? []) as unknown as typeof auditEvents); fetchedTabs.current.add('audit') }
          setAuditLoading(false)
        })
    }
    if (activeTab === 'chambers') {
      setChambersLoading(true)
      supabase.from('chambres_commerce').select('*').order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) toast.error(t('admin.toasts.load_error', 'Erreur chargement chambres'))
          else { setChambers(data ?? []); fetchedTabs.current.add('chambers') }
          setChambersLoading(false)
        })
    }
    if (activeTab === 'billing') {
      setInvoicesLoading(true)
      Promise.all([
        supabase.from('invoices').select('*').order('issued_at', { ascending: false }).limit(300),
        supabase.from('profiles').select('id, email, full_name'),
        supabase.from('pricing_plans').select('*').eq('is_published', true).order('sort_order'),
        supabase.from('tax_rates').select('*').eq('is_active', true).order('country_code'),
      ]).then(([invoiceResult, profileResult, plansResult, taxResult]) => {
          if (invoiceResult.error || profileResult.error || plansResult.error || taxResult.error) {
            toast.error(t('admin.toasts.load_error', 'Erreur chargement factures'))
          } else {
            const profilesById = new Map((profileResult.data ?? []).map((item) => [item.id, item]))
            setInvoices((invoiceResult.data ?? []).map((invoice) => ({
              ...invoice,
              profile: profilesById.get(invoice.user_id),
            })))
            setBillingPlans(plansResult.data ?? [])
            setBillingTaxRates(taxResult.data ?? [])
            fetchedTabs.current.add('billing')
          }
          setInvoicesLoading(false)
        })
    }
    if (activeTab === 'contact_requests') {
      setContactsLoading(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase
        .from('contact_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300)
        .then(({ data, error }) => {
          if (error) toast.error(t('admin.toasts.load_error', 'Erreur chargement demandes contact'))
          else { setContacts(data ?? []); fetchedTabs.current.add('contact_requests') }
          setContactsLoading(false)
        })
    }
    if (activeTab === 'logistics') {
      setLogisticsLoading(true)
      Promise.all([
        supabase.from('corridors').select('*').order('created_at'),
        supabase.from('logistics_alerts').select('*').order('created_at', { ascending: false }),
      ]).then(([corRes, altRes]) => {
        const hasError = corRes.error || altRes.error
        if (hasError) toast.error(t('admin.toasts.load_error', 'Erreur chargement logistique'))
        else {
          setCorridors(corRes.data ?? [])
          setAlerts(altRes.data ?? [])
          fetchedTabs.current.add('logistics')
        }
        setLogisticsLoading(false)
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, refreshKey])

  // ── Actions: Certifications ──────────────────────────────────────────────
  const updateCertStatus = async (id: string, newStatus: string) => {
    setUpdatingCert(id)
    const extraFields: { qr_code_data?: string; date_approbation?: string } = {}
    if (newStatus === 'approved') {
      extraFields.qr_code_data = `${window.location.origin}/verify/${id}`
      extraFields.date_approbation = new Date().toISOString()
    }
    const { error } = await supabase
      .from('certifications')
      .update({ statut: newStatus, updated_at: new Date().toISOString(), ...extraFields })
      .eq('id', id)
    if (error) { toast.error(t('admin.toasts.status_error')) }
    else {
      const oldStatus = certifications.find((c) => c.id === id)?.statut ?? null
      setCertifications((prev) => prev.map((c) => c.id === id ? { ...c, statut: newStatus } : c))
      setStats((prev) => {
        const old = oldStatus ?? ''
        return {
          ...prev,
          approved: prev.approved + (newStatus === 'approved' ? 1 : 0) - (old === 'approved' ? 1 : 0),
          pending:  prev.pending  + (['submitted','under_review','field_validation','commission_review'].includes(newStatus) ? 1 : 0) - (['submitted','under_review','field_validation','commission_review'].includes(old) ? 1 : 0),
          rejected: prev.rejected + (newStatus === 'rejected' ? 1 : 0) - (old === 'rejected' ? 1 : 0),
        }
      })
      // Log audit trail
      if (adminProfile?.id) {
        await supabase.from('workflow_events').insert({
          certification_id: id,
          statut_precedent: oldStatus,
          statut_nouveau: newStatus,
          commentaire: `Statut mis à jour par l'administration CEMAC`,
          created_by: adminProfile.id,
        })
      }
      toast.success(t('admin.toasts.status_updated', { status: CERTIFICATION_STATUS_LABELS[newStatus] ?? newStatus }))
    }
    setUpdatingCert(null)
  }

  // ── Actions: Users ───────────────────────────────────────────────────────
  const updateUserRole = async (id: string, newRole: string) => {
    setUpdatingUser(id)
    const { error } = await supabase.rpc('admin_update_user_role', {
      target_user_id: id,
      target_role: newRole,
    })
    if (error) { toast.error(t('admin.toasts.role_error')) }
    else { setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role: newRole } : u)); toast.success(t('admin.toasts.role_updated')) }
    setUpdatingUser(null)
  }

  // ── Actions: Companies ───────────────────────────────────────────────────
  const toggleCompanyVerified = async (id: string, current: boolean) => {
    setUpdatingCompany(id)
    const { error } = await supabase.from('entreprises').update({ is_verified: !current, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) { toast.error(t('admin.toasts.company_verify_error')) }
    else { setCompanies((prev) => prev.map((c) => c.id === id ? { ...c, is_verified: !current } : c)); toast.success(!current ? t('admin.toasts.company_verified') : t('admin.toasts.company_unverified')) }
    setUpdatingCompany(null)
  }

  const updateCompanyPlan = async (id: string, plan: string) => {
    setUpdatingCompany(id)
    const { error } = await supabase.rpc('admin_set_subscription_plan', {
      target_entreprise_id: id,
      target_plan: plan,
    })
    if (error) { toast.error(t('admin.toasts.plan_error')) }
    else { setCompanies((prev) => prev.map((c) => c.id === id ? { ...c, subscription_plan: plan } : c)); toast.success(t('admin.toasts.plan_updated')) }
    setUpdatingCompany(null)
  }

  // ── Actions: Products ────────────────────────────────────────────────────
  const toggleProductPublished = async (id: string, current: boolean) => {
    setUpdatingProduct(id)
    const { error } = await supabase.from('produits').update({ is_published: !current, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) { toast.error(t('admin.toasts.product_toggle_error')) }
    else { setProducts((prev) => prev.map((p) => p.id === id ? { ...p, is_published: !current } : p)); toast.success(!current ? t('admin.toasts.product_published') : t('admin.toasts.product_unpublished')) }
    setUpdatingProduct(null)
  }

  const deleteProduct = async (id: string) => {
    if (!confirm(t('products.confirm_delete', { name: products.find((p) => p.id === id)?.nom ?? id }))) return
    setUpdatingProduct(id)
    const { error } = await supabase.from('produits').delete().eq('id', id)
    if (error) { toast.error(t('admin.toasts.product_delete_error')) }
    else { setProducts((prev) => prev.filter((p) => p.id !== id)); toast.success(t('admin.toasts.product_deleted')) }
    setUpdatingProduct(null)
  }

  // ── Actions: Chambers ────────────────────────────────────────────────────
  const saveChamber = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingChamber(true)
    if (editingChamber) {
      const { error } = await supabase.from('chambres_commerce').update({ ...chamberForm }).eq('id', editingChamber.id)
      if (error) { toast.error(t('admin.toasts.chamber_edit_error')) }
      else { setChambers((prev) => prev.map((c) => c.id === editingChamber.id ? { ...c, ...chamberForm } : c)); toast.success(t('admin.toasts.chamber_edited')); setEditingChamber(null) }
    } else {
      const { data, error } = await supabase.from('chambres_commerce').insert([chamberForm]).select().single()
      if (error) { toast.error(t('admin.toasts.chamber_create_error')) }
      else { setChambers((prev) => [data, ...prev]); toast.success(t('admin.toasts.chamber_created')) }
    }
    setChamberForm({ nom: '', pays: '', ville: '', email: '', telephone: '' })
    setSavingChamber(false)
  }

  const deleteChamber = async (id: string) => {
    if (!confirm(t('common.confirm'))) return
    const { error } = await supabase.from('chambres_commerce').delete().eq('id', id)
    if (error) { toast.error(t('admin.toasts.chamber_delete_error')) }
    else { setChambers((prev) => prev.filter((c) => c.id !== id)); toast.success(t('admin.toasts.chamber_deleted')) }
  }

  // ── Actions: Corridors ───────────────────────────────────────────────────
  const saveCorridor = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingCorridor(true)
    const { data, error } = await supabase.from('corridors').insert([corridorForm]).select().single()
    if (error) { toast.error(t('admin.toasts.corridor_error')) }
    else { setCorridors((prev) => [...prev, data!]); toast.success(t('admin.toasts.corridor_created')); setCorridorForm({ route: '', mode: 'Route', days: '', status: 'Opérationnel' }) }
    setSavingCorridor(false)
  }

  const updateCorridorStatus = async (id: string, status: Corridor['status']) => {
    setUpdatingCorridor(id)
    const { error } = await supabase.from('corridors').update({ status }).eq('id', id)
    if (error) { toast.error(t('admin.toasts.corridor_status_error')) }
    else { setCorridors((prev) => prev.map((c) => c.id === id ? { ...c, status } : c)); toast.success(t('admin.toasts.corridor_status_ok')) }
    setUpdatingCorridor(null)
  }

  const deleteCorridor = async (id: string) => {
    if (!confirm(t('common.confirm'))) return
    const { error } = await supabase.from('corridors').delete().eq('id', id)
    if (error) { toast.error(t('admin.toasts.corridor_delete_error')) }
    else { setCorridors((prev) => prev.filter((c) => c.id !== id)); toast.success(t('admin.toasts.corridor_deleted')) }
  }

  // ── Actions: Alerts ──────────────────────────────────────────────────────
  const saveAlert = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingAlert(true)
    const { data, error } = await supabase.from('logistics_alerts').insert([alertForm]).select().single()
    if (error) { toast.error(t('admin.toasts.alert_create_error')) }
    else { setAlerts((prev) => [data!, ...prev]); toast.success(t('admin.toasts.alert_created')); setAlertForm({ country: '', message: '', type: 'info' }) }
    setSavingAlert(false)
  }

  const toggleAlert = async (id: string, current: boolean) => {
    setUpdatingAlert(id)
    const { error } = await supabase.from('logistics_alerts').update({ is_active: !current }).eq('id', id)
    if (error) { toast.error(t('admin.toasts.alert_toggle_error')) }
    else { setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, is_active: !current } : a)); toast.success(!current ? t('admin.toasts.alert_activated') : t('admin.toasts.alert_deactivated')) }
    setUpdatingAlert(null)
  }

  const deleteAlert = async (id: string) => {
    if (!confirm(t('common.confirm'))) return
    const { error } = await supabase.from('logistics_alerts').delete().eq('id', id)
    if (error) { toast.error(t('admin.toasts.alert_delete_error')) }
    else { setAlerts((prev) => prev.filter((a) => a.id !== id)); toast.success(t('admin.toasts.alert_deleted')) }
  }

  // ── Filtered lists ───────────────────────────────────────────────────────
  const filteredCerts = certifications.filter((c) => {
    const q = certSearch.toLowerCase()
    const matchSearch = c.produit_nom.toLowerCase().includes(q) || c.numero_dossier.toLowerCase().includes(q)
      || (c.entreprise as { raison_sociale: string } | undefined)?.raison_sociale?.toLowerCase().includes(q)
    return matchSearch && (certStatusFilter === 'all' || c.statut === certStatusFilter)
  })

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase()
    return ((u.full_name ?? '').toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      && (userRoleFilter === 'all' || u.role === userRoleFilter)
  })

  const filteredCompanies = companies.filter((c) =>
    c.raison_sociale.toLowerCase().includes(companySearch.toLowerCase()) || c.pays.toLowerCase().includes(companySearch.toLowerCase())
  )

  const filteredProducts = products.filter((p) => {
    const q = productSearch.toLowerCase()
    return p.nom.toLowerCase().includes(q) || (p.entreprise as { raison_sociale: string } | undefined)?.raison_sociale?.toLowerCase().includes(q)
  })

  const filteredDocs = documents.filter((d) => {
    const q = docSearch.toLowerCase()
    return d.nom_fichier.toLowerCase().includes(q) || (d.certification as { numero_dossier: string } | undefined)?.numero_dossier?.toLowerCase().includes(q)
  })

  const filteredChambers = chambers.filter((c) =>
    c.nom.toLowerCase().includes(chamberSearch.toLowerCase()) || c.pays.toLowerCase().includes(chamberSearch.toLowerCase())
  )

  // ── Tabs config ──────────────────────────────────────────────────────────
  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview',       label: t('admin.tabs.overview'),       icon: BarChart3  },
    { id: 'certifications', label: t('admin.tabs.certifications'), icon: Award      },
    { id: 'users',          label: t('admin.tabs.users'),          icon: Users      },
    { id: 'companies',      label: t('admin.tabs.companies'),      icon: Building2  },
    { id: 'products',       label: t('admin.tabs.products'),       icon: Package    },
    { id: 'documents',      label: t('admin.tabs.documents'),      icon: FileText   },
    { id: 'audit',          label: t('admin.tabs.audit'),          icon: History    },
    { id: 'chambers',       label: t('admin.tabs.chambers'),       icon: Landmark   },
    { id: 'logistics',      label: t('admin.tabs.logistics'),      icon: MapPin     },
    ...(adminProfile?.role === 'super_admin' ? [
      { id: 'cms' as Tab,              label: 'Contenu CMS',                    icon: FileText      },
      { id: 'api_config' as Tab,       label: t('admin.tabs.api_config'),       icon: Settings2     },
      { id: 'billing' as Tab,          label: t('admin.billing.tab_label'),     icon: Receipt       },
      { id: 'contact_requests' as Tab, label: t('admin.contacts.tab_label'),    icon: MessageSquare },
    ] : []),
  ]

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
          <Shield className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('admin.description')}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto flex items-center gap-2"
          onClick={refreshCurrentTab}
        >
          <RefreshCw className="h-4 w-4" />
          {t('common.refresh', 'Actualiser')}
        </Button>
      </div>

      {/* Tabs — scrollable on mobile */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap',
              activeTab === id ? 'bg-white text-cemac-800 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW TAB ──────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: t('admin.overview.users'),     value: stats.totalUsers,          icon: Users,       color: 'text-blue-600',   bg: 'bg-blue-50'   },
              { label: t('admin.overview.companies'), value: stats.totalCompanies,      icon: Building2,   color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: t('admin.overview.total'),     value: stats.totalCertifications, icon: Award,       color: 'text-cemac-700',  bg: 'bg-cemac-50'  },
              { label: t('admin.overview.approved'),  value: stats.approved,            icon: CheckCircle, color: 'text-green-600',  bg: 'bg-green-50'  },
              { label: t('admin.overview.pending'),   value: stats.pending,             icon: Clock,       color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { label: t('admin.overview.rejected'),  value: stats.rejected,            icon: XCircle,     color: 'text-red-600',    bg: 'bg-red-50'    },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <Card key={label} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className={`p-3 rounded-xl ${bg}`}><Icon className={`h-5 w-5 ${color}`} /></div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{statsLoading ? '…' : value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {!statsLoading && stats.totalCertifications > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('admin.overview.approval_title')}</CardTitle>
                <CardDescription>{t('admin.overview.approval_desc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: t('admin.overview.approved'), value: stats.approved, color: 'bg-green-500' },
                  { label: t('admin.overview.pending'),  value: stats.pending,  color: 'bg-yellow-400' },
                  { label: t('admin.overview.rejected'), value: stats.rejected, color: 'bg-red-500' },
                ].map(({ label, value, color }) => {
                  const pct = (value / stats.totalCertifications) * 100
                  return (
                    <div key={label} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-semibold">{value} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {([
              { label: t('admin.tabs.certifications'), icon: Award,     desc: t('admin.overview.certs_desc'),     tab: 'certifications' },
              { label: t('admin.tabs.users'),          icon: Users,     desc: t('admin.overview.users_desc'),     tab: 'users' },
              { label: t('admin.tabs.companies'),      icon: Building2, desc: t('admin.overview.companies_desc'), tab: 'companies' },
              { label: t('admin.tabs.products'),       icon: Package,   desc: t('admin.overview.products_desc'),  tab: 'products' },
              { label: t('admin.tabs.chambers'),       icon: Landmark,  desc: t('admin.overview.chambers_desc'),  tab: 'chambers' },
              { label: t('admin.tabs.logistics'),      icon: MapPin,    desc: t('admin.overview.logistics_desc'), tab: 'logistics' },
              ...(adminProfile?.role === 'super_admin' ? [
                { label: t('admin.tabs.api_config'),        icon: Settings2,     desc: t('admin.overview.api_config_desc'), tab: 'api_config' as Tab },
                { label: t('admin.billing.tab_label'),      icon: Receipt,       desc: t('admin.billing.tab_desc'),          tab: 'billing' as Tab },
                { label: t('admin.contacts.tab_label'),     icon: MessageSquare, desc: t('admin.contacts.tab_desc'),         tab: 'contact_requests' as Tab },
              ] : []),
            ] as { label: string; icon: React.ElementType; desc: string; tab: Tab }[]).map(({ label, icon: Icon, desc, tab }) => (
              <button key={label} onClick={() => setActiveTab(tab)}
                className="text-left p-4 rounded-xl border hover:border-cemac-300 hover:bg-cemac-50 transition-all group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-cemac-100 flex items-center justify-center group-hover:bg-cemac-200 transition-colors">
                    <Icon className="h-5 w-5 text-cemac-700" />
                  </div>
                  <p className="font-semibold text-sm text-gray-900">{label}</p>
                </div>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── CERTIFICATIONS TAB ────────────────────────────────────────── */}
      {activeTab === 'certifications' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t('admin.certs.search_placeholder')} className="pl-9" value={certSearch} onChange={(e) => setCertSearch(e.target.value)} />
            </div>
            <select className="h-9 px-3 rounded-md border border-input bg-white text-sm focus:outline-none focus:ring-1 focus:ring-cemac-600"
              value={certStatusFilter} onChange={(e) => setCertStatusFilter(e.target.value)}>
              <option value="all">{t('admin.certs.all_statuses')}</option>
              {Object.entries(CERTIFICATION_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <Card>
            <CardContent className="p-0">
              {certsLoading ? <LoadingTableFull /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.certs.col_file')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.certs.col_product')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.certs.col_company')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.certs.col_status')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.certs.col_date')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.certs.col_action')}</th>
                    </tr></thead>
                    <tbody>
                      {filteredCerts.map((cert) => (
                        <tr key={cert.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{cert.numero_dossier}</td>
                          <td className="px-4 py-3 font-medium text-gray-900 max-w-[150px] truncate">{cert.produit_nom}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground max-w-[130px] truncate">{(cert.entreprise as { raison_sociale: string } | undefined)?.raison_sociale ?? '—'}</td>
                          <td className="px-4 py-3"><StatusBadge status={cert.statut} /></td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(cert.created_at)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <select className="h-7 px-2 rounded border border-input bg-white text-xs focus:outline-none focus:ring-1 focus:ring-cemac-600"
                                value={cert.statut} onChange={(e) => updateCertStatus(cert.id, e.target.value)} disabled={updatingCert === cert.id}>
                                {Object.entries(CERTIFICATION_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                              </select>
                              {updatingCert === cert.id && <LoadingSpinner size="sm" />}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredCerts.length === 0 && <p className="text-center py-10 text-sm text-muted-foreground">{t('admin.certs.no_results')}</p>}
                </div>
              )}
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground">{t('admin.certs.count_other', { count: filteredCerts.length })}</p>
        </div>
      )}

      {/* ─── USERS TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t('admin.users.search_placeholder')} className="pl-9" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
            </div>
            <select className="h-9 px-3 rounded-md border border-input bg-white text-sm focus:outline-none focus:ring-1 focus:ring-cemac-600"
              value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)}>
              <option value="all">{t('admin.users.all_roles')}</option>
              {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <Card>
            <CardContent className="p-0">
              {usersLoading ? <LoadingTableFull /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.users.col_name')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.users.col_email')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.users.col_role')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.users.col_country')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.users.col_registered')}</th>
                    </tr></thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900">{user.full_name ?? '—'}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{user.email}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <select
                                className={cn('h-7 px-2 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-cemac-600', ROLE_COLORS[user.role] ?? 'bg-gray-100')}
                                value={user.role}
                                onChange={(e) => updateUserRole(user.id, e.target.value)}
                                disabled={updatingUser === user.id}
                              >
                                {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                              </select>
                              {updatingUser === user.id && <LoadingSpinner size="sm" />}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{user.country ?? '—'}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(user.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && <p className="text-center py-10 text-sm text-muted-foreground">{t('admin.users.no_results')}</p>}
                </div>
              )}
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground">{t('admin.users.count_other', { count: filteredUsers.length })}</p>
        </div>
      )}

      {/* ─── COMPANIES TAB ─────────────────────────────────────────────── */}
      {activeTab === 'companies' && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('admin.companies.search_placeholder')} className="pl-9" value={companySearch} onChange={(e) => setCompanySearch(e.target.value)} />
          </div>
          <Card>
            <CardContent className="p-0">
              {companiesLoading ? <LoadingTableFull /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.companies.col_company')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.companies.col_country')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.companies.col_plan')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.companies.col_verified')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.companies.col_created')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.companies.col_actions')}</th>
                    </tr></thead>
                    <tbody>
                      {filteredCompanies.map((co) => (
                        <tr key={co.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900 max-w-[180px] truncate">{co.raison_sociale}</p>
                            {co.secteur_activite && <p className="text-xs text-muted-foreground">{co.secteur_activite}</p>}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{co.pays}</td>
                          <td className="px-4 py-3">
                            <select
                              className="h-7 px-2 rounded border border-input bg-white text-xs focus:outline-none focus:ring-1 focus:ring-cemac-600"
                              value={co.subscription_plan}
                              onChange={(e) => updateCompanyPlan(co.id, e.target.value)}
                              disabled={updatingCompany === co.id}
                            >
                              {Object.entries(SUBSCRIPTION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleCompanyVerified(co.id, co.is_verified)}
                              disabled={updatingCompany === co.id}
                              title={co.is_verified ? t('admin.companies.unverify_tooltip') : t('admin.companies.verify_tooltip')}
                            >
                              {updatingCompany === co.id
                                ? <LoadingSpinner size="sm" />
                                : co.is_verified
                                  ? <ToggleRight className="h-6 w-6 text-green-600" />
                                  : <ToggleLeft className="h-6 w-6 text-gray-400" />}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(co.created_at)}</td>
                          <td className="px-4 py-3">
                            <a href={`mailto:${co.email_contact ?? ''}`} className="text-xs text-cemac-700 hover:underline">
                              <Eye className="h-4 w-4 inline" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredCompanies.length === 0 && <p className="text-center py-10 text-sm text-muted-foreground">{t('admin.companies.no_results')}</p>}
                </div>
              )}
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground">{t('admin.companies.count_other', { count: filteredCompanies.length })}</p>
        </div>
      )}

      {/* ─── PRODUCTS TAB ──────────────────────────────────────────────── */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('admin.products.search_placeholder')} className="pl-9" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
          </div>
          <Card>
            <CardContent className="p-0">
              {productsLoading ? <LoadingTableFull /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.products.col_product')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.products.col_company')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.products.col_category')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.products.col_published')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.products.col_created')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.products.col_actions')}</th>
                    </tr></thead>
                    <tbody>
                      {filteredProducts.map((prod) => (
                        <tr key={prod.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900 max-w-[160px] truncate">{prod.nom}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground max-w-[130px] truncate">{(prod.entreprise as { raison_sociale: string } | undefined)?.raison_sociale ?? '—'}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{prod.categorie ?? '—'}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => toggleProductPublished(prod.id, prod.is_published)} disabled={updatingProduct === prod.id}>
                              {updatingProduct === prod.id
                                ? <LoadingSpinner size="sm" />
                                : prod.is_published
                                  ? <ToggleRight className="h-6 w-6 text-green-600" />
                                  : <ToggleLeft className="h-6 w-6 text-gray-400" />}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(prod.created_at)}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => deleteProduct(prod.id)} disabled={updatingProduct === prod.id} className="text-red-500 hover:text-red-700 p-1">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredProducts.length === 0 && <p className="text-center py-10 text-sm text-muted-foreground">{t('admin.products.no_results')}</p>}
                </div>
              )}
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground">{t('admin.products.count', { count: filteredProducts.length })}</p>
        </div>
      )}

      {/* ─── DOCUMENTS TAB ─────────────────────────────────────────────── */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('admin.documents.search_placeholder')} className="pl-9" value={docSearch} onChange={(e) => setDocSearch(e.target.value)} />
          </div>
          <Card>
            <CardContent className="p-0">
              {documentsLoading ? <LoadingTableFull /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.documents.col_file')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.documents.col_type')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.documents.col_folder')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.documents.col_uploaded')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.documents.col_size')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.documents.col_view')}</th>
                    </tr></thead>
                    <tbody>
                      {filteredDocs.map((doc) => (
                        <tr key={doc.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900 max-w-[180px] truncate">{doc.nom_fichier}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{doc.type_document.replace(/_/g, ' ')}</span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{(doc.certification as { numero_dossier: string } | undefined)?.numero_dossier ?? '—'}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(doc.created_at)}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{doc.taille ? `${(doc.taille / 1024).toFixed(0)} Ko` : '—'}</td>
                          <td className="px-4 py-3">
                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-cemac-700 hover:text-cemac-900">
                              <Eye className="h-4 w-4" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredDocs.length === 0 && <p className="text-center py-10 text-sm text-muted-foreground">{t('admin.documents.no_results')}</p>}
                </div>
              )}
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground">{t('admin.documents.count', { count: filteredDocs.length })}</p>
        </div>
      )}

      {/* ─── AUDIT LOG TAB ─────────────────────────────────────────────── */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{t('admin.audit.description')}</p>
          <Card>
            <CardContent className="p-0">
              {auditLoading ? <LoadingTableFull /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.audit.col_file')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.audit.col_before')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.audit.col_after')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.audit.col_by')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.audit.col_comment')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.audit.col_date')}</th>
                    </tr></thead>
                    <tbody>
                      {auditEvents.map((ev) => (
                        <tr key={ev.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{(ev.certification as { numero_dossier: string } | undefined)?.numero_dossier ?? '—'}</td>
                          <td className="px-4 py-3"><StatusBadge status={ev.statut_precedent ?? 'draft'} /></td>
                          <td className="px-4 py-3"><StatusBadge status={ev.statut_nouveau} /></td>
                          <td className="px-4 py-3 text-xs text-muted-foreground max-w-[120px] truncate">{(ev.profile as { email: string; full_name: string | null } | undefined)?.full_name ?? (ev.profile as { email: string } | undefined)?.email ?? '—'}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">{ev.commentaire ?? '—'}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(ev.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {auditEvents.length === 0 && <p className="text-center py-10 text-sm text-muted-foreground">{t('admin.audit.no_events')}</p>}
                </div>
              )}
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground">{t('admin.audit.count', { count: auditEvents.length })}</p>
        </div>
      )}

      {/* ─── CHAMBERS TAB ──────────────────────────────────────────────── */}
      {activeTab === 'chambers' && (
        <div className="space-y-6">
          {/* Form create/edit */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{editingChamber ? t('admin.chambers.form_edit') : t('admin.chambers.form_add')}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveChamber} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">{t('admin.chambers.field_name')} *</label>
                  <Input required placeholder="Chambre de Commerce de Yaoundé" value={chamberForm.nom} onChange={(e) => setChamberForm((p) => ({ ...p, nom: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">{t('admin.chambers.field_country')} *</label>
                  <select required className="w-full h-9 px-3 rounded-md border border-input bg-white text-sm focus:outline-none focus:ring-1 focus:ring-cemac-600"
                    value={chamberForm.pays} onChange={(e) => setChamberForm((p) => ({ ...p, pays: e.target.value }))}>
                    <option value="">-- Pays --</option>
                    {CEMAC_COUNTRIES.map((c) => <option key={c.code} value={c.name}>{c.flag} {c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">{t('admin.chambers.field_city')} *</label>
                  <Input required placeholder="Yaoundé" value={chamberForm.ville} onChange={(e) => setChamberForm((p) => ({ ...p, ville: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">{t('admin.chambers.field_email')}</label>
                  <Input type="email" placeholder="contact@chambre.cm" value={chamberForm.email} onChange={(e) => setChamberForm((p) => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">{t('admin.chambers.field_phone')}</label>
                  <Input placeholder="+237 6XX XXX XXX" value={chamberForm.telephone} onChange={(e) => setChamberForm((p) => ({ ...p, telephone: e.target.value }))} />
                </div>
                <div className="flex items-end gap-2">
                  <Button type="submit" disabled={savingChamber} className="flex-1">
                    {savingChamber ? <LoadingSpinner size="sm" /> : <><Plus className="h-4 w-4 mr-1" />{editingChamber ? t('admin.chambers.btn_update') : t('admin.chambers.btn_add')}</>}
                  </Button>
                  {editingChamber && (
                    <Button type="button" variant="outline" onClick={() => { setEditingChamber(null); setChamberForm({ nom: '', pays: '', ville: '', email: '', telephone: '' }) }}>
                      {t('admin.chambers.btn_cancel')}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* List */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('admin.chambers.search_placeholder')} className="pl-9" value={chamberSearch} onChange={(e) => setChamberSearch(e.target.value)} />
          </div>
          <Card>
            <CardContent className="p-0">
              {chambersLoading ? <LoadingTableFull /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.chambers.col_name')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.chambers.col_country')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.chambers.col_city')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.chambers.col_email')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.chambers.col_agents')}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.chambers.col_actions')}</th>
                    </tr></thead>
                    <tbody>
                      {filteredChambers.map((ch) => (
                        <tr key={ch.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">{ch.nom}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{ch.pays}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{ch.ville}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{ch.email ?? '—'}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{ch.agent_count}</td>
                          <td className="px-4 py-3 flex items-center gap-2">
                            <button className="text-cemac-700 hover:text-cemac-900 p-1" onClick={() => { setEditingChamber(ch); setChamberForm({ nom: ch.nom, pays: ch.pays, ville: ch.ville, email: ch.email ?? '', telephone: ch.telephone ?? '' }) }}>
                              <PencilLine className="h-4 w-4" />
                            </button>
                            <button className="text-red-500 hover:text-red-700 p-1" onClick={() => deleteChamber(ch.id)}>
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredChambers.length === 0 && <p className="text-center py-10 text-sm text-muted-foreground">{t('admin.chambers.no_results')}</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── LOGISTICS TAB ─────────────────────────────────────────────── */}
      {activeTab === 'logistics' && (
        <div className="space-y-6">
          {logisticsLoading && <PageLoader />}

          {!logisticsLoading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ── Corridors ─────────────────────────────────────────── */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-cemac-700" /> {t('admin.logistics.corridors_title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-0 divide-y">
                    {corridors.map((co) => (
                      <div key={co.id} className="flex items-center justify-between py-2.5">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{co.route}</p>
                          <p className="text-xs text-muted-foreground">{co.mode} · {co.days}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            className={cn('h-7 px-2 rounded text-xs border focus:outline-none focus:ring-1 focus:ring-cemac-600',
                              co.status === 'Opérationnel' ? 'bg-green-50 text-green-700 border-green-200' :
                              co.status === 'Ralenti'      ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                            'bg-red-50 text-red-700 border-red-200')}
                            value={co.status}
                            onChange={(e) => updateCorridorStatus(co.id, e.target.value as Corridor['status'])}
                            disabled={updatingCorridor === co.id}
                          >
                            {(['Opérationnel','Ralenti','Bloqué','En maintenance'] as Corridor['status'][]).map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <button className="text-red-500 hover:text-red-700 p-1" onClick={() => deleteCorridor(co.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {corridors.length === 0 && <p className="py-4 text-sm text-center text-muted-foreground">{t('admin.logistics.no_corridors')}</p>}
                  </CardContent>
                </Card>
                {/* Add corridor form */}
                <Card>
                  <CardHeader><CardTitle className="text-sm">{t('admin.logistics.add_corridor')}</CardTitle></CardHeader>
                  <CardContent>
                    <form onSubmit={saveCorridor} className="space-y-2">
                      <Input required placeholder={t('admin.logistics.route_placeholder')} value={corridorForm.route} onChange={(e) => setCorridorForm((p) => ({ ...p, route: e.target.value }))} />
                      <div className="grid grid-cols-2 gap-2">
                        <select required className="h-9 px-3 rounded-md border border-input bg-white text-sm focus:outline-none focus:ring-1 focus:ring-cemac-600"
                          value={corridorForm.mode} onChange={(e) => setCorridorForm((p) => ({ ...p, mode: e.target.value as Corridor['mode'] }))}>
                          {(['Route','Maritime','Aérien','Ferroviaire','Mixte'] as Corridor['mode'][]).map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <Input required placeholder={t('admin.logistics.duration_placeholder')} value={corridorForm.days} onChange={(e) => setCorridorForm((p) => ({ ...p, days: e.target.value }))} />
                      </div>
                      <Button type="submit" disabled={savingCorridor} className="w-full text-sm" size="sm">
                        {savingCorridor ? <LoadingSpinner size="sm" /> : <><Plus className="h-3.5 w-3.5 mr-1" />{t('admin.logistics.btn_add_corridor')}</>}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* ── Alertes douanières ─────────────────────────────────── */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" /> {t('admin.logistics.alerts_title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {alerts.map((al) => (
                      <div key={al.id} className={cn('p-3 rounded-lg border text-sm flex items-start justify-between gap-3',
                        !al.is_active ? 'opacity-50 bg-gray-50 border-gray-200' :
                        al.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                        al.type === 'danger'  ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200')}>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs">{al.country}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{al.message}</p>
                          <span className={cn('text-xs px-1.5 py-0.5 rounded-full mt-1 inline-block',
                            al.type === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                            al.type === 'danger'  ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700')}>
                            {al.type}
                          </span>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => toggleAlert(al.id, al.is_active)} disabled={updatingAlert === al.id} title={al.is_active ? 'Désactiver' : 'Activer'}>
                            {updatingAlert === al.id ? <LoadingSpinner size="sm" /> : al.is_active ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                          </button>
                          <button className="text-red-500 hover:text-red-700 p-1" onClick={() => deleteAlert(al.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {alerts.length === 0 && <p className="py-4 text-sm text-center text-muted-foreground">{t('admin.logistics.no_alerts')}</p>}
                  </CardContent>
                </Card>
                {/* Add alert form */}
                <Card>
                  <CardHeader><CardTitle className="text-sm">{t('admin.logistics.add_alert')}</CardTitle></CardHeader>
                  <CardContent>
                    <form onSubmit={saveAlert} className="space-y-2">
                      <Input required placeholder="🇨🇲 Cameroun" value={alertForm.country} onChange={(e) => setAlertForm((p) => ({ ...p, country: e.target.value }))} />
                      <Input required placeholder={t('admin.logistics.alert_message_placeholder')} value={alertForm.message} onChange={(e) => setAlertForm((p) => ({ ...p, message: e.target.value }))} />
                      <select className="w-full h-9 px-3 rounded-md border border-input bg-white text-sm focus:outline-none focus:ring-1 focus:ring-cemac-600"
                        value={alertForm.type} onChange={(e) => setAlertForm((p) => ({ ...p, type: e.target.value as LogisticsAlert['type'] }))}>
                        <option value="info">Info</option>
                        <option value="warning">Avertissement</option>
                        <option value="danger">Danger</option>
                      </select>
                      <Button type="submit" disabled={savingAlert} className="w-full text-sm" size="sm">
                        {savingAlert ? <LoadingSpinner size="sm" /> : <><Plus className="h-3.5 w-3.5 mr-1" />{t('admin.logistics.btn_add_alert')}</>}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── CMS TAB ───────────────────────────────────────────────────── */}
      {activeTab === 'cms' && <CmsAdminPanel />}

      {/* ─── API CONFIG STATUS TAB (metadata only, never secrets) ──────── */}
      {activeTab === 'api_config' && <ApiConfigStatusPanel />}

      {/* Ancien éditeur désactivé : api_configs peut contenir des secrets. */}
      {legacyApiEditorEnabled && activeTab === 'api_config' && (
        <div className="space-y-4">
          {apiConfigsLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-cemac-200 border-t-cemac-700" />
            </div>
          ) : (
            <div className="space-y-4">
              {API_SERVICES.map((svc) => {
                const db = apiConfigs.find((c) => c.key === svc.key)
                const currentDraft = apiConfigsDraft[svc.key] ?? {}
                const origConfig = db?.config ?? {}
                const isDirty = JSON.stringify(currentDraft) !== JSON.stringify(origConfig)
                const isSaving = savingApiConfig === svc.key
                const isExpanded = apiConfigsExpanded[svc.key] ?? false
                const isActive = db?.is_active ?? false
                const isVisible = apiConfigsVisible[svc.key] ?? false

                return (
                  <Card key={svc.key} className={cn('transition-shadow', isActive ? 'border-cemac-200' : 'border-gray-200 opacity-70')}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{svc.emoji}</span>
                          <div>
                            <CardTitle className="text-sm font-semibold">{svc.name}</CardTitle>
                            <CardDescription className="text-xs">{svc.description}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              toast.error('La configuration des secrets se fait uniquement côté serveur.')
                            }}
                            className={cn('flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition-colors',
                              isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}
                          >
                            {isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                            {isActive ? 'Actif' : 'Inactif'}
                          </button>
                          <button
                            onClick={() => setApiConfigsExpanded((p) => ({ ...p, [svc.key]: !isExpanded }))}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="space-y-3 pt-0">
                        {svc.fields.map((field) => {
                          const value = currentDraft[field.key] ?? ''
                          if (field.type === 'select') {
                            return (
                              <div key={field.key} className="space-y-1">
                                <label className="text-xs font-medium text-gray-700">{field.label}</label>
                                <select
                                  className="w-full h-9 px-3 rounded-md border border-input bg-white text-sm focus:outline-none focus:ring-1 focus:ring-cemac-600"
                                  value={value}
                                  onChange={(e) => setApiConfigsDraft((p) => ({ ...p, [svc.key]: { ...p[svc.key], [field.key]: e.target.value } }))}
                                >
                                  {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                                </select>
                              </div>
                            )
                          }
                          if (field.type === 'textarea') {
                            return (
                              <div key={field.key} className="space-y-1">
                                <label className="text-xs font-medium text-gray-700">{field.label}</label>
                                <textarea
                                  rows={3}
                                  className="w-full px-3 py-2 rounded-md border border-input bg-white text-sm focus:outline-none focus:ring-1 focus:ring-cemac-600 resize-none"
                                  placeholder={field.placeholder}
                                  value={value}
                                  onChange={(e) => setApiConfigsDraft((p) => ({ ...p, [svc.key]: { ...p[svc.key], [field.key]: e.target.value } }))}
                                />
                              </div>
                            )
                          }
                          return (
                            <div key={field.key} className="space-y-1">
                              <label className="text-xs font-medium text-gray-700">{field.label}</label>
                              <div className="relative">
                                <Input
                                  type={field.sensitive && !isVisible ? 'password' : 'text'}
                                  placeholder={field.placeholder}
                                  value={value}
                                  onChange={(e) => setApiConfigsDraft((p) => ({ ...p, [svc.key]: { ...p[svc.key], [field.key]: e.target.value } }))}
                                  className={cn('pr-8 text-sm font-mono', field.sensitive ? 'tracking-wider' : '')}
                                />
                                {field.sensitive && (
                                  <button
                                    type="button"
                                    onClick={() => setApiConfigsVisible((p) => ({ ...p, [svc.key]: !isVisible }))}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                                  >
                                    {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })}

                        <div className="flex gap-2 pt-2">
                          <Button size="sm" className="flex-1 text-xs" disabled={isSaving || !isDirty}
                            onClick={async () => {
                              setSavingApiConfig(svc.key)
                              toast.error('La configuration des secrets se fait uniquement côté serveur.')
                              setSavingApiConfig(null)
                            }}>
                            {isSaving ? <LoadingSpinner size="sm" /> : <><Save className="h-3.5 w-3.5 mr-1" />Enregistrer</>}
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs" disabled={isSaving || !isDirty}
                            onClick={() => {
                              setApiConfigsDraft((prev) => ({ ...prev, [svc.key]: { ...origConfig } }))
                              toast(t('admin.api_config.reset'))
                            }}>
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {isDirty && (
                          <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />Modifications non enregistrées
                          </p>
                        )}
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── BILLING TAB ───────────────────────────────────────────────── */}
      {activeTab === 'billing' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: t('admin.billing.total_revenue'), value: invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount_ttc, 0).toLocaleString('fr-FR') + ' XAF', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
              { label: t('admin.billing.pending_total'), value: invoices.filter((i) => i.status === 'pending').reduce((s, i) => s + i.amount_ttc, 0).toLocaleString('fr-FR') + ' XAF', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { label: t('admin.billing.invoice_count', { count: invoices.length }), value: String(invoices.length), icon: Receipt, color: 'text-cemac-700', bg: 'bg-cemac-50' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <Card key={label}>
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className={`p-3 rounded-xl ${bg}`}><Icon className={`h-5 w-5 ${color}`} /></div>
                  <div><p className="text-lg font-bold text-gray-900">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t('admin.billing.search_placeholder')} className="pl-9" value={invoiceSearch} onChange={(e) => setInvoiceSearch(e.target.value)} />
            </div>
            <select className="h-9 px-3 rounded-md border border-input bg-white text-sm focus:outline-none focus:ring-1 focus:ring-cemac-600"
              value={invoiceStatusFilter} onChange={(e) => setInvoiceStatusFilter(e.target.value)}>
              <option value="all">{t('admin.billing.all_statuses')}</option>
              <option value="pending">{t('admin.billing.status_pending')}</option>
              <option value="paid">{t('admin.billing.status_paid')}</option>
              <option value="cancelled">{t('admin.billing.status_cancelled')}</option>
            </select>
            <Button size="sm" onClick={() => setShowCreateInvoice((v) => !v)} className="whitespace-nowrap">
              <Plus className="h-4 w-4 mr-1" />{t('admin.billing.create')}
            </Button>
          </div>

          {showCreateInvoice && (
            <Card className="border-cemac-200 bg-cemac-50/30">
              <CardHeader><CardTitle className="text-base">{t('admin.billing.form_title')}</CardTitle></CardHeader>
              <CardContent>
                <form className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                  onSubmit={async (e) => {
                    e.preventDefault()
                    setCreatingInvoice(true)
                    try {
                      const { data: profileData } = await supabase.from('profiles').select('id, country').eq('email', invoiceForm.user_email).single()
                      if (!profileData) { toast.error('Utilisateur introuvable'); setCreatingInvoice(false); return }
                      const country = invoiceForm.country || (profileData.country ?? 'CM')
                      const tax = billingTaxRates.find((item) => item.country_code === country)
                      if (!tax) { toast.error(`Aucun taux de taxe actif pour ${country}`); setCreatingInvoice(false); return }
                      const plan = billingPlans.find((item) => item.id === invoiceForm.plan_name)
                      if (!plan) { toast.error('Plan tarifaire CMS introuvable'); setCreatingInvoice(false); return }
                      const taxRate = tax.rate
                      const amountHt = invoiceForm.billing_period === 'yearly' ? plan.yearly_price : plan.monthly_price
                      if (amountHt === null) { toast.error('Ce plan ne définit pas de prix pour cette période'); setCreatingInvoice(false); return }
                      const taxAmount = Math.round((amountHt * taxRate) / 100)
                      const amountTtc = amountHt + taxAmount
                      const now = new Date()
                      const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
                      const { count } = await supabase.from('invoices').select('id', { count: 'exact', head: true }).like('invoice_number', `INV-${ym}-%`)
                      const seq = String((count ?? 0) + 1).padStart(4, '0')
                      const invoiceNumber = `INV-${ym}-${seq}`
                      const { error } = await supabase.from('invoices').insert([{
                        invoice_number: invoiceNumber, user_id: profileData.id, plan_name: invoiceForm.plan_name,
                        amount_ht: amountHt, tax_rate: taxRate, tax_amount: taxAmount, amount_ttc: amountTtc,
                        currency: 'XAF', country, payment_method: invoiceForm.payment_method,
                        payment_ref: invoiceForm.payment_ref || null,
                        billing_period: invoiceForm.billing_period as 'monthly' | 'yearly',
                        notes: invoiceForm.notes || null, status: 'pending',
                      }])
                      if (error) { toast.error(t('admin.billing.toast_create_error')); setCreatingInvoice(false); return }
                      try {
                        await supabase.functions.invoke('send-email', { body: {
                          to: invoiceForm.user_email,
                          subject: `Facture ${invoiceNumber} — CEMAC INTEGRA`,
                          html: `<p>Bonjour,</p><p>Votre facture <strong>${invoiceNumber}</strong> pour le plan <strong>${invoiceForm.plan_name.toUpperCase()}</strong> a \u00e9t\u00e9 cr\u00e9\u00e9e.</p><p>Montant HT\u00a0: ${amountHt.toLocaleString('fr-FR')} XAF<br>TVA ${taxRate}%\u00a0: ${taxAmount.toLocaleString('fr-FR')} XAF<br><strong>Total TTC\u00a0: ${amountTtc.toLocaleString('fr-FR')} XAF</strong></p>`,
                        }})
                      } catch (_) { /* non-blocking */ }
                      toast.success(t('admin.billing.toast_created'))
                      setShowCreateInvoice(false)
                      setInvoiceForm({ user_email: '', plan_name: 'sme', payment_method: 'bank_transfer', payment_ref: '', billing_period: 'monthly', country: 'CM', notes: '' })
                      setInvoices([]); setInvoicesLoading(true)
                      Promise.all([
                        supabase.from('invoices').select('*').order('issued_at', { ascending: false }).limit(300),
                        supabase.from('profiles').select('id, email, full_name'),
                      ]).then(([invoiceResult, profileResult]) => {
                        const profilesById = new Map((profileResult.data ?? []).map((item) => [item.id, item]))
                        setInvoices((invoiceResult.data ?? []).map((invoice) => ({
                          ...invoice,
                          profile: profilesById.get(invoice.user_id),
                        })))
                        setInvoicesLoading(false)
                      })
                    } catch (_) { toast.error(t('admin.billing.toast_create_error')) }
                    setCreatingInvoice(false)
                  }}
                >
                  <div className="space-y-1"><label className="text-xs font-medium">{t('admin.billing.form_client')}</label><Input placeholder="email@..." value={invoiceForm.user_email} onChange={(e) => setInvoiceForm((p) => ({ ...p, user_email: e.target.value }))} required /></div>
                  <div className="space-y-1"><label className="text-xs font-medium">{t('admin.billing.form_plan')}</label>
                    <select className="w-full h-9 px-3 rounded-md border border-input bg-white text-sm" value={invoiceForm.plan_name} onChange={(e) => setInvoiceForm((p) => ({ ...p, plan_name: e.target.value }))}>
                      {billingPlans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.id} ({(invoiceForm.billing_period === 'yearly' ? plan.yearly_price : plan.monthly_price)?.toLocaleString('fr-FR') ?? '—'} {plan.currency} HT)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1"><label className="text-xs font-medium">{t('admin.billing.form_method')}</label>
                    <select className="w-full h-9 px-3 rounded-md border border-input bg-white text-sm" value={invoiceForm.payment_method} onChange={(e) => setInvoiceForm((p) => ({ ...p, payment_method: e.target.value }))}>
                      <option value="bank_transfer">Virement bancaire</option><option value="mtn_momo">MTN MoMo</option><option value="orange_money">Orange Money</option>
                    </select>
                  </div>
                  <div className="space-y-1"><label className="text-xs font-medium">{t('admin.billing.form_country')}</label>
                    <select className="w-full h-9 px-3 rounded-md border border-input bg-white text-sm" value={invoiceForm.country} onChange={(e) => setInvoiceForm((p) => ({ ...p, country: e.target.value }))}>
                      {billingTaxRates.map((tax) => <option key={tax.country_code} value={tax.country_code}>{tax.country_code} ({tax.rate}%)</option>)}
                    </select>
                  </div>
                  <div className="space-y-1"><label className="text-xs font-medium">{t('admin.billing.form_ref')}</label><Input placeholder="REF-..." value={invoiceForm.payment_ref} onChange={(e) => setInvoiceForm((p) => ({ ...p, payment_ref: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="text-xs font-medium">{t('admin.billing.form_period')}</label>
                    <select className="w-full h-9 px-3 rounded-md border border-input bg-white text-sm" value={invoiceForm.billing_period} onChange={(e) => setInvoiceForm((p) => ({ ...p, billing_period: e.target.value }))}>
                      <option value="monthly">Mensuel</option><option value="yearly">Annuel</option>
                    </select>
                  </div>
                  <div className="space-y-1 sm:col-span-2"><label className="text-xs font-medium">{t('admin.billing.form_notes')}</label><Input placeholder="Notes..." value={invoiceForm.notes} onChange={(e) => setInvoiceForm((p) => ({ ...p, notes: e.target.value }))} /></div>
                  <div className="flex gap-2 sm:col-span-2">
                    <Button type="submit" size="sm" disabled={creatingInvoice}>{creatingInvoice ? <LoadingSpinner size="sm" /> : t('admin.billing.form_create')}</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowCreateInvoice(false)}>{t('admin.billing.form_cancel')}</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              {invoicesLoading ? <LoadingTableFull /> : (() => {
                const q = invoiceSearch.toLowerCase()
                const filtered = invoices.filter((i) => {
                  const matchQ = i.invoice_number.toLowerCase().includes(q) || i.plan_name.toLowerCase().includes(q)
                    || (i.profile?.email ?? '').toLowerCase().includes(q) || (i.profile?.full_name ?? '').toLowerCase().includes(q)
                  return matchQ && (invoiceStatusFilter === 'all' || i.status === invoiceStatusFilter)
                })
                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b bg-gray-50">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.billing.col_number')}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.billing.col_client')}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.billing.col_plan')}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.billing.col_amount')}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.billing.col_tax')}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.billing.col_country')}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.billing.col_status')}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.billing.col_date')}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.billing.col_actions')}</th>
                      </tr></thead>
                      <tbody>
                        {filtered.map((inv) => (
                          <tr key={inv.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs font-semibold text-cemac-700">{inv.invoice_number}</td>
                            <td className="px-4 py-3"><p className="text-sm font-medium text-gray-900">{inv.profile?.full_name ?? '—'}</p><p className="text-xs text-muted-foreground">{inv.profile?.email ?? '—'}</p></td>
                            <td className="px-4 py-3 text-sm capitalize">{inv.plan_name}</td>
                            <td className="px-4 py-3 text-sm font-semibold">{inv.amount_ttc.toLocaleString('fr-FR')} XAF</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{inv.tax_rate}%</td>
                            <td className="px-4 py-3 text-xs">{inv.country}</td>
                            <td className="px-4 py-3">
                              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium',
                                inv.status === 'paid' ? 'bg-green-100 text-green-800' : inv.status === 'cancelled' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-800')}>
                                {t(`admin.billing.status_${inv.status}`)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(inv.issued_at)}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                {inv.status === 'pending' && (
                                  <>
                                    <Button size="sm" variant="outline" className="h-6 text-xs px-2 text-green-700 border-green-300 hover:bg-green-50" disabled={updatingInvoice === inv.id}
                                      onClick={async () => {
                                        setUpdatingInvoice(inv.id)
                                        const { error } = await supabase.from('invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', inv.id)
                                        if (error) toast.error(t('admin.billing.toast_paid_error'))
                                        else { setInvoices((prev) => prev.map((i) => i.id === inv.id ? { ...i, status: 'paid' as const, paid_at: new Date().toISOString() } : i)); toast.success(t('admin.billing.toast_paid')) }
                                        setUpdatingInvoice(null)
                                      }}>
                                      {updatingInvoice === inv.id ? <LoadingSpinner size="sm" /> : t('admin.billing.mark_paid')}
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-6 text-xs px-2 text-red-700 border-red-300 hover:bg-red-50" disabled={updatingInvoice === inv.id}
                                      onClick={async () => {
                                        setUpdatingInvoice(inv.id)
                                        const { error } = await supabase.from('invoices').update({ status: 'cancelled' }).eq('id', inv.id)
                                        if (error) toast.error(t('admin.billing.toast_paid_error'))
                                        else { setInvoices((prev) => prev.map((i) => i.id === inv.id ? { ...i, status: 'cancelled' as const } : i)); toast.success(t('admin.billing.toast_cancelled')) }
                                        setUpdatingInvoice(null)
                                      }}>
                                      {t('admin.billing.mark_cancelled')}
                                    </Button>
                                  </>
                                )}
                                {inv.status === 'paid' && <span className="text-xs text-green-600 font-medium">✓ Payée</span>}
                                {inv.status === 'cancelled' && <span className="text-xs text-gray-400">Annulée</span>}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filtered.length === 0 && <p className="text-center py-10 text-sm text-muted-foreground">{t('admin.billing.no_results')}</p>}
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── CONTACT REQUESTS TAB ──────────────────────────────────────── */}
      {activeTab === 'contact_requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('admin.contacts.title')}</h2>
            <span className="text-xs text-muted-foreground">{t('admin.contacts.count', { count: contacts.length })}</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('admin.contacts.search_placeholder')} className="pl-9" value={contactSearch} onChange={(e) => setContactSearch(e.target.value)} />
          </div>
          <Card>
            <CardContent className="p-0">
              {contactsLoading ? <LoadingTableFull /> : (() => {
                const q = contactSearch.toLowerCase()
                const filtered = contacts.filter((c) =>
                  c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.reason ?? '').toLowerCase().includes(q) || (c.company ?? '').toLowerCase().includes(q)
                )
                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b bg-gray-50">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.contacts.col_name')}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.contacts.col_email')}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.contacts.col_company')}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.contacts.col_country')}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.contacts.col_reason')}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.contacts.col_message')}</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('admin.contacts.col_date')}</th>
                      </tr></thead>
                      <tbody>
                        {filtered.map((c) => (
                          <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-900">{c.full_name}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{c.email}</td>
                            <td className="px-4 py-3 text-sm">{c.company ?? '—'}</td>
                            <td className="px-4 py-3 text-xs">{c.country ?? '—'}</td>
                            <td className="px-4 py-3"><span className="px-2 py-0.5 bg-cemac-50 text-cemac-700 text-xs rounded-full">{c.reason ?? '—'}</span></td>
                            <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate" title={c.message}>{c.message}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(c.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filtered.length === 0 && <p className="text-center py-10 text-sm text-muted-foreground">{t('admin.contacts.no_results')}</p>}
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// ─── API SERVICE DEFINITIONS ─────────────────────────────────────────────────

interface ApiField {
  key: string; label: string; sensitive?: boolean
  type?: 'text' | 'select' | 'textarea'; options?: string[]; placeholder?: string
}
interface ApiServiceDef {
  key: string; name: string; category: 'payment' | 'email' | 'sms' | 'other'
  emoji: string; description: string; fields: ApiField[]
}

const API_SERVICES: ApiServiceDef[] = []
