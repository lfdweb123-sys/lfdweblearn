// proxy.ts
import { NextRequest, NextResponse } from 'next/server'

const PROTECTED_ROUTES: Record<string, string[]> = {
  '/dashboard': ['student', 'instructor', 'admin'],
  '/instructor': ['instructor', 'admin'],
  '/admin': ['admin'],
  '/learn': ['student', 'instructor', 'admin'],
}

const AUTH_ROUTES = ['/login', '/register']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('firebase-token')?.value

  // ── Headers de sécurité globaux ──────────────────────────
  const response = NextResponse.next()

  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )

  // ── Protection routes /learn (sécurité renforcée) ────────
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

  // ── Vérification routes protégées ────────────────────────
  const isProtected = Object.keys(PROTECTED_ROUTES).some((route) =>
    pathname.startsWith(route)
  )

  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Rediriger si déjà connecté ───────────────────────────
  if (token && AUTH_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // ── Bloquer les API sensibles sans token ─────────────────
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
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}