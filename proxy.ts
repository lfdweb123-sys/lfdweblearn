// proxy.ts
import { NextRequest, NextResponse } from 'next/server'

const PROTECTED_ROUTES: Record<string, string[]> = {
  '/dashboard': ['student', 'instructor', 'admin'],
  '/instructor': ['instructor', 'admin'],
  '/admin': ['admin'],
  '/learn': ['student', 'instructor', 'admin'],
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('firebase-token')?.value

  const isProtected = Object.keys(PROTECTED_ROUTES).some((route) =>
    pathname.startsWith(route)
  )

  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (token && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}