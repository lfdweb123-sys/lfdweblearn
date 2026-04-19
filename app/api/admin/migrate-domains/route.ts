// app/api/admin/migrate-domains/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase/admin'

const VERCEL_TOKEN = process.env.VERCEL_TOKEN!
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID!

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('firebase-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const decoded = await adminAuth.verifyIdToken(token)
    const userSnap = await adminDb.collection('users').doc(decoded.uid).get()
    if (userSnap.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin requis' }, { status: 403 })
    }

    // Récupérer tous les formateurs
    const instructorsSnap = await adminDb.collection('instructors').get()
    const results: { slug: string; domain: string; status: string }[] = []

    for (const doc of instructorsSnap.docs) {
      const data = doc.data()
      const slug = data.slug

      if (!slug) continue

      // Sous-domaine automatique
      const subdomain = slug + '.' + (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'lfdweblearn.com')

      try {
        const res = await fetch(
          `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${VERCEL_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: subdomain }),
          }
        )
        const vercelData = await res.json()

        if (res.ok || vercelData.error?.code === 'domain_already_in_use') {
          results.push({ slug, domain: subdomain, status: 'ok' })
        } else {
          results.push({ slug, domain: subdomain, status: 'erreur: ' + vercelData.error?.message })
        }
      } catch {
        results.push({ slug, domain: subdomain, status: 'erreur reseau' })
      }

      // Domaine personnalisé s'il existe
      if (data.customDomain) {
        try {
          const res2 = await fetch(
            `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${VERCEL_TOKEN}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ name: data.customDomain }),
            }
          )
          const vercelData2 = await res2.json()
          results.push({
            slug,
            domain: data.customDomain,
            status: res2.ok ? 'ok' : 'erreur: ' + vercelData2.error?.message,
          })
        } catch {
          results.push({ slug, domain: data.customDomain, status: 'erreur reseau' })
        }
      }
    }

    return NextResponse.json({ success: true, migrated: results.length, results })
  } catch (error) {
    console.error('Erreur migration:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}