// app/instructor/layout.tsx
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import InstructorSidebar from '@/components/layout/InstructorSidebar'
import InstructorHeader from '@/components/layout/InstructorHeader'

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userProfile, loading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login')
        return
      }
      if (userProfile?.role === 'student') {
        router.push('/dashboard')
      }
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
      {/* Sidebar fixe */}
      <div className="flex-shrink-0">
        <InstructorSidebar />
      </div>
      {/* Contenu scrollable */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <InstructorHeader />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}