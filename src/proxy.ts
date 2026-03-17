import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Next.js 16 proxy.ts - Edge-compatible route protection
// 直接检查 NextAuth.js v5 的 session cookie（JWT 策略）
// 不调用 auth()，完全在 Edge Runtime 可用

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 公开路由，无需认证
  const isPublic = pathname.startsWith('/login')
    || pathname.startsWith('/register')
    || pathname.startsWith('/api/auth')
    || pathname.startsWith('/_next')
    || pathname.startsWith('/favicon');

  if (isPublic) {
    return NextResponse.next();
  }

  // 检查 NextAuth.js v5 的 session token cookie
  // v5 使用 '__Secure-authjs.session-token'（https）或 'authjs.session-token'（http）
  const sessionToken = req.cookies.get('__Secure-authjs.session-token')?.value
    || req.cookies.get('authjs.session-token')?.value;

  if (!sessionToken) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
