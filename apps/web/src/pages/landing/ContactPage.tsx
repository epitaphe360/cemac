import { useState } from 'react'
import { Mail, Phone, MapPin, Send, MessageCircle, Clock, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { CEMAC_COUNTRIES } from '@/lib/constants'

const contactReasons = [
  'Demande de démonstration',
  'Question sur un abonnement',
  'Support technique',
  'Partenariat institutionnel',
  'Presse & médias',
  'Autre',
]

const offices = [
  { country: '🇨🇲 Cameroun', city: 'Yaoundé', address: 'Avenue de l\'Indépendance, BP 1234', phone: '+237 699 000 000', primary: true },
  { country: '🇬🇦 Gabon', city: 'Libreville', address: 'Boulevard Triomphal Omar Bongo', phone: '+241 01 60 00 00', primary: false },
  { country: '🇨🇬 Congo', city: 'Brazzaville', address: 'Avenue de la Paix, Centre Commercial', phone: '+242 06 600 0000', primary: false },
]

export function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    country: '',
    reason: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      toast.error('Veuillez remplir les champs obligatoires.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from('contact_requests').insert({
        full_name: form.name,
        email: form.email,
        company: form.company || null,
        country: form.country || null,
        reason: form.reason || null,
        message: form.message,
      })
      if (error) throw error
      setSent(true)
      toast.success('Message envoyé avec succès !')
    } catch (error) {
      console.error('Contact request failed', error)
      toast.error('Votre message n’a pas pu être envoyé. Veuillez réessayer ou nous écrire par e-mail.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pt-20">

      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-cemac-900 to-cemac-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="max-w-3xl mx-auto px-6 text-center relative">
          <div className="inline-flex w-16 h-16 bg-gold-500/20 border border-gold-500/30 rounded-2xl items-center justify-center mb-6">
            <MessageCircle size={28} className="text-gold-400" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-white mb-4">Contactez-nous</h1>
          <p className="text-cemac-200 text-lg">
            Notre équipe est disponible pour répondre à toutes vos questions.
            Nous répondons généralement sous 24 heures.
          </p>
        </div>
      </section>

      <section className="py-16 bg-transparent">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-8">

            {/* Contact info */}
            <div className="space-y-6">

              {/* Response time */}
              <div className="bg-white/92 backdrop-blur-sm rounded-3xl p-5 border border-white shadow-[0_14px_36px_rgba(10,45,39,0.08)]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-cemac-100 rounded-xl flex items-center justify-center">
                    <Clock size={18} className="text-cemac-700" />
                  </div>
                  <h3 className="font-bold text-gray-900">Délai de réponse</h3>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Support général</span>
                    <span className="font-semibold text-cemac-700">24h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Support technique</span>
                    <span className="font-semibold text-cemac-700">4h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Démo commerciale</span>
                    <span className="font-semibold text-cemac-700">48h</span>
                  </div>
                </div>
              </div>

              {/* Direct channels */}
              <div className="bg-white/92 backdrop-blur-sm rounded-3xl p-5 border border-white shadow-[0_14px_36px_rgba(10,45,39,0.08)]">
                <h3 className="font-bold text-gray-900 mb-4">Canaux directs</h3>
                <div className="space-y-3">
                  <a
                    href="mailto:contact@cemacintegra.com"
                    className="flex items-center gap-3 text-sm text-gray-600 hover:text-cemac-700 group"
                  >
                    <div className="w-9 h-9 bg-cemac-50 group-hover:bg-cemac-100 rounded-xl flex items-center justify-center transition-colors">
                      <Mail size={16} className="text-cemac-600" />
                    </div>
                    contact@cemacintegra.com
                  </a>
                  <a
                    href="tel:+237600000000"
                    className="flex items-center gap-3 text-sm text-gray-600 hover:text-cemac-700 group"
                  >
                    <div className="w-9 h-9 bg-cemac-50 group-hover:bg-cemac-100 rounded-xl flex items-center justify-center transition-colors">
                      <Phone size={16} className="text-cemac-600" />
                    </div>
                    +237 600 000 000
                  </a>
                </div>
              </div>

              {/* Offices */}
              <div className="bg-white/92 backdrop-blur-sm rounded-3xl p-5 border border-white shadow-[0_14px_36px_rgba(10,45,39,0.08)]">
                <h3 className="font-bold text-gray-900 mb-4">Nos bureaux</h3>
                <div className="space-y-4">
                  {offices.map((o) => (
                    <div key={o.city} className={`pb-4 last:pb-0 last:border-0 border-b border-gray-100`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-800">{o.country} — {o.city}</span>
                        {o.primary && (
                          <span className="px-2 py-0.5 bg-cemac-100 text-cemac-700 rounded-full text-xs font-semibold">Siège</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 flex items-start gap-1.5 mb-1">
                        <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                        {o.address}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Phone size={12} />
                        {o.phone}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact form */}
            <div className="lg:col-span-2">
              {sent ? (
                <div className="bg-white/92 backdrop-blur-sm rounded-3xl p-12 border border-white shadow-[0_18px_45px_rgba(10,45,39,0.1)] text-center h-full flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-cemac-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={40} className="text-cemac-600" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 mb-3">Message envoyé !</h2>
                  <p className="text-gray-500 mb-8 max-w-sm">
                    Merci pour votre message. Notre équipe vous répondra dans les plus brefs délais.
                  </p>
                  <button
                    onClick={() => { setSent(false); setForm({ name: '', email: '', company: '', country: '', reason: '', message: '' }) }}
                    className="px-6 py-3 border border-cemac-200 text-cemac-700 rounded-xl font-semibold hover:bg-cemac-50 transition-colors"
                  >
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="bg-white/92 backdrop-blur-sm rounded-3xl p-8 border border-white shadow-[0_18px_45px_rgba(10,45,39,0.1)]"
                >
                  <h2 className="text-xl font-black text-gray-900 mb-6">Envoyez-nous un message</h2>

                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Nom complet <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Marie Dupont"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-cemac-500 focus:ring-2 focus:ring-cemac-500/20 outline-none text-sm transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Email professionnel <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="marie@entreprise.cm"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-cemac-500 focus:ring-2 focus:ring-cemac-500/20 outline-none text-sm transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Entreprise</label>
                      <input
                        type="text"
                        value={form.company}
                        onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                        placeholder="Nom de votre entreprise"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-cemac-500 focus:ring-2 focus:ring-cemac-500/20 outline-none text-sm transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pays</label>
                      <select
                        aria-label="Pays"
                        value={form.country}
                        onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-cemac-500 focus:ring-2 focus:ring-cemac-500/20 outline-none text-sm transition-all bg-white"
                      >
                        <option value="">Sélectionner un pays</option>
                        {CEMAC_COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                        ))}
                        <option value="other">Autre</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Objet de votre demande</label>
                    <div className="flex flex-wrap gap-2">
                      {contactReasons.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, reason: r }))}
                          className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all border ${
                            form.reason === r
                              ? 'bg-cemac-700 text-white border-cemac-700'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-cemac-300 hover:text-cemac-700'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={5}
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      placeholder="Décrivez votre demande..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-cemac-500 focus:ring-2 focus:ring-cemac-500/20 outline-none text-sm transition-all resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-cemac-700 hover:bg-cemac-800 disabled:bg-gray-300 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <><Send size={18} /> Envoyer le message</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
