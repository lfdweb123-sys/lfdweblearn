// proxy.ts
import { NextRequest, NextResponse } from 'next/server'

const PROTECTED_ROUTES: Record<string, string[]> = {
  '/dashboard': ['student', 'instructor', 'admin'],
  '/instructor': ['instructor', 'admin'],
  '/admin': ['admin'],
  '/learn': ['student', 'instructor', 'admin'],
}

const AUTH_ROUTES = ['/login', '/register']
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'lfdweblearn.com'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || ''
  const token = request.cookies.get('firebase-token')?.value

  // ── Gestion domaines personnalisés et sous-domaines ──────
  const isVercelApp = hostname.includes('vercel.app')
  const isLocalhost = hostname.includes('localhost')
  const isRootDomain =
    hostname === ROOT_DOMAIN ||
    hostname === 'www.' + ROOT_DOMAIN ||
    isVercelApp ||
    isLocalhost

  if (!isRootDomain) {
    // Sous-domaine formateur : gerard-sononkpon.lfdweblearn.com
    const isSubdomain =
      hostname.endsWith('.' + ROOT_DOMAIN) &&
      !hostname.startsWith('www.')

    if (isSubdomain) {
      const slug = hostname.replace('.' + ROOT_DOMAIN, '')

      // Réécrire vers la page publique du formateur
      const url = request.nextUrl.clone()
      url.pathname = '/' + slug + (pathname === '/' ? '' : pathname)
      return NextResponse.rewrite(url)
    }

    // Domaine personnalisé externe (formations.monsiteweb.com)
    // Chercher le formateur via l'API interne
    const url = request.nextUrl.clone()
    url.pathname = '/api/resolve-domain'
    url.searchParams.set('domain', hostname)
    url.searchParams.set('path', pathname)

    // Réécrire vers la page du formateur trouvé
    const resolveRes = await fetch(
      new URL('/api/resolve-domain?domain=' + hostname, request.url)
    )

    if (resolveRes.ok) {
      const data = await resolveRes.json()
      if (data.slug) {
        const rewriteUrl = request.nextUrl.clone()
        rewriteUrl.pathname = '/' + data.slug + (pathname === '/' ? '' : pathname)
        return NextResponse.rewrite(rewriteUrl)
      }
    }

    // Domaine non trouvé → page 404 formateur
    const notFoundUrl = request.nextUrl.clone()
    notFoundUrl.pathname = '/instructor-not-found'
    return NextResponse.rewrite(notFoundUrl)
  }

  // ── Headers de sécurité ──────────────────────────────────
  const response = NextResponse.next()
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // ── CSP renforcé pour /learn ─────────────────────────────
  if (pathname.startsWith('/learn')) {
    response.headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
        "media-src 'self' blob: https://*.b-cdn.net https://iframe.mediadelivery.net",
        "img-src 'self' data: blob: https://res.cloudinary.com https://*.b-cdn.net",
        "connect-src 'self' https://*.b-cdn.net https://iframe.mediadelivery.net",
        "frame-src https://iframe.mediadelivery.net",
        "frame-ancestors 'none'",
      ].join('; ')
    )
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  }

  // ── Protection routes ────────────────────────────────────
  const isProtected = Object.keys(PROTECTED_ROUTES).some((route) =>
    pathname.startsWith(route)
  )
  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (token && AUTH_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // ── Protection APIs ──────────────────────────────────────
  const PROTECTED_API = [
    '/api/media/signed-url',
    '/api/media/upload-video',
    '/api/payments/initiate',
    '/api/payments/verify',
    '/api/enrollments',
    '/api/instructor',
  ]
  const isProtectedApi = PROTECTED_API.some((route) =>
    pathname.startsWith(route)
  )
  if (isProtectedApi && !token) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}