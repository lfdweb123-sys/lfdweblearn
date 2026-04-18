// contexts/AuthContext.tsx
'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { User as FirebaseUser } from 'firebase/auth'
import { onAuthStateChanged, auth, getUserProfile } from '@/lib/firebase/auth'
import type { User } from '@/types'

// ── Types ────────────────────────────────────────────────────
interface AuthContextType {
  firebaseUser: FirebaseUser | null
  userProfile: User | null
  loading: boolean
  isAuthenticated: boolean
  isInstructor: boolean
  isAdmin: boolean
  refreshProfile: () => Promise<void>
}

// ── Contexte par défaut ──────────────────────────────────────
const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  userProfile: null,
  loading: true,
  isAuthenticated: false,
  isInstructor: false,
  isAdmin: false,
  refreshProfile: async () => {},
})

// ── Hook cookie (intégré directement ici) ───────────────────
function useAuthCookie(firebaseUser: FirebaseUser | null) {
  useEffect(() => {
    if (firebaseUser) {
      // Récupérer le token JWT et le stocker dans un cookie
      firebaseUser.getIdToken().then((token) => {
        document.cookie = `firebase-token=${token}; path=/; max-age=3600; SameSite=Strict`
      })

      // Renouveler le token toutes les 55 minutes (expire à 60min)
      const interval = setInterval(async () => {
        const freshToken = await firebaseUser.getIdToken(true)
        document.cookie = `firebase-token=${freshToken}; path=/; max-age=3600; SameSite=Strict`
      }, 55 * 60 * 1000)

      return () => clearInterval(interval)
    } else {
      // Supprimer le cookie à la déconnexion
      document.cookie =
        'firebase-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict'
    }
  }, [firebaseUser])
}

// ── Provider principal ───────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Cookie automatique lié à l'état firebaseUser
  useAuthCookie(firebaseUser)

  // Rafraîchir le profil Firestore manuellement
  const refreshProfile = async () => {
    if (firebaseUser) {
      const profile = await getUserProfile(firebaseUser.uid)
      setUserProfile(profile)
    }
  }

  // Écouter les changements d'état Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user)

      if (user) {
        const profile = await getUserProfile(user.uid)
        setUserProfile(profile)
      } else {
        setUserProfile(null)
      }

      setLoading(false)
    })

    // Nettoyage à l'unmount
    return () => unsubscribe()
  }, [])

  // Valeur exposée à toute l'application
  const value: AuthContextType = {
    firebaseUser,
    userProfile,
    loading,
    isAuthenticated: !!firebaseUser,
    isInstructor:
      userProfile?.role === 'instructor' || userProfile?.role === 'admin',
    isAdmin: userProfile?.role === 'admin',
    refreshProfile,
  }

  // Écran de chargement pendant la vérification auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook d'accès au contexte ─────────────────────────────────
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur de AuthProvider')
  }
  return context
}