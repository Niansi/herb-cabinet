import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 轻量 Edge-compatible auth 配置（仅用于 middleware JWT 检验）
// 不包含 Credentials provider（因为 bcrypt 不兼容 Edge Runtime）
const { auth } = NextAuth({
  providers: [],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
});

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
