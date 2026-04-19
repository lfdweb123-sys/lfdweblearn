// app/api/domains/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

const VERCEL_TOKEN = process.env.VERCEL_TOKEN!
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID!
const VERCEL_API = 'https://api.vercel.com'

// ── Ajouter domaine sur Vercel ───────────────────────────────
async function addDomainToVercel(domain: string): Promise<{
  success: boolean
  error?: string
  verified?: boolean
}> {
  try {
    const res = await fetch(
      `${VERCEL_API}/v10/projects/${VERCEL_PROJECT_ID}/domains`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: domain }),
      }
    )
    const data = await res.json()

    if (!res.ok) {
      // Domaine déjà ajouté = pas une erreur
      if (data.error?.code === 'domain_already_in_use') {
        return { success: true, verified: true }
      }
      return { success: false, error: data.error?.message || 'Erreur Vercel' }
    }

    return { success: true, verified: data.verified || false }
  } catch (error) {
    console.error('Erreur Vercel API:', error)
    return { success: false, error: 'Erreur réseau' }
  }
}

// ── Vérifier le statut DNS d'un domaine ─────────────────────
async function checkDomainVerification(domain: string): Promise<{
  verified: boolean
  pending?: boolean
}> {
  try {
    const res = await fetch(
      `${VERCEL_API}/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}`,
      {
        headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
      }
    )
    const data = await res.json()
    return {
      verified: data.verified || false,
      pending: !data.verified,
    }
  } catch {
    return { verified: false, pending: true }
  }
}

// ── Supprimer domaine de Vercel ──────────────────────────────
async function removeDomainFromVercel(domain: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${VERCEL_API}/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
      }
    )
    return res.ok
  } catch {
    return false
  }
}

// ── GET — vérifier disponibilité slug ou statut domaine ──────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const domain = searchParams.get('domain')
  const checkStatus = searchParams.get('checkStatus')

  if (slug) {
    const snap = await adminDb
      .collection('instructors')
      .where('slug', '==', slug)
      .limit(1)
      .get()
    return NextResponse.json({ available: snap.empty })
  }

  if (domain && checkStatus) {
    const status = await checkDomainVerification(domain)
    return NextResponse.json(status)
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

// ── POST — connecter un domaine personnalisé ─────────────────
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
      return NextResponse.json({ error: 'Domaine manquant' }, { status: 400 })
    }

    // Valider le format du domaine
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/
    if (!domainRegex.test(customDomain)) {
      return NextResponse.json(
        { error: 'Format de domaine invalide' },
        { status: 400 }
      )
    }

    // Vérifier si le domaine est déjà pris par un autre formateur
    const existingSnap = await adminDb
      .collection('instructors')
      .where('customDomain', '==', customDomain)
      .limit(1)
      .get()

    if (!existingSnap.empty && existingSnap.docs[0].id !== uid) {
      return NextResponse.json(
        { error: 'Ce domaine est déjà utilisé par un autre formateur' },
        { status: 409 }
      )
    }

    // Ajouter le domaine sur Vercel automatiquement
    const vercelResult = await addDomainToVercel(customDomain)

    if (!vercelResult.success) {
      return NextResponse.json(
        { error: 'Erreur lors de la connexion du domaine : ' + vercelResult.error },
        { status: 500 }
      )
    }

    // Sauvegarder dans Firestore
    await adminDb.collection('instructors').doc(uid).update({
      customDomain,
      domainVerified: vercelResult.verified || false,
      domainAddedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({
      success: true,
      customDomain,
      verified: vercelResult.verified,
      message: vercelResult.verified
        ? 'Domaine connecté et vérifié !'
        : 'Domaine ajouté. En attente de la propagation DNS.',
    })
  } catch (error) {
    console.error('Erreur domaine:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ── DELETE — supprimer un domaine personnalisé ───────────────
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('firebase-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const decoded = await adminAuth.verifyIdToken(token)
    const uid = decoded.uid

    const { customDomain } = await request.json()

    // Supprimer de Vercel
    await removeDomainFromVercel(customDomain)

    // Mettre à jour Firestore
    await adminDb.collection('instructors').doc(uid).update({
      customDomain: null,
      domainVerified: false,
      updatedAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur suppression domaine:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}