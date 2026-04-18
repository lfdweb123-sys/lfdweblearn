// app/api/payments/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Webhook Feexpay reçu:', body)

    const {
      status,
      reference,
      custom_id,
      amount,
      currency,
    } = body

    if (!custom_id) {
      return NextResponse.json(
        { error: 'custom_id manquant' },
        { status: 400 }
      )
    }

    // Retrouver le paiement via customId
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

    // Éviter le double traitement
    if (payment.webhookVerified && payment.status === 'success') {
      return NextResponse.json({ message: 'Déjà traité' })
    }

    // Mettre à jour le statut du paiement
    const newStatus = status === 'SUCCESS' ? 'success' : 'failed'

    await paymentDoc.ref.update({
      status: newStatus,
      feexpayRef: reference,
      webhookVerified: true,
      updatedAt: FieldValue.serverTimestamp(),
    })

    // Si paiement réussi → créer l'inscription
    if (newStatus === 'success') {
      // Récupérer la formation pour connaitre le type d'accès
      const courseSnap = await adminDb
        .collection('courses')
        .doc(payment.courseId)
        .get()

      const course = courseSnap.data()!

      // Calculer la date d'expiration si accès limité
      let expiresAt = null
      if (course.accessType === 'limited' && course.accessDuration) {
        const expDate = new Date()
        expDate.setDate(expDate.getDate() + course.accessDuration)
        expiresAt = expDate
      }

      // Vérifier si une inscription existe déjà (éviter doublons)
      const existingEnrollment = await adminDb
        .collection('enrollments')
        .where('userId', '==', payment.userId)
        .where('courseId', '==', payment.courseId)
        .limit(1)
        .get()

      if (existingEnrollment.empty) {
        // Créer l'inscription
        await adminDb.collection('enrollments').add({
          userId: payment.userId,
          courseId: payment.courseId,
          instructorId: payment.instructorId,
          status: 'active',
          accessType: course.accessType,
          expiresAt: expiresAt,
          progress: {
            completedLessons: [],
            lastLessonId: null,
            percentage: 0,
          },
          enrolledAt: FieldValue.serverTimestamp(),
        })

        // Incrémenter les compteurs
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

// Désactiver la vérification CSRF pour les webhooks
export const config = {
  api: { bodyParser: true },
}