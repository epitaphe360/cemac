import { Outlet } from 'react-router-dom'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'

export function LandingLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingNav />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <LandingFooter />
    </div>
  )
}
