// lib/firebase/firestore.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore'
import { db } from './config'

// ── Helpers génériques ──────────────────────────────────────

export async function getDocument<T>(
  collectionName: string,
  docId: string
): Promise<T | null> {
  const ref = doc(db, collectionName, docId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as T
}

export async function setDocument(
  collectionName: string,
  docId: string,
  data: object
): Promise<void> {
  const ref = doc(db, collectionName, docId)
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true })
}

export async function updateDocument(
  collectionName: string,
  docId: string,
  data: object
): Promise<void> {
  const ref = doc(db, collectionName, docId)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

export async function deleteDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  const ref = doc(db, collectionName, docId)
  await deleteDoc(ref)
}

export async function queryDocuments<T>(
  collectionName: string,
  constraints: QueryConstraint[]
): Promise<T[]> {
  const ref = collection(db, collectionName)
  const q = query(ref, ...constraints)
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T)
}

// ── Réexports utiles ────────────────────────────────────────
export {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  db,
}