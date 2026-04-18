// app/api/payments/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase/admin'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('firebase-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const decoded = await adminAuth.verifyIdToken(token)
    const uid = decoded.uid

    const { searchParams } = new URL(request.url)
    const customId = searchParams.get('customId')

    if (!customId) {
      return NextResponse.json(
        { error: 'customId manquant' },
        { status: 400 }
      )
    }

    // Chercher le paiement
    const paymentSnap = await adminDb
      .collection('payments')
      .where('customId', '==', customId)
      .where('userId', '==', uid)
      .limit(1)
      .get()

    if (paymentSnap.empty) {
      return NextResponse.json(
        { error: 'Paiement introuvable' },
        { status: 404 }
      )
    }

    const payment = paymentSnap.docs[0].data()

    // Vérifier aussi l'inscription
    const enrollmentSnap = await adminDb
      .collection('enrollments')
      .where('userId', '==', uid)
      .where('courseId', '==', payment.courseId)
      .where('status', '==', 'active')
      .limit(1)
      .get()

    return NextResponse.json({
      status: payment.status,
      courseId: payment.courseId,
      hasAccess: !enrollmentSnap.empty,
      enrollmentId: enrollmentSnap.empty
        ? null
        : enrollmentSnap.docs[0].id,
    })
  } catch (error) {
    console.error('Erreur verify payment:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}