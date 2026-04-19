// lib/firebase/auth.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth'
import { auth, db } from './config'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import type { User } from '@/types'

// ── Inscription ──────────────────────────────────────────────
export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<FirebaseUser> {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  const user = credential.user

  await updateProfile(user, { displayName })

  await setDoc(doc(db, 'users', user.uid), {
    email: user.email,
    displayName,
    role: 'student',
    photoURL: null,
    disabled: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return user
}

// ── Connexion email ──────────────────────────────────────────
export async function loginWithEmail(
  email: string,
  password: string
): Promise<FirebaseUser> {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  const user = credential.user

  // Verifier si le compte est desactive avant de continuer
  const userSnap = await getDoc(doc(db, 'users', user.uid))
  if (userSnap.exists() && userSnap.data()?.disabled === true) {
    await signOut(auth)
    throw new Error('ACCOUNT_DISABLED')
  }

  return user
}

// ── Google ───────────────────────────────────────────────────
export async function loginWithGoogle(): Promise<FirebaseUser> {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })

  try {
    const credential = await signInWithPopup(auth, provider)
    const user = credential.user

    const userRef = doc(db, 'users', user.uid)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName,
        role: 'student',
        photoURL: user.photoURL,
        disabled: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } else if (userSnap.data()?.disabled === true) {
      // Compte desactive — deconnecter immediatement
      await signOut(auth)
      throw new Error('ACCOUNT_DISABLED')
    }

    return user
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string }
    if (err.message === 'ACCOUNT_DISABLED') throw error
    if (err.code === 'auth/popup-blocked') {
      throw new Error('Popup bloquee. Autorisez les popups pour ce site.')
    }
    if (err.code === 'auth/popup-closed-by-user') {
      throw new Error('Connexion annulee.')
    }
    throw error
  }
}

// ── Deconnexion ──────────────────────────────────────────────
export async function logout(): Promise<void> {
  await signOut(auth)
}

// ── Reset password ───────────────────────────────────────────
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email)
}

// ── Recuperer profil Firestore ───────────────────────────────
export async function getUserProfile(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as User
}

export { onAuthStateChanged, auth }