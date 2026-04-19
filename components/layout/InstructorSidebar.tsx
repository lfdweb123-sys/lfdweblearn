// components/layout/InstructorSidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  Settings,
  Users,
  BarChart3,
  LogOut,
  Crown,
} from 'lucide-react'
import { logout } from '@/lib/firebase/auth'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

const navItems = [
  {
    label: 'Tableau de bord',
    href: '/instructor',
    icon: LayoutDashboard,
  },
  {
    label: 'Mes formations',
    href: '/instructor/courses',
    icon: BookOpen,
  },
  {
    label: 'Nouvelle formation',
    href: '/instructor/courses/new',
    icon: PlusCircle,
  },
  {
    label: 'Élèves',
    href: '/instructor/students',
    icon: Users,
  },
  {
    label: 'Statistiques',
    href: '/instructor/stats',
    icon: BarChart3,
  },
  { label: 'Abonnement Pro',
    href: '/instructor/subscription', 
    icon: Crown },
  {
    label: 'Paramètres',
    href: '/instructor/settings',
    icon: Settings,
  },
]

export default function InstructorSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { userProfile } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col h-screen sticky top-0 overflow-y-auto">

      {/* Logo */}
      <div className="p-6 border-b border-slate-100 flex-shrink-0">
        <Link href="/instructor">
          <span className="text-xl font-bold text-sky-600">LFD</span>
          <span className="text-xl font-bold text-orange-500"> Web Learn</span>
        </Link>
        <p className="text-xs text-slate-400 mt-1">Espace formateur</p>
      </div>

      {/* Profil */}
      <div className="px-4 py-4 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-semibold text-sm">
            {userProfile?.displayName?.charAt(0).toUpperCase() || 'F'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">
              {userProfile?.displayName || 'Formateur'}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {userProfile?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            item.href === '/instructor'
              ? pathname === '/instructor'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-sky-50 text-sky-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              )}
            >
              <Icon
                size={18}
                className={isActive ? 'text-sky-600' : 'text-slate-400'}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Déconnexion */}
      <div className="p-4 border-t border-slate-100 flex-shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all w-full"
        >
          <LogOut size={18} className="text-slate-400" />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}