// components/layout/InstructorHeader.tsx
'use client'

import { Bell, ExternalLink } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { getDocument } from '@/lib/firebase/firestore'
import type { Instructor } from '@/types'
import Link from 'next/link'

export default function InstructorHeader() {
  const { userProfile } = useAuth()
  const [instructor, setInstructor] = useState<Instructor | null>(null)

  useEffect(() => {
    const fetchInstructor = async () => {
      if (!userProfile?.id) return
      try {
        const data = await getDocument<Instructor>('instructors', userProfile.id)
        setInstructor(data)
      } catch {}
    }
    fetchInstructor()
  }, [userProfile?.id])

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'lfdweblearn.com'
  const publicPageUrl = instructor?.slug
    ? 'https://' + instructor.slug + '.' + rootDomain
    : '/instructor/settings'

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 flex-shrink-0">
      <div>
        <h2 className="text-sm font-medium text-slate-800">
          Bonjour, {userProfile?.displayName?.split(' ')[0] || 'Formateur'} 👋
        </h2>
        <p className="text-xs text-slate-400">
          {new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Voir ma page publique */}
        <Link
          href={publicPageUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-sky-600 border border-slate-200 rounded-lg px-3 py-2 transition-all"
        >
          <ExternalLink size={14} />
          Ma page
        </Link>

        {/* Notifications */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 transition-all">
          <Bell size={16} className="text-slate-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600 font-semibold text-sm">
          {userProfile?.displayName?.charAt(0).toUpperCase() || 'F'}
        </div>
      </div>
    </header>
  )
}