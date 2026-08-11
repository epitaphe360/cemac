import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-shell-bg flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto px-3 pb-3 sm:px-5 sm:pb-5 lg:px-6 lg:pb-6">
          <div className="mx-auto h-full max-w-[1500px]">
            <div className="app-panel min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
