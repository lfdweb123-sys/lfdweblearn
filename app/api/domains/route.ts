// app/api/domains/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

// GET — Vérifier si un domaine est disponible
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const domain = searchParams.get('domain')

  if (slug) {
    const snap = await adminDb
      .collection('instructors')
      .where('slug', '==', slug)
      .limit(1)
      .get()
    return NextResponse.json({ available: snap.empty })
  }

  if (domain) {
    const snap = await adminDb
      .collection('instructors')
      .where('customDomain', '==', domain)
      .limit(1)
      .get()
    return NextResponse.json({ available: snap.empty })
  }

  return NextResponse.json({ error: 'Paramètre manquant' }, { status: 400 })
}

// POST — Enregistrer un domaine personnalisé
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('firebase-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const decoded = await adminAuth.verifyIdToken(token)
    const uid = decoded.uid

    const { customDomain } = await request.json()

    if (!customDomain) {
      return NextResponse.json(
        { error: 'Domaine manquant' },
        { status: 400 }
      )
    }

    // Vérifier si le domaine est déjà pris
    const existing = await adminDb
      .collection('instructors')
      .where('customDomain', '==', customDomain)
      .limit(1)
      .get()

    if (!existing.empty && existing.docs[0].id !== uid) {
      return NextResponse.json(
        { error: 'Ce domaine est déjà utilisé' },
        { status: 409 }
      )
    }

    // Mettre à jour
    await adminDb.collection('instructors').doc(uid).update({
      customDomain,
      domainVerified: false,
      updatedAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ success: true, customDomain })
  } catch (error) {
    console.error('Erreur domaine:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}