import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import * as Sentry from '@sentry/react'
import { AlertOctagon, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } })
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <AlertOctagon className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Oups, une erreur est survenue.</h1>
              <p className="text-gray-500 text-sm">
                L'application a rencontré un problème inattendu. Si la télémétrie est active, l'erreur a été transmise à l'équipe technique.
              </p>
            </div>

            <div className="text-left bg-gray-50 p-4 rounded-lg overflow-auto max-h-32 text-xs text-red-800 border border-red-100 font-mono">
              {this.state.error?.message || 'Erreur inconnue'}
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button onClick={() => window.location.reload()} className="w-full flex justify-center items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Actualiser la page
              </Button>
              
              <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full flex justify-center items-center gap-2">
                <Home className="w-4 h-4" />
                Retour à l'accueil
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
