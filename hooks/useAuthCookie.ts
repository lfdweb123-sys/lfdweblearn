// hooks/useAuthCookie.ts
'use client'

import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'

export function useAuthCookie() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Obtenir le token JWT Firebase
        const token = await user.getIdToken()
        // Stocker dans un cookie (accessible par le middleware)
        document.cookie = `firebase-token=${token}; path=/; max-age=3600; SameSite=Strict`
      } else {
        // Supprimer le cookie à la déconnexion
        document.cookie =
          'firebase-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      }
    })

    return () => unsubscribe()
  }, [])
}