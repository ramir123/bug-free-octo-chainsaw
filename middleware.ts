import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  const token = req.cookies.get('sb-access-token')

  const protectedPaths = ['/dashboard', '/host', '/staff', '/owner']
  const isProtectedPath = protectedPaths.some(p => path.startsWith(p))

  if (!token && isProtectedPath) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (token && (path === '/login' || path === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/host/:path*', '/staff/:path*', '/owner/:path*', '/login', '/register'],
}
