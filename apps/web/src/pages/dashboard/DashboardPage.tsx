import { useAuthStore } from '@/stores/auth.store'
import { Navigate } from 'react-router-dom'
import { CompanyDashboard } from './components/CompanyDashboard'
import { CemacDashboard } from './components/CemacDashboard'
import { ChamberDashboard } from './components/ChamberDashboard'
import { AuditorDashboard } from './components/AuditorDashboard'
import { BuyerDashboard } from './components/BuyerDashboard'
import { LogisticsDashboard } from './components/LogisticsDashboard'

export function DashboardPage() {
  const role = useAuthStore((s) => s.role)()

  switch (role) {
    case 'super_admin':
      return <Navigate to="/admin" replace />
    case 'cemac_officer':
      return <CemacDashboard />
    case 'chamber_agent':
      return <ChamberDashboard />
    case 'company_admin':
      return <CompanyDashboard />
    case 'auditor':
      return <AuditorDashboard />
    case 'buyer':
      return <BuyerDashboard />
    case 'logistics_agent':
      return <LogisticsDashboard />
    case 'public':
    default:
      return <Navigate to="/marketplace" replace />
  }
}
