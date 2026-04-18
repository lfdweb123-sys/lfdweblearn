// app/api/instructor/activate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase/admin'
import { slugify } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('firebase-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const decoded = await adminAuth.verifyIdToken(token)
    const uid = decoded.uid

    // Récupérer le profil utilisateur
    const userSnap = await adminDb.collection('users').doc(uid).get()
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    }

    const userData = userSnap.data()!
    const slug = slugify(userData.displayName || uid)

    // Mettre à jour le rôle
    await adminDb.collection('users').doc(uid).update({
      role: 'instructor',
      updatedAt: new Date(),
    })

    // Créer le profil formateur
    await adminDb.collection('instructors').doc(uid).set({
      slug,
      customDomain: null,
      branding: {
        primaryColor: '#0284c7',
        secondaryColor: '#f97316',
        displayName: userData.displayName,
        logo: null,
        favicon: null,
        bio: '',
        coverImage: null,
      },
      totalCourses: 0,
      totalStudents: 0,
      createdAt: new Date(),
    })

    return NextResponse.json({ success: true, slug })
  } catch (error) {
    console.error('Erreur activation formateur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}