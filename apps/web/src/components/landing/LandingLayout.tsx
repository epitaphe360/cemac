import { Outlet, useLocation } from 'react-router-dom'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { cn } from '@/lib/utils'

export function LandingLayout() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <div className={cn('flex min-h-screen flex-col', isHome ? 'bg-[#050f0a]' : 'bg-[#050f0a]')}>
      <LandingNav />
      <main id="main-content" className={cn('flex-1', !isHome && 'pt-[104px]')}>
        <Outlet />
      </main>
      <LandingFooter />
    </div>
  )
}
