// app/api/admin/migrate-domains/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase/admin'

const VERCEL_TOKEN = process.env.VERCEL_TOKEN!
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID!
const HOSTINGER_API_KEY = process.env.HOSTINGER_API_KEY!
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'lfdweblearn.com'

async function addCnameHostinger(subdomain: string): Promise<boolean> {
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
    return res.ok
  } catch {
    return false
  }
}

async function addDomainVercel(domain: string): Promise<boolean> {
  try {
    const res = await fetch(
      'https://api.vercel.com/v10/projects/' + VERCEL_PROJECT_ID + '/domains',
      {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + VERCEL_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: domain }),
      }
    )
    const data = await res.json()
    return res.ok || data.error?.code === 'domain_already_in_use'
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('firebase-token')?.value
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

    const decoded = await adminAuth.verifyIdToken(token)
    const userSnap = await adminDb.collection('users').doc(decoded.uid).get()
    if (userSnap.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin requis' }, { status: 403 })
    }

    const instructorsSnap = await adminDb.collection('instructors').get()
    const results: { slug: string; domain: string; hostinger: boolean; vercel: boolean }[] = []

    for (const doc of instructorsSnap.docs) {
      const data = doc.data()
      const slug = data.slug
      if (!slug) continue

      const subdomain = slug + '.' + ROOT_DOMAIN

      const [hostingerOk, vercelOk] = await Promise.all([
        addCnameHostinger(slug),
        addDomainVercel(subdomain),
      ])

      results.push({ slug, domain: subdomain, hostinger: hostingerOk, vercel: vercelOk })

      // Domaine personnalisé externe
      if (data.customDomain && !data.customDomain.endsWith('.' + ROOT_DOMAIN)) {
        const vercelCustom = await addDomainVercel(data.customDomain)
        results.push({ slug, domain: data.customDomain, hostinger: true, vercel: vercelCustom })
      }
    }

    return NextResponse.json({ success: true, migrated: results.length, results })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}