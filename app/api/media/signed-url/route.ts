// app/api/media/signed-url/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/middleware/withAuth'
import { adminDb } from '@/lib/firebase/admin'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  const uid = await verifyToken(request)
  if (!uid) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const courseId = searchParams.get('courseId')
  const videoId = searchParams.get('videoId')

  if (!courseId || !videoId) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  try {
    // Vérifier que l'élève est inscrit et que l'accès est actif
    const enrollmentSnap = await adminDb
      .collection('enrollments')
      .where('userId', '==', uid)
      .where('courseId', '==', courseId)
      .where('status', '==', 'active')
      .limit(1)
      .get()

    // Vérifier aussi si c'est le formateur ou l'admin
    const userSnap = await adminDb.collection('users').doc(uid).get()
    const role = userSnap.data()?.role

    const courseSnap = await adminDb.collection('courses').doc(courseId).get()
    const isInstructor = courseSnap.data()?.instructorId === uid

    const hasAccess =
      !enrollmentSnap.empty || role === 'admin' || isInstructor

    if (!hasAccess) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Vérifier expiration si accès limité
    if (!enrollmentSnap.empty) {
      const enrollment = enrollmentSnap.docs[0].data()
      if (
        enrollment.accessType === 'limited' &&
        enrollment.expiresAt
      ) {
        const expiresAt = enrollment.expiresAt.toDate()
        if (new Date() > expiresAt) {
          // Mettre à jour le statut
          await adminDb
            .collection('enrollments')
            .doc(enrollmentSnap.docs[0].id)
            .update({ status: 'expired' })
          return NextResponse.json(
            { error: 'Accès expiré' },
            { status: 403 }
          )
        }
      }
    }

    // Générer token signé Bunny (expire dans 4 heures)
    const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID!
    const tokenKey = process.env.BUNNY_TOKEN_AUTH_KEY!
    const expiresTimestamp = Math.floor(Date.now() / 1000) + 4 * 3600

    const hashableBase = `${tokenKey}${videoId}${expiresTimestamp}`
    const token = crypto
      .createHash('sha256')
      .update(hashableBase)
      .digest('hex')

    const signedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${token}&expires=${expiresTimestamp}`

    return NextResponse.json({ signedUrl, expiresAt: expiresTimestamp })
  } catch (error) {
    console.error('Erreur signed URL:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}