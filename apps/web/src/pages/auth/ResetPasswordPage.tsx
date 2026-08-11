import { LoadingSpinner, PageLoader, LoadingTableFull, LoadingCard } from "@/components/shared/LoadingSpinner";
import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle, ShieldAlert } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import toast from 'react-hot-toast'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Check if there's already a session (token processed from URL hash)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })

    // Also listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Mot de passe trop court — 8 caractères minimum')
      return
    }
    if (password !== confirm) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    setDone(true)
    toast.success('Mot de passe mis à jour avec succès !')
    setTimeout(() => navigate('/dashboard'), 2500)
  }

  // Token invalide / expiré
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cemac-50 to-white p-4">
        <div className="text-center max-w-sm">
          <LoadingSpinner className="mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Vérification du lien de réinitialisation…</p>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cemac-50 to-white p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Mot de passe mis à jour</h2>
          <p className="text-sm text-muted-foreground mt-2">Redirection vers votre tableau de bord…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cemac-50 to-white p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-cemac-700 flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg">
            CI
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau mot de passe</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choisissez un mot de passe sécurisé pour votre compte
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-cemac-50 border border-cemac-100 mb-5">
            <ShieldAlert className="h-4 w-4 text-cemac-600 shrink-0" />
            <p className="text-xs text-cemac-800">
              Ce lien est valable une seule fois. Choisissez un mot de passe d'au moins 8 caractères.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nouveau mot de passe */}
            <div>
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-9"
                  placeholder="Min. 8 caractères"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-700"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirmation */}
            <div>
              <Label htmlFor="confirm">Confirmer le mot de passe</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm"
                  type={showPwd ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="pl-9"
                  placeholder="Répétez le mot de passe"
                  required
                />
              </div>
              {confirm && password !== confirm && (
                <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
              )}
              {confirm && password === confirm && confirm.length >= 8 && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Mot de passe valide
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-cemac-700 hover:bg-cemac-800 mt-2"
              disabled={loading}
            >
              {loading ? 'Mise à jour…' : 'Modifier le mot de passe'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          <Link to="/auth/login" className="text-cemac-700 hover:underline">
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  )
}
