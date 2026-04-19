// components/layout/MainHeader.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { logout } from '@/lib/firebase/auth'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  BookOpen, Menu, X, ChevronDown,
  LogOut, Settings, LayoutDashboard
} from 'lucide-react'

const NAV_LINKS = [
  { label: 'Fonctionnalités', href: '/#features' },
  { label: 'Comment ça marche', href: '/#how' },
  { label: 'Tarifs', href: '/#pricing' },
  { label: 'FAQ', href: '/#faq' },
]

export default function MainHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { isAuthenticated, userProfile, isInstructor } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    setProfileOpen(false)
    setMenuOpen(false)
    toast.success('Déconnecté')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between">

          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 bg-sky-600 rounded-xl flex items-center justify-center shadow-sm">
              <BookOpen size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg">
              <span className="text-sky-600">LFD</span>
              <span className="text-orange-500"> Web Learn</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-slate-600 hover:text-sky-600 font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && userProfile ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl transition-all"
                >
                  <div className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center text-sky-600 font-bold text-xs">
                    {userProfile.displayName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-800 leading-none">
                      {userProfile.displayName?.split(' ')[0]}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {userProfile.role === 'instructor' ? 'Formateur'
                        : userProfile.role === 'admin' ? 'Admin'
                        : 'Élève'}
                    </p>
                  </div>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-slate-100 shadow-xl py-2 z-50">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {userProfile.displayName}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{userProfile.email}</p>
                      </div>
                      <Link
                        href="/dashboard"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-sky-50 hover:text-sky-600 transition-all"
                      >
                        <LayoutDashboard size={15} />
                        Mon tableau de bord
                      </Link>
                      {isInstructor && (
                        <Link
                          href="/instructor"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-sky-50 hover:text-sky-600 transition-all"
                        >
                          <Settings size={15} />
                          Espace formateur
                        </Link>
                      )}
                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-all"
                        >
                          <LogOut size={15} />
                          Déconnexion
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-600 hover:text-sky-600 transition-colors px-3 py-2"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-semibold bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-sm"
                >
                  Commencer gratuitement
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"
          >
            {menuOpen
              ? <X size={20} className="text-slate-600" />
              : <Menu size={20} className="text-slate-600" />
            }
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-1 shadow-lg">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-600 rounded-xl transition-all"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            {isAuthenticated && userProfile ? (
              <>
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl">
                  <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600 font-bold text-sm">
                    {userProfile.displayName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{userProfile.displayName}</p>
                    <p className="text-xs text-slate-400">
                      {userProfile.role === 'instructor' ? 'Formateur'
                        : userProfile.role === 'admin' ? 'Admin'
                        : 'Élève'}
                    </p>
                  </div>
                </div>
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                >
                  <LayoutDashboard size={16} />
                  Mon tableau de bord
                </Link>
                {isInstructor && (
                  <Link
                    href="/instructor"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-white bg-sky-600 rounded-xl hover:bg-sky-700 transition-all"
                  >
                    <Settings size={16} />
                    Espace formateur
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-red-500 border border-red-100 rounded-xl hover:bg-red-50 transition-all"
                >
                  <LogOut size={16} />
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block text-center px-4 py-3 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="block text-center px-4 py-3 text-sm font-semibold bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-all"
                >
                  Commencer gratuitement
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}