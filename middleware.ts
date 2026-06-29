import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware runs on Edge — localStorage is not available here.
// We use a cookie "token" set on the client side for SSR protection.
// The actual Bearer header is injected client-side via lib/api.ts.
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl

  const isPanel =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/agenda') ||
    pathname.startsWith('/solicitacoes') ||
    pathname.startsWith('/folgas') ||
    pathname.startsWith('/relatorios') ||
    pathname.startsWith('/conectar') ||
    pathname.startsWith('/profissionais') ||
    pathname.startsWith('/servicos') ||
    pathname.startsWith('/assinatura') ||
    pathname.startsWith('/configuracoes')

  if (isPanel && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Back-office: protege /admin (exceto a própria tela de login).
  if (pathname.startsWith('/admin') && pathname !== '/admin/login' && !token) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/agenda/:path*',
    '/solicitacoes/:path*',
    '/folgas/:path*',
    '/relatorios/:path*',
    '/conectar/:path*',
    '/profissionais/:path*',
    '/servicos/:path*',
    '/assinatura/:path*',
    '/configuracoes/:path*',
    '/admin/:path*',
  ],
}
