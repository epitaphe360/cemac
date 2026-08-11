import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { PageLoader } from '@/components/shared/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: string[]
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isInitialized, role, profile } = useAuthStore()

  if (!isInitialized) return <PageLoader />
  if (!isAuthenticated()) return <Navigate to="/auth/login" replace />
  if (profile?.password_reset_required) {
    return <Navigate to="/auth/reset-password" replace />
  }
  if (requiredRoles && !requiredRoles.includes(role())) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
