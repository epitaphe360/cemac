import { LoadingSpinner, PageLoader, LoadingTableFull, LoadingCard } from "@/components/shared/LoadingSpinner";
import { useEffect, useState, useRef } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, Package, Upload, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'

import { formatCurrency } from '@/lib/utils'
import { CEMAC_COUNTRIES } from '@/lib/constants'
import toast from 'react-hot-toast'
import type { Produit } from '@/types'

const CATEGORIES = [
  'Agro-alimentaire',
  'Bois & Forêt',
  'Cosmétique & Bien-être',
  'Pêche & Aquaculture',
  'Textile & Fibre',
  'Chimie & Agroforesterie',
  'Artisanat & Art',
  'Autre',
]
const CURRENCIES = ['XAF', 'EUR', 'USD', 'XOF']

interface ProductForm {
  nom: string
  description: string
  categorie: string
  sous_categorie: string
  prix_unitaire: string
  devise: string
  unite: string
  quantite_disponible: string
  pays_origine: string
  image_url: string
  tags: string
  is_published: boolean
}

const emptyForm = (defaultPays = ''): ProductForm => ({
  nom: '',
  description: '',
  categorie: '',
  sous_categorie: '',
  prix_unitaire: '',
  devise: 'XAF',
  unite: '',
  quantite_disponible: '',
  pays_origine: defaultPays,
  image_url: '',
  tags: '',
  is_published: false,
})

