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
import { logout } from '@/lib/firebase/auth'
import type { User } from '@/types'

interface AuthContextType {
  firebaseUser: FirebaseUser | null
  userProfile: User | null
  loading: boolean
  isAuthenticated: boolean
  isInstructor: boolean
  isAdmin: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  userProfile: null,
  loading: true,
  isAuthenticated: false,
  isInstructor: false,
  isAdmin: false,
  refreshProfile: async () => {},
})

function useAuthCookie(firebaseUser: FirebaseUser | null) {
  useEffect(() => {
    if (firebaseUser) {
      firebaseUser.getIdToken().then((token) => {
        document.cookie = `firebase-token=${token}; path=/; max-age=3600; SameSite=Strict`
      })
      const interval = setInterval(async () => {
        const freshToken = await firebaseUser.getIdToken(true)
        document.cookie = `firebase-token=${freshToken}; path=/; max-age=3600; SameSite=Strict`
      }, 55 * 60 * 1000)
      return () => clearInterval(interval)
    } else {
      document.cookie = 'firebase-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict'
    }
  }, [firebaseUser])
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [disabled, setDisabled] = useState(false)

  useAuthCookie(firebaseUser)

  const refreshProfile = async () => {
    if (firebaseUser) {
      const profile = await getUserProfile(firebaseUser.uid)
      setUserProfile(profile)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user)
      if (user) {
        const profile = await getUserProfile(user.uid)

        // Verifier si le compte est desactive
        if ((profile as any)?.disabled === true) {
          setDisabled(true)
          setUserProfile(null)
          await logout()
          return
        }

        setDisabled(false)
        setUserProfile(profile)
      } else {
        setUserProfile(null)
        setDisabled(false)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const value: AuthContextType = {
    firebaseUser,
    userProfile,
    loading,
    isAuthenticated: !!firebaseUser && !disabled,
    isInstructor: userProfile?.role === 'instructor' || userProfile?.role === 'admin',
    isAdmin: userProfile?.role === 'admin',
    refreshProfile,
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Chargement...</p>
        </div>
      </div>
    )
  }

  // Compte desactive — afficher message et bloquer acces
  if (disabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900 px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
            Compte desactive
          </h1>
          <p className="text-slate-500 text-sm mb-6">
            Votre compte a ete desactive par un administrateur.
            Contactez le support pour plus d'informations.
          </p>
          
            href="mailto:contact@lfdweblearn.com"
            className="inline-block bg-sky-600 hover:bg-sky-700 text-white font-semibold px-6 py-3 rounded-xl transition-all text-sm"
          >
            Contacter le support
          </a>
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

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth doit etre utilise a l'interieur de AuthProvider")
  }
  return context
}