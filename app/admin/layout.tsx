// app/admin/layout.tsx
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, BookOpen,
  CreditCard, Settings, LogOut, Shield
} from 'lucide-react'
import { logout } from '@/lib/firebase/auth'

const adminNav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Utilisateurs', icon: Users },
  { href: '/admin/courses', label: 'Formations', icon: BookOpen },
  { href: '/admin/payments', label: 'Paiements', icon: CreditCard },
  { href: '/admin/settings', label: 'Paramètres', icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userProfile, loading, isAdmin } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/dashboard')
    }
  }, [loading, isAdmin, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 flex flex-col min-h-screen sticky top-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-sky-400" />
            <span className="font-bold text-white text-sm">Admin Panel</span>
          </div>
          <p className="text-slate-500 text-xs mt-1">LFD Web Learn</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {adminNav.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Icon size={17} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-sky-900 flex items-center justify-center text-sky-400 text-sm font-bold">
              {userProfile?.displayName?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">
                {userProfile?.displayName}
              </p>
              <p className="text-slate-500 text-xs">Administrateur</p>
            </div>
          </div>
          <button
            onClick={async () => { await logout(); router.push('/login') }}
            className="flex items-center gap-2 w-full px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl text-sm transition-all"
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Contenu */}
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}