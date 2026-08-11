import { useEffect, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, Clock, CheckCircle, XCircle, QrCode, Download, Upload, Paperclip, ExternalLink, AlertTriangle, Send } from 'lucide-react'
import QRCode from 'qrcode'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { formatDate } from '@/lib/utils'
import { SUPABASE_URL } from '@/lib/constants'
import toast from 'react-hot-toast'
import type { Certification, WorkflowEvent, Document as CertDoc } from '@/types'

export function CertificationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)

  const [cert, setCert] = useState<Certification | null>(null)
  const [events, setEvents] = useState<WorkflowEvent[]>([])
  const [documents, setDocuments] = useState<CertDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [actionNotes, setActionNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [auditReportFile, setAuditReportFile] = useState<File | null>(null)
  const auditReportRef = useRef<HTMLInputElement>(null)

  // Labels UI → valeurs DB (must match CHECK constraint in documents.type_document)
  const DOC_TYPES: { label: string; value: string }[] = [
    { label: 'Facture / Invoice',      value: 'factures'           },
    { label: "Rapport d'analyse",      value: 'rapport_audit'      },
    { label: 'Photo produit',          value: 'photos_produit'     },
    { label: "Certificat de qualité",  value: 'certificat_qualite' },
    { label: 'Statuts société',        value: 'statuts'            },
    { label: 'Registre de commerce',   value: 'registre_commerce'  },
    { label: 'Bilan financier',        value: 'bilan'              },
    { label: 'Autre',                  value: 'autre'              },
  ]
  const [docType, setDocType] = useState('autre')

  useEffect(() => {
    if (!id) return
    const fetch = async () => {
      const [certRes, eventsRes, docsRes] = await Promise.all([
        supabase.from('certifications').select('*').eq('id', id!).single(),
        supabase.from('workflow_events').select('*').eq('certification_id', id!).order('created_at'),
        supabase.from('documents').select('*').eq('certification_id', id!).order('created_at'),
      ])
      if (certRes.data) {
        setCert(certRes.data)
        // Generate QR code image if approved and qr_code_data exists
        if (certRes.data.statut === 'approved' && certRes.data.qr_code_data) {
          const dataUrl = await QRCode.toDataURL(certRes.data.qr_code_data, {
            width: 200,
            margin: 2,
            color: { dark: '#1d3937', light: '#ffffff' },
          })
          setQrDataUrl(dataUrl)
        }
      }
      if (eventsRes.data) setEvents(eventsRes.data)
      if (docsRes.data) setDocuments(docsRes.data)
      setLoading(false)
    }
    fetch()
  }, [id])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !cert || !profile) return
    if (!['company_admin', 'auditor', 'chamber_agent', 'cemac_officer', 'super_admin'].includes(profile.role)) {
      toast.error('Vous ne pouvez pas ajouter de document sur ce dossier')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    if (file.size > 10 * 1024 * 1024) { toast.error('Fichier trop volumineux (max 10 Mo)'); return }

    setUploading(true)
    const path = `${cert.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

    const { error: uploadError } = await supabase.storage
      .from('certification-docs')
      .upload(path, file, { upsert: false })

    if (uploadError) {
      toast.error(`Erreur upload : ${uploadError.message}`)
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/certification-docs/${path}`

    const { data: docData, error: dbError } = await supabase.from('documents').insert({
      certification_id: cert.id,
      nom_fichier: file.name,
      type_document: docType,
      url: publicUrl,
      taille: file.size,
      mime_type: file.type,
      uploaded_by: profile.id,
    }).select().single()

    if (dbError) {
      toast.error('Fichier uploadé mais erreur DB')
    } else {
      setDocuments((prev) => [...prev, docData!])
      toast.success(`"${file.name}" ajouté avec succès !`)
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async () => {
    if (!cert || !profile) return
    const { error } = await supabase
      .from('certifications')
      .update({ statut: 'submitted', date_soumission: new Date().toISOString() })
      .eq('id', cert.id)

    if (error) { toast.error('Erreur lors de la soumission'); return }

    // Log workflow event
    await supabase.from('workflow_events').insert({
      certification_id: cert.id,
      statut_precedent: cert.statut,
      statut_nouveau: 'submitted',
      commentaire: 'Dossier soumis par l\'entreprise',
      created_by: profile.id,
    })

    toast.success('Dossier soumis avec succès !')
    setCert((prev) => prev ? { ...prev, statut: 'submitted' } : prev)
  }

  const handleAuditSubmit = async () => {
    if (!cert || !profile || !actionNotes.trim()) return
    setActionLoading(true)

    // Upload audit report file if provided
    if (auditReportFile) {
      if (auditReportFile.size > 10 * 1024 * 1024) {
        toast.error('Rapport trop volumineux (max 10 Mo)')
        setActionLoading(false)
        return
      }
      const path = `${cert.id}/${Date.now()}_${auditReportFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const { error: upErr } = await supabase.storage
        .from('certification-docs')
        .upload(path, auditReportFile, { upsert: false })
      if (upErr) {
        toast.error(`Erreur upload rapport : ${upErr.message}`)
        setActionLoading(false)
        return
      }
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/certification-docs/${path}`
      const { error: docError } = await supabase.from('documents').insert({
        certification_id: cert.id,
        nom_fichier: auditReportFile.name,
        type_document: 'rapport_audit',
        url: publicUrl,
        taille: auditReportFile.size,
        mime_type: auditReportFile.type,
        uploaded_by: profile.id,
      })
      if (docError) {
        toast.error(`Erreur lors de l'enregistrement du rapport : ${docError.message}`)
        setActionLoading(false)
        return
      }
      setAuditReportFile(null)
      if (auditReportRef.current) auditReportRef.current.value = ''
    }

    await handleWorkflowAction('commission_review', 'notes_agent')
  }

  const handleWorkflowAction = async (
    newStatus: string,
    noteField: 'notes_agent' | 'notes_commission' | null = null,
  ) => {
    if (!cert || !profile) return
    setActionLoading(true)

    const extraFields: { qr_code_data?: string; date_approbation?: string; notes_agent?: string; notes_commission?: string } = {}
    if (noteField === 'notes_agent') extraFields.notes_agent = actionNotes.trim()
    else if (noteField === 'notes_commission') extraFields.notes_commission = actionNotes.trim()
    if (newStatus === 'approved') {
      extraFields.qr_code_data = `${window.location.origin}/verify/${cert.id}`
      extraFields.date_approbation = new Date().toISOString()
    }

    const { error } = await supabase
      .from('certifications')
      .update({ statut: newStatus, updated_at: new Date().toISOString(), ...extraFields })
      .eq('id', cert.id)

    if (error) { toast.error('Erreur lors de la mise à jour'); setActionLoading(false); return }

    await supabase.from('workflow_events').insert({
      certification_id: cert.id,
      statut_precedent: cert.statut,
      statut_nouveau: newStatus,
      commentaire: actionNotes.trim() || null,
      created_by: profile.id,
    })

    setCert((prev) => prev ? { ...prev, statut: newStatus, ...extraFields } : prev)
    setEvents((prev) => [
      {
        id: crypto.randomUUID(),
        certification_id: cert.id,
        statut_precedent: cert.statut,
        statut_nouveau: newStatus,
        commentaire: actionNotes.trim() || null,
        created_by: profile.id,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ])

    const TRANSITION_LABELS: Record<string, string> = {
      under_review:      'Dossier pris en charge',
      field_validation:  'Visite terrain lancée',
      commission_review: 'Transmis à la Commission CEMAC',
      approved:          'Dossier approuvé ✓',
      rejected:          'Dossier rejeté',
      suspended:         'Certification suspendue',
    }
    toast.success(TRANSITION_LABELS[newStatus] ?? 'Statut mis à jour')

    // ── Send email notification to company ─────────────────────────────────
    try {
      const { data: companyData } = await supabase
        .from('entreprises')
        .select('email_contact, raison_sociale')
        .eq('id', cert.entreprise_id)
        .single()
      if (companyData?.email_contact) {
        await supabase.functions.invoke('send-email', {
          body: {
            type: 'certification_status',
            to: companyData.email_contact,
            data: {
              company_name: companyData.raison_sociale,
              dossier: cert.numero_dossier,
              product: cert.produit_nom,
              status: newStatus,
              status_label: TRANSITION_LABELS[newStatus] ?? newStatus,
              comment: actionNotes.trim() || null,
              verify_url: newStatus === 'approved' ? `${window.location.origin}/verify/${cert.id}` : null,
            },
          },
        })
      }
    } catch (_) {
      // Email failure is non-blocking
    }

    setActionNotes('')
    setActionLoading(false)
  }

  if (loading) return <PageLoader />
  if (!cert) return <div className="text-center py-20 text-muted-foreground">Certification introuvable</div>

  const canSubmit = cert.statut === 'draft' && profile?.role === 'company_admin'
  const canUploadDocuments = ['company_admin', 'auditor', 'chamber_agent', 'cemac_officer', 'super_admin'].includes(profile?.role ?? '')

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#183253_0%,#115e59_50%,#d4a62f_135%)] px-6 py-7 text-white shadow-[0_20px_60px_rgba(24,50,83,0.22)] sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_24%)]" />
        <div className="relative flex items-center gap-4">
        <Button variant="ghost" size="icon" className="bg-white/10 text-white hover:bg-white/15 hover:text-white" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="hero-chip mb-4 border-white/15 bg-white/10 text-white">Dossier certifiant</div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-black tracking-tight text-white">{cert.produit_nom}</h1>
            <StatusBadge status={cert.statut} />
          </div>
          <p className="mt-2 text-sm text-white/75">
            {cert.numero_dossier} · Créé le {formatDate(cert.created_at)}
          </p>
        </div>
        {canSubmit && (
          <Button className="bg-white text-cemac-900 hover:bg-white/90" onClick={handleSubmit}>
            <CheckCircle className="h-4 w-4" />
            Soumettre le dossier
          </Button>
        )}
        </div>
      </div>

      {/* Workflow stepper */}
      {(() => {
        const STEPS = [
          { key: 'draft',             label: 'Brouillon'  },
          { key: 'submitted',         label: 'Soumis'     },
          { key: 'under_review',      label: 'Révision'   },
          { key: 'field_validation',  label: 'Terrain'    },
          { key: 'commission_review', label: 'Commission' },
          { key: 'approved',          label: 'Approuvé'   },
        ]
        const isTerminal = ['rejected', 'suspended', 'expired'].includes(cert.statut)
        const currentIdx = isTerminal ? -1 : STEPS.findIndex(s => s.key === cert.statut)
        return (
          <Card className="metric-card overflow-hidden">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start">
                {STEPS.map((step, idx) => (
                  <div key={step.key} className="flex items-center flex-1 min-w-0">
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                        isTerminal
                          ? idx === 5
                            ? cert.statut === 'rejected'
                              ? 'border-red-300 bg-red-50 text-red-500'
                              : cert.statut === 'suspended'
                              ? 'border-yellow-300 bg-yellow-50 text-yellow-600'
                              : 'border-gray-200 bg-gray-50 text-gray-400'
                            : idx < 5
                            ? 'border-cemac-500 bg-cemac-500 text-white'
                            : 'border-gray-200 bg-gray-50 text-gray-400'
                          : idx < currentIdx
                          ? 'border-cemac-600 bg-cemac-600 text-white'
                          : idx === currentIdx
                          ? 'border-cemac-600 bg-white text-cemac-700 shadow-[0_0_0_3px_rgba(16,105,91,0.15)]'
                          : 'border-gray-200 bg-gray-50 text-gray-400'
                      }`}>
                        {(!isTerminal && idx < currentIdx) || (isTerminal && idx < 5) ? '✓' : idx + 1}
                      </div>
                      <p className={`text-[10px] mt-1 font-medium text-center leading-tight max-w-[52px] ${
                        !isTerminal && idx === currentIdx ? 'text-cemac-700' :
                        (!isTerminal && idx < currentIdx) || (isTerminal && idx < 5) ? 'text-gray-600' :
                        'text-gray-400'
                      }`}>{step.label}</p>
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 mb-4 ${
                        (!isTerminal && idx < currentIdx) || (isTerminal && idx < 4)
                          ? 'bg-cemac-400'
                          : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              {isTerminal && (
                <div className={`mt-3 text-center text-sm font-semibold px-4 py-2 rounded-xl border ${
                  cert.statut === 'rejected'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : cert.statut === 'suspended'
                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}>
                  {cert.statut === 'rejected' ? '✗ Dossier rejeté — Possibilité de resoumettre'
                   : cert.statut === 'suspended' ? '⚠ Certification suspendue'
                   : 'Certification expirée'}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="text-base">Informations du dossier</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Type de certification</p>
                <p className="font-medium mt-0.5 capitalize">{cert.type_certification.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Pays de production</p>
                <p className="font-medium mt-0.5">{cert.pays_production}</p>
              </div>
              {cert.valeur_ajoutee_locale && (
                <div>
                  <p className="text-muted-foreground">Valeur ajoutée locale</p>
                  <p className="font-medium mt-0.5">{cert.valeur_ajoutee_locale}%</p>
                </div>
              )}
              {cert.date_soumission && (
                <div>
                  <p className="text-muted-foreground">Date de soumission</p>
                  <p className="font-medium mt-0.5">{formatDate(cert.date_soumission)}</p>
                </div>
              )}
              {cert.date_approbation && (
                <div>
                  <p className="text-muted-foreground">Date d'approbation</p>
                  <p className="font-medium mt-0.5 text-green-700">{formatDate(cert.date_approbation)}</p>
                </div>
              )}
              {cert.date_expiration && (
                <div>
                  <p className="text-muted-foreground">Date d'expiration</p>
                  <p className="font-medium mt-0.5">{formatDate(cert.date_expiration)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {cert.produit_description && (
            <Card className="metric-card">
              <CardHeader>
                <CardTitle className="text-base">Description du produit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{cert.produit_description}</p>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          <Card className="metric-card">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documents ({documents.length})
                </CardTitle>
                {/* Upload controls */}
                {canUploadDocuments && (
                <div className="flex items-center gap-2">
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="h-8 px-2 rounded-md border border-input bg-white text-xs focus:outline-none focus:ring-1 focus:ring-cemac-600"
                  >
                    {DOC_TYPES.map(({ label, value }) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    onChange={handleUpload}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading
                      ? <><span className="animate-spin mr-1">⏳</span>Upload…</>
                      : <><Upload className="h-3 w-3 mr-1" />Joindre un fichier</>
                    }
                  </Button>
                </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div
                  className={`flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-200 rounded-lg transition-colors ${canUploadDocuments ? 'cursor-pointer hover:border-cemac-300' : ''}`}
                  onClick={() => canUploadDocuments && fileInputRef.current?.click()}
                >
                  <Paperclip className="h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-sm text-muted-foreground">Aucun document joint</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {canUploadDocuments
                      ? 'Cliquez pour ajouter un fichier (PDF, Word, Excel, image — max 10 Mo)'
                      : 'Aucun document disponible pour ce dossier'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-cemac-600 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-sm truncate block">{doc.nom_fichier}</span>
                          <span className="text-xs text-muted-foreground">{doc.type_document}</span>
                        </div>
                      </div>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonne droite */}
        <div className="space-y-4">

          {/* ── Panneau d’action du workflow (selon le rôle et le statut) ── */}
          {profile?.role === 'chamber_agent' && cert.statut === 'submitted' && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-blue-900 flex items-center gap-2">
                  <Send className="h-4 w-4" /> Prise en charge — Chambre de Commerce
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  placeholder="Notes de prise en charge (optionnel)"
                  rows={2} value={actionNotes} onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                />
                <Button className="w-full bg-blue-700 hover:bg-blue-800" disabled={actionLoading}
                  onClick={() => handleWorkflowAction('under_review', 'notes_agent')}>
                  {actionLoading ? 'En cours…' : 'Prendre en charge → Révision'}
                </Button>
              </CardContent>
            </Card>
          )}

          {profile?.role === 'auditor' && cert.statut === 'under_review' && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-orange-900 flex items-center gap-2">
                  <Send className="h-4 w-4" /> Validation terrain
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  placeholder="Observations initiales (optionnel)"
                  rows={2} value={actionNotes} onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500"
                />
                <Button className="w-full bg-orange-600 hover:bg-orange-700" disabled={actionLoading}
                  onClick={() => handleWorkflowAction('field_validation', 'notes_agent')}>
                  {actionLoading ? 'En cours…' : 'Lancer visite terrain'}
                </Button>
              </CardContent>
            </Card>
          )}

          {profile?.role === 'auditor' && cert.statut === 'field_validation' && (
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-purple-900 flex items-center gap-2">
                  <Send className="h-4 w-4" /> Rapport d’audit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  placeholder="Rapport de visite terrain et conclusions techniques…"
                  rows={4} value={actionNotes} onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500"
                />
                {/* Audit report file attachment */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-purple-900">Joindre le rapport (PDF, Word, max 10 Mo)</label>
                  <input
                    ref={auditReportRef}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => setAuditReportFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => auditReportRef.current?.click()}
                      className="flex items-center gap-1.5 text-xs bg-white border border-purple-300 rounded-md px-3 py-1.5 text-purple-800 hover:bg-purple-50 transition-colors"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      {auditReportFile ? auditReportFile.name : 'Attacher un fichier'}
                    </button>
                    {auditReportFile && (
                      <button type="button" onClick={() => { setAuditReportFile(null); if (auditReportRef.current) auditReportRef.current.value = '' }}
                        className="text-xs text-purple-600 hover:text-red-500">× Retirer</button>
                    )}
                  </div>
                </div>
                {!actionNotes.trim() && (
                  <p className="text-xs text-purple-700">Un rapport est requis pour transmettre le dossier.</p>
                )}
                <Button className="w-full bg-purple-700 hover:bg-purple-800"
                  disabled={actionLoading || !actionNotes.trim()}
                  onClick={handleAuditSubmit}>
                  {actionLoading ? 'En cours…' : 'Transmettre à la Commission CEMAC'}
                </Button>
              </CardContent>
            </Card>
          )}

          {(profile?.role === 'cemac_officer' || profile?.role === 'super_admin') && cert.statut === 'commission_review' && (
            <Card className="border-cemac-200 bg-cemac-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-cemac-900 flex items-center gap-2">
                  <Send className="h-4 w-4" /> Décision de la Commission
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  placeholder="Commentaire de la Commission (recommandé)"
                  rows={3} value={actionNotes} onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cemac-500"
                />
                <div className="flex gap-2">
                  <Button className="flex-1 bg-green-700 hover:bg-green-800" disabled={actionLoading}
                    onClick={() => handleWorkflowAction('approved', 'notes_commission')}>
                    {actionLoading ? '…' : '✓ Approuver'}
                  </Button>
                  <Button variant="outline" className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                    disabled={actionLoading}
                    onClick={() => handleWorkflowAction('rejected', 'notes_commission')}>
                    {actionLoading ? '…' : '✗ Rejeter'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {(profile?.role === 'cemac_officer' || profile?.role === 'super_admin') && cert.statut === 'approved' && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-yellow-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Suspendre la certification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  placeholder="Motif de suspension (requis)"
                  rows={2} value={actionNotes} onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-yellow-500"
                />
                <Button variant="outline" className="w-full border-yellow-400 text-yellow-800 hover:bg-yellow-100"
                  disabled={actionLoading || !actionNotes.trim()}
                  onClick={() => handleWorkflowAction('suspended', 'notes_commission')}>
                  {actionLoading ? 'En cours…' : 'Suspendre la certification'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* QR Code (si approuvé) */}
          {cert.statut === 'approved' && qrDataUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  QR Code de vérification
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-3">
                <img src={qrDataUrl} alt="QR Code certification" className="w-40 h-40 rounded-lg border" />
                <p className="text-xs text-muted-foreground text-center">
                  Scanner pour vérifier l'authenticité en ligne
                </p>
                <div className="flex gap-2">
                  <a href={qrDataUrl} download={`qr-${cert.numero_dossier}.png`}>
                    <Button variant="outline" size="sm">
                      <Download className="h-3.5 w-3.5" />
                      Télécharger
                    </Button>
                  </a>
                  {cert.qr_code_data && (
                    <a href={cert.qr_code_data} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Vérifier
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          {cert.statut === 'approved' && !qrDataUrl && !cert.qr_code_data && (
            <Card className="border-dashed">
              <CardContent className="pt-5 pb-5 text-center text-xs text-muted-foreground">
                <QrCode className="h-7 w-7 mx-auto mb-2 text-gray-300" />
                QR Code en cours de génération…
              </CardContent>
            </Card>
          )}

          {/* Historique workflow */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Historique
              </CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune activité enregistrée</p>
              ) : (
                <ol className="relative border-l border-gray-200 space-y-4 ml-2">
                  {events.map((event) => (
                    <li key={event.id} className="ml-4">
                      <div className="absolute -left-1.5 w-3 h-3 rounded-full bg-cemac-600 border-2 border-white" />
                      <div>
                        <StatusBadge status={event.statut_nouveau} />
                        {event.commentaire && (
                          <p className="text-xs text-muted-foreground mt-1">{event.commentaire}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(event.created_at)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {(cert.notes_agent || cert.notes_commission) && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-base text-yellow-800">Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {cert.notes_agent && (
                  <div>
                    <p className="font-medium text-yellow-700">Agent chambre :</p>
                    <p className="text-yellow-900 mt-0.5">{cert.notes_agent}</p>
                  </div>
                )}
                {cert.notes_commission && (
                  <div>
                    <p className="font-medium text-yellow-700">Commission CEMAC :</p>
                    <p className="text-yellow-900 mt-0.5">{cert.notes_commission}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Motif rejet */}
          {cert.statut === 'rejected' && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-700 mb-2">
                  <XCircle className="h-5 w-5" />
                  <p className="font-medium">Dossier rejeté</p>
                </div>
                <Link to="/certifications/new">
                  <Button variant="destructive" size="sm" className="w-full">
                    Soumettre un nouveau dossier
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
