// app/api/payments/initiate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase/admin'
import { generatePaymentRef } from '@/lib/feexpay'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    // Vérifier auth
    const token = request.cookies.get('firebase-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const decoded = await adminAuth.verifyIdToken(token)
    const uid = decoded.uid

    const body = await request.json()
    const { courseId } = body

    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId manquant' },
        { status: 400 }
      )
    }

    // Récupérer la formation
    const courseSnap = await adminDb
      .collection('courses')
      .doc(courseId)
      .get()

    if (!courseSnap.exists) {
      return NextResponse.json(
        { error: 'Formation introuvable' },
        { status: 404 }
      )
    }

    const course = courseSnap.data()!

    // Vérifier que l'élève n'est pas déjà inscrit
    const existingSnap = await adminDb
      .collection('enrollments')
      .where('userId', '==', uid)
      .where('courseId', '==', courseId)
      .where('status', '==', 'active')
      .limit(1)
      .get()

    if (!existingSnap.empty) {
      return NextResponse.json(
        { error: 'Vous êtes déjà inscrit à cette formation' },
        { status: 409 }
      )
    }

    // Récupérer le profil utilisateur
    const userSnap = await adminDb.collection('users').doc(uid).get()
    const user = userSnap.data()!

    // Générer référence unique
    const customId = generatePaymentRef(courseId, uid)

    // Créer le paiement en attente dans Firestore
    const paymentRef = await adminDb.collection('payments').add({
      userId: uid,
      courseId,
      instructorId: course.instructorId,
      amount: course.price,
      currency: course.currency,
      provider: 'feexpay',
      status: 'pending',
      customId,
      webhookVerified: false,
      metadata: {
        courseTitle: course.title,
        userEmail: user.email,
        userDisplayName: user.displayName,
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({
      success: true,
      paymentId: paymentRef.id,
      customId,
      amount: course.price,
      currency: course.currency,
      courseTitle: course.title,
      shopId: process.env.NEXT_PUBLIC_FEEXPAY_SHOP_ID,
      userEmail: user.email,
      userFullname: user.displayName,
    })
  } catch (error) {
    console.error('Erreur initiate payment:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}