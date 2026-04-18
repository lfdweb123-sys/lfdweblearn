// app/api/enrollments/free/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('firebase-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const decoded = await adminAuth.verifyIdToken(token)
    const uid = decoded.uid

    const { courseId, instructorId, accessType, accessDuration } =
      await request.json()

    // Vérifier que la formation est gratuite
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
    if (course.price !== 0) {
      return NextResponse.json(
        { error: 'Cette formation est payante' },
        { status: 400 }
      )
    }

    // Vérifier inscription existante
    const existingSnap = await adminDb
      .collection('enrollments')
      .where('userId', '==', uid)
      .where('courseId', '==', courseId)
      .limit(1)
      .get()

    if (!existingSnap.empty) {
      return NextResponse.json(
        { error: 'Déjà inscrit' },
        { status: 409 }
      )
    }

    // Calculer expiration
    let expiresAt = null
    if (accessType === 'limited' && accessDuration) {
      const expDate = new Date()
      expDate.setDate(expDate.getDate() + accessDuration)
      expiresAt = expDate
    }

    // Créer l'inscription
    const enrollmentRef = await adminDb.collection('enrollments').add({
      userId: uid,
      courseId,
      instructorId,
      status: 'active',
      accessType: accessType || 'lifetime',
      expiresAt,
      progress: {
        completedLessons: [],
        lastLessonId: null,
        percentage: 0,
      },
      enrolledAt: FieldValue.serverTimestamp(),
    })

    // Incrémenter compteur formateur
    await adminDb
      .collection('instructors')
      .doc(instructorId)
      .update({
        totalStudents: FieldValue.increment(1),
      })

    return NextResponse.json({
      success: true,
      enrollmentId: enrollmentRef.id,
    })
  } catch (error) {
    console.error('Erreur inscription gratuite:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}