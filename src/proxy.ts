import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// proxy.ts 作为 Next.js 16 的 middleware 代理
// 保护需要认证的路由

export default async function proxy(req: NextRequest) {
  const session = await auth();
  const { pathname } = req.nextUrl;

  // 公开路由，无需认证
  const isPublic = pathname.startsWith('/login')
    || pathname.startsWith('/register')
    || pathname.startsWith('/api/auth');

  if (!isPublic && !session) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // 已登录用户访问 /login 或 /register，重定向到首页
  if (session && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
