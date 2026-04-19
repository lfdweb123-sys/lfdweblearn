import { NextRequest, NextResponse } from 'next/server'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'lfdweblearn.com'
const VERCEL_URL = process.env.VERCEL_URL || 'lfdweblearn.vercel.app'

const PROTECTED_ROUTES = ['/dashboard', '/instructor', '/admin', '/learn']
const AUTH_ROUTES = ['/login', '/register']
const PROTECTED_API = [
  '/api/media/signed-url',
  '/api/media/upload-video',
  '/api/payments/initiate',
  '/api/payments/verify',
  '/api/enrollments',
  '/api/instructor',
]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || ''
  const token = request.cookies.get('firebase-token')?.value

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const isRootDomain =
    hostname === ROOT_DOMAIN ||
    hostname === 'www.' + ROOT_DOMAIN ||
    hostname.includes('vercel.app') ||
    hostname.includes('localhost')

  // ── Sous-domaine formateur : slug.lfdweblearn.com ────
  if (!isRootDomain && hostname.endsWith('.' + ROOT_DOMAIN)) {
    const slug = hostname.replace('.' + ROOT_DOMAIN, '')
    const url = request.nextUrl.clone()
    url.pathname = '/' + slug + (pathname === '/' ? '' : pathname)
    return NextResponse.rewrite(url)
  }

  // ── Domaine personnalise externe ─────────────────────
  if (!isRootDomain) {
    try {
      // Utiliser lfdweblearn.vercel.app pour eviter les redirections
      const apiUrl = 'https://lfdweblearn.vercel.app/api/resolve-domain?domain=' + encodeURIComponent(hostname)
      const res = await fetch(apiUrl, { redirect: 'follow' })
      if (res.ok) {
        const data = await res.json()
        if (data.slug) {
          const url = request.nextUrl.clone()
          url.pathname = '/' + data.slug + (pathname === '/' ? '' : pathname)
          return NextResponse.rewrite(url)
        }
      }
    } catch (e) {
      console.error('resolve-domain error:', e)
    }

    const url = request.nextUrl.clone()
    url.pathname = '/instructor-not-found'
    return NextResponse.rewrite(url)
  }

  // ── Headers securite ─────────────────────────────────
  const response = NextResponse.next()
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  if (pathname.startsWith('/learn')) {
    response.headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "media-src 'self' blob: https://*.b-cdn.net https://iframe.mediadelivery.net",
        "img-src 'self' data: blob: https://res.cloudinary.com https://*.b-cdn.net",
        "connect-src 'self' https://*.b-cdn.net https://iframe.mediadelivery.net",
        "frame-src https://iframe.mediadelivery.net",
        "frame-ancestors 'none'",
      ].join('; ')
    )
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  }

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r))
  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (token && AUTH_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  const isProtectedApi = PROTECTED_API.some((r) => pathname.startsWith(r))
  if (isProtectedApi && !token) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}