// app/api/instructor/activate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'
import { slugify } from '@/lib/utils'

const VERCEL_TOKEN = process.env.VERCEL_TOKEN!
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID!
const HOSTINGER_API_KEY = process.env.HOSTINGER_API_KEY!
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'lfdweblearn.com'

async function addCnameHostinger(subdomain: string): Promise<void> {
  try {
    const res = await fetch(
      'https://developers.hostinger.com/api/dns/v1/zones/' + ROOT_DOMAIN + '/records',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + HOSTINGER_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{
          type: 'CNAME',
          name: subdomain,
          content: 'cname.vercel-dns.com.',
          ttl: 3600,
        }]),
      }
    )
    console.log('Hostinger CNAME activation:', subdomain, res.status)
  } catch (e) {
    console.error('Hostinger error activation:', e)
  }
}

async function addDomainVercel(domain: string): Promise<void> {
  try {
    await fetch(
      'https://api.vercel.com/v10/projects/' + VERCEL_PROJECT_ID + '/domains',
      {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + VERCEL_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: domain }),
      }
    )
  } catch {}
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('firebase-token')?.value
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

    const decoded = await adminAuth.verifyIdToken(token)
    const uid = decoded.uid

    const userSnap = await adminDb.collection('users').doc(uid).get()
    const userData = userSnap.data()
    if (!userData) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

    const slug = slugify(userData.displayName || 'formateur-' + uid.slice(0, 6))
    const subdomain = slug + '.' + ROOT_DOMAIN

    // Mettre à jour le rôle
    await adminDb.collection('users').doc(uid).update({
      role: 'instructor',
      updatedAt: FieldValue.serverTimestamp(),
    })

    // Créer le profil formateur
    await adminDb.collection('instructors').doc(uid).set({
      slug,
      userId: uid,
      customDomain: null,
      domainVerified: false,
      branding: {
        displayName: userData.displayName || '',
        bio: '',
        primaryColor: '#0284c7',
        secondaryColor: '#f97316',
        logo: null,
        coverImage: null,
        favicon: null,
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })

    // Auto : CNAME chez Hostinger + domaine sur Vercel
    await Promise.all([
      addCnameHostinger(slug),
      addDomainVercel(subdomain),
    ])

    return NextResponse.json({ success: true, slug, subdomain })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}