import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-brand-dark overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar for mobile/tablet */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 lg:hidden">
          <button
            onClick={() => setSidebarCollapsed(s => !s)}
            className="text-brand-offwhite/60 hover:text-brand-offwhite p-1"
          >
            ☰
          </button>
          <span className="text-brand-offwhite font-semibold text-sm tracking-widest">UNIFY</span>
        </div>
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
