// app/api/domains/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

const VERCEL_TOKEN = process.env.VERCEL_TOKEN!
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID!
const HOSTINGER_API_KEY = process.env.HOSTINGER_API_KEY!
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'lfdweblearn.com'
const VERCEL_API = 'https://api.vercel.com'
const HOSTINGER_API = 'https://developers.hostinger.com/api/dns/v1/zones'

// ── Hostinger : ajouter CNAME ────────────────────────────
async function addCnameHostinger(subdomain: string): Promise<boolean> {
  try {
    const res = await fetch(HOSTINGER_API + '/' + ROOT_DOMAIN + '/records', {
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
    })
    const data = await res.json()
    console.log('Hostinger CNAME:', subdomain, res.status, JSON.stringify(data))
    return res.ok
  } catch (e) {
    console.error('Hostinger error:', e)
    return false
  }
}

// ── Hostinger : supprimer CNAME ──────────────────────────
async function deleteCnameHostinger(subdomain: string): Promise<void> {
  try {
    await fetch(HOSTINGER_API + '/' + ROOT_DOMAIN + '/records', {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer ' + HOSTINGER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filters: [{ type: 'CNAME', name: subdomain }] }),
    })
  } catch {}
}

// ── Vercel : ajouter domaine ─────────────────────────────
async function addDomainVercel(domain: string): Promise<{ success: boolean; verified?: boolean; error?: string }> {
  try {
    const res = await fetch(
      VERCEL_API + '/v10/projects/' + VERCEL_PROJECT_ID + '/domains',
      {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + VERCEL_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: domain }),
      }
    )
    const data = await res.json()
    if (!res.ok) {
      if (data.error?.code === 'domain_already_in_use') return { success: true, verified: true }
      return { success: false, error: data.error?.message }
    }
    return { success: true, verified: data.verified || false }
  } catch {
    return { success: false, error: 'Erreur reseau' }
  }
}

// ── Vercel : supprimer domaine ───────────────────────────
async function removeDomainVercel(domain: string): Promise<void> {
  try {
    await fetch(
      VERCEL_API + '/v9/projects/' + VERCEL_PROJECT_ID + '/domains/' + domain,
      { method: 'DELETE', headers: { Authorization: 'Bearer ' + VERCEL_TOKEN } }
    )
  } catch {}
}

// ── Vercel : vérifier DNS ────────────────────────────────
async function checkVercelDomain(domain: string): Promise<{ verified: boolean }> {
  try {
    const res = await fetch(
      VERCEL_API + '/v9/projects/' + VERCEL_PROJECT_ID + '/domains/' + domain,
      { headers: { Authorization: 'Bearer ' + VERCEL_TOKEN } }
    )
    const data = await res.json()
    return { verified: data.verified || false }
  } catch {
    return { verified: false }
  }
}

// ── GET ──────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const domain = searchParams.get('domain')
  const checkStatus = searchParams.get('checkStatus')

  if (slug) {
    const snap = await adminDb.collection('instructors').where('slug', '==', slug).limit(1).get()
    return NextResponse.json({ available: snap.empty })
  }

  if (domain && checkStatus) {
    const status = await checkVercelDomain(domain)
    return NextResponse.json(status)
  }

  if (domain) {
    const snap = await adminDb.collection('instructors').where('customDomain', '==', domain).limit(1).get()
    return NextResponse.json({ available: snap.empty })
  }

  return NextResponse.json({ error: 'Parametre manquant' }, { status: 400 })
}

// ── POST ─────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('firebase-token')?.value
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    const decoded = await adminAuth.verifyIdToken(token)
    const uid = decoded.uid

    const { customDomain } = await request.json()
    if (!customDomain) return NextResponse.json({ error: 'Domaine manquant' }, { status: 400 })

    // Domaine déjà pris ?
    const existing = await adminDb.collection('instructors').where('customDomain', '==', customDomain).limit(1).get()
    if (!existing.empty && existing.docs[0].id !== uid) {
      return NextResponse.json({ error: 'Domaine deja utilise' }, { status: 409 })
    }

    // C'est un sous-domaine LFD → ajouter CNAME chez Hostinger
    const isLfdSubdomain = customDomain.endsWith('.' + ROOT_DOMAIN)
    if (isLfdSubdomain) {
      const subdomain = customDomain.replace('.' + ROOT_DOMAIN, '')
      await addCnameHostinger(subdomain)
    }

    // Ajouter sur Vercel dans tous les cas
    const vercelResult = await addDomainVercel(customDomain)
    if (!vercelResult.success) {
      return NextResponse.json({ error: 'Erreur Vercel: ' + vercelResult.error }, { status: 500 })
    }

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
      message: vercelResult.verified ? 'Domaine connecte et verifie !' : 'Domaine ajoute. En attente DNS.',
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ── DELETE ───────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('firebase-token')?.value
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    const decoded = await adminAuth.verifyIdToken(token)
    const uid = decoded.uid

    const { customDomain } = await request.json()
    const isLfdSubdomain = customDomain?.endsWith('.' + ROOT_DOMAIN)

    if (isLfdSubdomain && customDomain) {
      const subdomain = customDomain.replace('.' + ROOT_DOMAIN, '')
      await deleteCnameHostinger(subdomain)
    }

    if (customDomain) await removeDomainVercel(customDomain)

    await adminDb.collection('instructors').doc(uid).update({
      customDomain: null,
      domainVerified: false,
      updatedAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}