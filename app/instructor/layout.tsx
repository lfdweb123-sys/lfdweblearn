// app/instructor/layout.tsx
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import InstructorSidebar from '@/components/layout/InstructorSidebar'
import InstructorHeader from '@/components/layout/InstructorHeader'
import { Menu, X } from 'lucide-react'

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const { userProfile, loading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) { router.push('/login'); return }
      if (userProfile?.role === 'student') { router.push('/dashboard') }
    }
  }, [loading, isAuthenticated, userProfile, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — cachee sur mobile, visible sur desktop */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0 lg:flex lg:flex-shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <InstructorSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Bouton hamburger mobile dans le header */}
        <div className="flex items-center lg:hidden bg-white border-b border-slate-100 px-4 h-14 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 transition-all mr-3"
          >
            <Menu size={18} className="text-slate-600" />
          </button>
          <span className="font-bold text-sm">
            <span className="text-sky-600">LFD</span>
            <span className="text-orange-500"> Web Learn</span>
          </span>
        </div>

        <InstructorHeader />
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}