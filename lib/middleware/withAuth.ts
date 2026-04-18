// lib/middleware/withAuth.ts
import { adminAuth } from '@/lib/firebase/admin'
import { NextRequest } from 'next/server'

export async function verifyToken(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get('firebase-token')?.value
  if (!token) return null
  try {
    const decoded = await adminAuth.verifyIdToken(token)
    return decoded.uid
  } catch {
    return null
  }
}