export function ProductsPage() {
  const { t } = useTranslation()
  const entreprise = useAuthStore((s) => s.entreprise)
  const [products, setProducts] = useState<Produit[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Produit | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchProducts = async () => {
    if (!entreprise) return
    const { data, error } = await supabase
      .from('produits')
      .select('*')
      .eq('entreprise_id', entreprise.id)
      .order('created_at', { ascending: false })
    if (!error && data) setProducts(data)
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [entreprise?.id])

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm(entreprise?.pays ?? ''))
    setImageFile(null)
    setShowModal(true)
  }

  const openEdit = (p: Produit) => {
    setEditing(p)
    setImageFile(null)
    setForm({
      nom: p.nom,
      description: p.description ?? '',
      categorie: p.categorie ?? '',
      sous_categorie: p.sous_categorie ?? '',
      prix_unitaire: p.prix_unitaire?.toString() ?? '',
      devise: p.devise,
      unite: p.unite ?? '',
      quantite_disponible: p.quantite_disponible?.toString() ?? '',
      pays_origine: p.pays_origine,
      image_url: p.images?.[0] ?? '',
      tags: p.tags?.join(', ') ?? '',
      is_published: p.is_published,
    })
    setShowModal(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setForm((f) => ({ ...f, image_url: URL.createObjectURL(file) }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!entreprise) return
    if (!form.nom.trim()) { toast.error(t('products.toasts.name_required')); return }
    setSaving(true)

    let finalImageUrl = form.image_url
    if (imageFile && entreprise) {
      setImageUploading(true)
      const ext = imageFile.name.split('.').pop()
      const path = `${entreprise.id}/${Date.now()}.${ext}`
      const { data: upData, error: upErr } = await supabase.storage
        .from('product-images')
        .upload(path, imageFile, { upsert: true })
      setImageUploading(false)
      if (upErr) {
        toast.error(t('products.toasts.image_upload_error'))
        setSaving(false)
        return
      }
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(upData.path)
      finalImageUrl = urlData.publicUrl
    }

    const payload = {
      nom: form.nom.trim(),
      description: form.description.trim() || null,
      categorie: form.categorie || null,
      sous_categorie: form.sous_categorie.trim() || null,
      prix_unitaire: form.prix_unitaire ? parseFloat(form.prix_unitaire) : null,
      devise: form.devise,
      unite: form.unite.trim() || null,
      quantite_disponible: form.quantite_disponible ? parseInt(form.quantite_disponible) : null,
      pays_origine: form.pays_origine || entreprise.pays,
      images: finalImageUrl ? [finalImageUrl] : [],
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      is_published: form.is_published,
      updated_at: new Date().toISOString(),
    }

    if (editing) {
      const { error } = await supabase.from('produits').update(payload).eq('id', editing.id)
      if (error) { toast.error(t('products.toasts.update_error')); setSaving(false); return }
      toast.success(t('products.toasts.updated'))
    } else {
      const { error } = await supabase.from('produits').insert({ ...payload, entreprise_id: entreprise.id })
      if (error) { toast.error(t('products.toasts.create_error')); setSaving(false); return }
      toast.success(t('products.toasts.created'))
    }

    setSaving(false)
    setShowModal(false)
    setImageFile(null)
    fetchProducts()
  }

  const togglePublish = async (p: Produit) => {
    const { error } = await supabase.from('produits').update({ is_published: !p.is_published }).eq('id', p.id)
    if (error) { toast.error(t('common.error')); return }
    setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, is_published: !p.is_published } : x))
    toast.success(p.is_published ? t('products.toasts.unpublished') : t('products.toasts.published'))
  }

  const handleDelete = async (p: Produit) => {
    if (!confirm(t('products.confirm_delete', { name: p.nom }))) return
    setDeletingId(p.id)
    const { error } = await supabase.from('produits').delete().eq('id', p.id)
    if (error) { toast.error(t('products.toasts.delete_error')); setDeletingId(null); return }
    setProducts((prev) => prev.filter((x) => x.id !== p.id))
    toast.success(t('products.toasts.deleted'))
    setDeletingId(null)
  }

  const published = products.filter((p) => p.is_published).length

  if (!entreprise) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="font-medium">{t('products.no_company')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('products.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {entreprise.raison_sociale} · {t('products.subtitle')}
          </p>
        </div>
        <Button onClick={openAdd} className="bg-cemac-700 hover:bg-cemac-800">
          <Plus className="h-4 w-4" />
          {t('products.new')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t('products.stats.total'), value: products.length, color: 'text-gray-900' },
          { label: t('products.stats.published'), value: published, color: 'text-green-700' },
          { label: t('products.stats.drafts'), value: products.length - published, color: 'text-yellow-700' },
          { label: t('products.stats.company'), value: entreprise.sigle ?? entreprise.raison_sociale.slice(0, 4).toUpperCase(), color: 'text-cemac-700' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Liste produits */}
      {loading ? (
        <PageLoader />
      ) : products.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-500">{t('products.empty_title')}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t('products.empty_description')}
          </p>
          <Button onClick={openAdd} className="mt-4 bg-cemac-700 hover:bg-cemac-800">
            <Plus className="h-4 w-4" />
            {t('products.add_first')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => {
            const country = CEMAC_COUNTRIES.find((c) => c.code === p.pays_origine)
            return (
              <Card key={p.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative h-40 bg-gradient-to-br from-cemac-50 to-cemac-100 overflow-hidden">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.nom} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-10 w-10 text-cemac-200" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <Badge className={p.is_published
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                    }>
                      {p.is_published ? t('products.status.published') : t('products.status.draft')}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4 space-y-2">
                  <h3 className="font-semibold text-sm text-gray-900 line-clamp-1">{p.nom}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{p.description ?? '—'}</p>
                  {p.categorie && (
                    <Badge variant="secondary" className="text-xs">{p.categorie}</Badge>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    {p.prix_unitaire ? (
                      <div>
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(p.prix_unitaire, p.devise)}
                        </span>
                        {p.unite && (
                          <span className="text-xs text-muted-foreground ml-1">/ {p.unite}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">{t('products.price_on_request')}</span>
                    )}
                    <span className="text-base">{country?.flag}</span>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={() => openEdit(p)}
                    >
                      <Pencil className="h-3 w-3" />
                      {t('common.edit')}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      title={p.is_published ? t('products.actions.unpublish') : t('products.actions.publish')}
                      onClick={() => togglePublish(p)}
                    >
                      {p.is_published
                        ? <EyeOff className="h-3 w-3" />
                        : <Eye className="h-3 w-3 text-green-600" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(p)}
                      disabled={deletingId === p.id}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── MODAL Add / Edit ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? t('products.modal.edit_title') : t('products.modal.create_title')}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none font-light"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nom */}
                <div className="sm:col-span-2">
                  <Label htmlFor="prod-nom">{t('products.fields.name')} *</Label>
                  <Input
                    id="prod-nom"
                    value={form.nom}
                    onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                    className="mt-1"
                    required
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <Label htmlFor="prod-desc">{t('certification.fields.description')}</Label>
                  <textarea
                    id="prod-desc"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className="mt-1 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cemac-600 resize-none"
                    placeholder={t('products.fields.description_placeholder')}
                  />
                </div>

                {/* Catégorie */}
                <div>
                  <Label htmlFor="prod-cat">{t('marketplace.filters.category')}</Label>
                  <select
                    id="prod-cat"
                    value={form.categorie}
                    onChange={(e) => setForm((f) => ({ ...f, categorie: e.target.value }))}
                    className="mt-1 h-9 w-full rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-cemac-600"
                  >
                    <option value="">{t('products.select_option')}</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Sous-catégorie */}
                <div>
                  <Label htmlFor="prod-scat">{t('products.fields.subcategory')}</Label>
                  <Input
                    id="prod-scat"
                    value={form.sous_categorie}
                    onChange={(e) => setForm((f) => ({ ...f, sous_categorie: e.target.value }))}
                    className="mt-1"
                    placeholder={t('products.fields.subcategory_placeholder')}
                  />
                </div>

                {/* Prix + Devise */}
                <div>
                  <Label htmlFor="prod-prix">{t('products.fields.unit_price')}</Label>
                  <Input
                    id="prod-prix"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.prix_unitaire}
                    onChange={(e) => setForm((f) => ({ ...f, prix_unitaire: e.target.value }))}
                    className="mt-1"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="prod-devise">{t('products.fields.currency')}</Label>
                  <select
                    id="prod-devise"
                    value={form.devise}
                    onChange={(e) => setForm((f) => ({ ...f, devise: e.target.value }))}
                    className="mt-1 h-9 w-full rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-cemac-600"
                  >
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Unité + Quantité */}
                <div>
                  <Label htmlFor="prod-unite">{t('products.fields.unit')}</Label>
                  <Input
                    id="prod-unite"
                    value={form.unite}
                    onChange={(e) => setForm((f) => ({ ...f, unite: e.target.value }))}
                    className="mt-1"
                    placeholder={t('products.fields.unit_placeholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="prod-qte">{t('products.fields.available_quantity')}</Label>
                  <Input
                    id="prod-qte"
                    type="number"
                    min="0"
                    value={form.quantite_disponible}
                    onChange={(e) => setForm((f) => ({ ...f, quantite_disponible: e.target.value }))}
                    className="mt-1"
                    placeholder="0"
                  />
                </div>

                {/* Pays origine */}
                <div>
                  <Label htmlFor="prod-pays">{t('products.fields.origin_country')}</Label>
                  <select
                    id="prod-pays"
                    value={form.pays_origine}
                    onChange={(e) => setForm((f) => ({ ...f, pays_origine: e.target.value }))}
                    className="mt-1 h-9 w-full rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-cemac-600"
                  >
                    <option value="">{t('products.select_option')}</option>
                    {CEMAC_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Image upload */}
                <div>
                  <Label>{t('products.fields.main_image')}</Label>
                  <div className="mt-1 space-y-2">
                    {form.image_url && (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                        <img src={form.image_url} alt="aperçu" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => { setForm((f) => ({ ...f, image_url: '' })); setImageFile(null) }}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-9 text-sm"
                      onClick={() => fileInputRef.current?.click()}
                      loading={imageUploading}
                    >
                      <Upload className="h-4 w-4" />
                      {form.image_url ? t('products.fields.change_image') : t('products.fields.choose_image')}
                    </Button>
                  </div>
                </div>

                {/* Tags */}
                <div className="sm:col-span-2">
                  <Label htmlFor="prod-tags">{t('products.fields.tags')}</Label>
                  <Input
                    id="prod-tags"
                    value={form.tags}
                    onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                    className="mt-1"
                    placeholder={t('products.fields.tags_placeholder')}
                  />
                </div>

                {/* Publié */}
                <div className="sm:col-span-2 flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <input
                    type="checkbox"
                    id="prod-published"
                    checked={form.is_published}
                    onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
                    className="h-4 w-4 accent-cemac-700"
                  />
                  <Label htmlFor="prod-published" className="cursor-pointer font-normal">
                    {t('products.fields.publish_now')}
                  </Label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowModal(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-cemac-700 hover:bg-cemac-800"
                  disabled={saving}
                >
                  {saving ? t('products.saving') : (editing ? t('products.modal.update_action') : t('products.modal.create_action'))}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
