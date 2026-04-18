// app/api/payments/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Webhook Feexpay reçu:', body)

    const { status, reference, custom_id } = body

    if (!custom_id) {
      return NextResponse.json(
        { error: 'custom_id manquant' },
        { status: 400 }
      )
    }

    const paymentSnap = await adminDb
      .collection('payments')
      .where('customId', '==', custom_id)
      .limit(1)
      .get()

    if (paymentSnap.empty) {
      console.error('Paiement introuvable pour customId:', custom_id)
      return NextResponse.json(
        { error: 'Paiement introuvable' },
        { status: 404 }
      )
    }

    const paymentDoc = paymentSnap.docs[0]
    const payment = paymentDoc.data()

    if (payment.webhookVerified && payment.status === 'success') {
      return NextResponse.json({ message: 'Déjà traité' })
    }

    const newStatus = status === 'SUCCESS' ? 'success' : 'failed'

    await paymentDoc.ref.update({
      status: newStatus,
      feexpayRef: reference,
      webhookVerified: true,
      updatedAt: FieldValue.serverTimestamp(),
    })

    if (newStatus === 'success') {
      const courseSnap = await adminDb
        .collection('courses')
        .doc(payment.courseId)
        .get()

      const course = courseSnap.data()!

      let expiresAt = null
      if (course.accessType === 'limited' && course.accessDuration) {
        const expDate = new Date()
        expDate.setDate(expDate.getDate() + course.accessDuration)
        expiresAt = expDate
      }

      const existingEnrollment = await adminDb
        .collection('enrollments')
        .where('userId', '==', payment.userId)
        .where('courseId', '==', payment.courseId)
        .limit(1)
        .get()

      if (existingEnrollment.empty) {
        await adminDb.collection('enrollments').add({
          userId: payment.userId,
          courseId: payment.courseId,
          instructorId: payment.instructorId,
          status: 'active',
          accessType: course.accessType,
          expiresAt,
          progress: {
            completedLessons: [],
            lastLessonId: null,
            percentage: 0,
          },
          enrolledAt: FieldValue.serverTimestamp(),
        })

        await adminDb
          .collection('instructors')
          .doc(payment.instructorId)
          .update({
            totalStudents: FieldValue.increment(1),
          })

        console.log(
          `Inscription créée: user=${payment.userId} course=${payment.courseId}`
        )
      }
    }

    return NextResponse.json({ received: true, status: newStatus })
  } catch (error) {
    console.error('Erreur webhook:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}