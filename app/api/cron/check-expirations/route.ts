// app/api/cron/check-expirations/route.ts
// Appelé par Vercel Cron Jobs — toutes les heures
import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function GET(request: NextRequest) {
  // Vérifier secret cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const now = new Date()

    // Trouver les inscriptions expirées
    const expiredSnap = await adminDb
      .collection('enrollments')
      .where('status', '==', 'active')
      .where('accessType', '==', 'limited')
      .where('expiresAt', '<=', now)
      .get()

    if (expiredSnap.empty) {
      return NextResponse.json({ expired: 0 })
    }

    // Mettre à jour en batch
    const batch = adminDb.batch()
    expiredSnap.docs.forEach((doc) => {
      batch.update(doc.ref, {
        status: 'expired',
        updatedAt: FieldValue.serverTimestamp(),
      })
    })

    await batch.commit()

    console.log(`${expiredSnap.size} inscriptions expirées mises à jour`)

    return NextResponse.json({
      expired: expiredSnap.size,
      processedAt: now.toISOString(),
    })
  } catch (error) {
    console.error('Erreur cron expirations:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}