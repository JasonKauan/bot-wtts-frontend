import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware runs on Edge — localStorage is not available here.
// We use a cookie "token" set on the client side for SSR protection.
// The actual Bearer header is injected client-side via lib/api.ts.
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl

  const isPanel = pathname.startsWith('/dashboard') ||
    pathname.startsWith('/agenda') ||
    pathname.startsWith('/profissionais') ||
    pathname.startsWith('/servicos') ||
    pathname.startsWith('/configuracoes')

  if (isPanel && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/agenda/:path*', '/profissionais/:path*', '/servicos/:path*', '/configuracoes/:path*'],
}
