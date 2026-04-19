// app/api/resolve-domain/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const domain = searchParams.get('domain')

  if (!domain) {
    return NextResponse.json({ error: 'Domaine manquant' }, { status: 400 })
  }

  try {
    // Chercher le formateur par domaine personnalisé
    const snap = await adminDb
      .collection('instructors')
      .where('customDomain', '==', domain)
      .limit(1)
      .get()

    if (snap.empty) {
      return NextResponse.json({ error: 'Formateur introuvable' }, { status: 404 })
    }

    const instructor = snap.docs[0].data()
    return NextResponse.json({ slug: instructor.slug })
  } catch (error) {
    console.error('Erreur resolve-domain:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}