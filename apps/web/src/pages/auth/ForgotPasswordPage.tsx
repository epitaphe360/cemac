import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const schema = z.object({
  email: z.string().email('Adresse e-mail invalide'),
})

type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      toast.error('Une erreur est survenue. Veuillez réessayer.')
      return
    }

    setSentEmail(data.email)
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cemac-50 via-white to-gold-50 px-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cemac-700 text-white text-2xl font-bold mb-4 shadow-lg">
            CI
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CEMAC INTEGRA</h1>
          <p className="text-sm text-gray-500 mt-1">Réinitialisation du mot de passe</p>
        </div>

        <Card className="shadow-xl border-0">
          {!sent ? (
            <>
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl text-center">Mot de passe oublié ?</CardTitle>
                <CardDescription className="text-center">
                  Entrez votre adresse e-mail. Nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Adresse e-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="vous@exemple.com"
                        className="pl-9"
                        {...register('email')}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-red-500">{errors.email.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" loading={isSubmitting}>
                    {isSubmitting ? 'Envoi en cours…' : 'Envoyer le lien de réinitialisation'}
                  </Button>
                </form>

                <div className="mt-4 text-center">
                  <Link
                    to="/auth/login"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-900 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Retour à la connexion
                  </Link>
                </div>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1">
                <div className="flex justify-center mb-2">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-xl text-center">E-mail envoyé !</CardTitle>
                <CardDescription className="text-center">
                  Un lien de réinitialisation a été envoyé à{' '}
                  <span className="font-medium text-gray-900">{sentEmail}</span>.
                  Vérifiez votre boîte de réception (et vos spams).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-center text-muted-foreground">
                  Le lien est valable 1 heure. Si vous ne recevez pas l'e-mail, vérifiez l'adresse saisie ou contactez le support.
                </p>
                <Link to="/auth/login">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="h-4 w-4" />
                    Retour à la connexion
                  </Button>
                </Link>
              </CardContent>
            </>
          )}
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2025 CEMAC INTEGRA · Zone CEMAC · ZLECAF · UA
        </p>
      </div>
    </div>
  )
}
