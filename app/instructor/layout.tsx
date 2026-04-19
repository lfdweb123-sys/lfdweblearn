// app/instructor/layout.tsx
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import InstructorSidebar from '@/components/layout/InstructorSidebar'
import InstructorHeader from '@/components/layout/InstructorHeader'
import { Menu, Moon, Sun, ExternalLink, Bell } from 'lucide-react'
import { getDocument } from '@/lib/firebase/firestore'
import type { Instructor } from '@/types'
import Link from 'next/link'

function DarkModeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (saved === 'dark' || (!saved && prefersDark)) {
      document.documentElement.classList.add('dark')
      setDark(true)
    }
  }, [])

  const toggle = () => {
    if (dark) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    }
    setDark(!dark)
  }

  return (
    <button
      onClick={toggle}
      className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
    >
      {dark
        ? <Sun size={16} className="text-amber-400" />
        : <Moon size={16} className="text-slate-500" />
      }
    </button>
  )
}

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const { userProfile, loading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [instructor, setInstructor] = useState<Instructor | null>(null)

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) { router.push('/login'); return }
      if (userProfile?.role === 'student') { router.push('/dashboard') }
    }
  }, [loading, isAuthenticated, userProfile, router])

  useEffect(() => {
    const fetch = async () => {
      if (!userProfile?.id) return
      try {
        const data = await getDocument<Instructor>('instructors', userProfile.id)
        setInstructor(data)
      } catch {}
    }
    fetch()
  }, [userProfile?.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'lfdweblearn.com'
  const publicPageUrl = (instructor as any)?.domainVerified && instructor?.customDomain
    ? 'https://' + instructor.customDomain
    : instructor?.slug
    ? 'https://' + instructor.slug + '.' + rootDomain
    : '/instructor/settings'

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar desktop */}
      <div className="hidden lg:flex flex-shrink-0">
        <InstructorSidebar />
      </div>

      {/* Sidebar mobile */}
      {sidebarOpen && (
        <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
          <InstructorSidebar onClose={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Contenu */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Barre mobile */}
        <div className="flex lg:hidden items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 h-14 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              <Menu size={18} className="text-slate-600 dark:text-slate-300" />
            </button>
            <span className="font-bold text-sm">
              <span className="text-sky-600">LFD</span>
              <span className="text-orange-500"> Web Learn</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <DarkModeToggle />
            <Link
              href={publicPageUrl}
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              title="Ma page"
            >
              <ExternalLink size={15} className="text-slate-500" />
            </Link>
            <button className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
              <Bell size={15} className="text-slate-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-900 flex items-center justify-center text-sky-600 font-semibold text-sm">
              {userProfile?.displayName?.charAt(0).toUpperCase() || 'F'}
            </div>
          </div>
        </div>

        {/* Header desktop */}
        <InstructorHeader />

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}