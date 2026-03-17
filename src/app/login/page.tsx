'use client';

import { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError('邮箱或密码错误，请重试');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative z-10"
      style={{ background: 'var(--rice-paper)' }}
    >
      <div className="w-full max-w-sm mx-4">
        {/* 标题横幅 */}
        <div className="text-center mb-8">
          <h1
            className="text-3xl tracking-[0.4em] font-bold mb-1"
            style={{ color: 'var(--ink-black)' }}
          >
            藥斗子
          </h1>
          <p className="text-xs tracking-[0.3em]" style={{ color: 'var(--ink-faded)' }}>
            中藥開方管理系統
          </p>
          <div
            className="mt-3 w-24 mx-auto h-px"
            style={{ background: 'var(--label-border)' }}
          />
        </div>

        {/* 登录卡片 */}
        <div
          className="p-8 border border-[var(--label-border)]"
          style={{ background: 'var(--rice-paper-dark)' }}
        >
          <h2
            className="text-base font-medium tracking-widest text-center mb-6"
            style={{ color: 'var(--ink-light)' }}
          >
            醫者登入
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-xs tracking-widest mb-1.5"
                style={{ color: 'var(--ink-faded)' }}
              >
                電郵地址
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="your@email.com"
                className="w-full px-3 py-2 text-sm border border-[var(--label-border)]
                  bg-[var(--rice-paper)] focus:outline-none focus:border-[var(--brass)]
                  transition-colors tracking-wide"
                style={{ color: 'var(--ink-black)' }}
              />
            </div>

            <div>
              <label
                className="block text-xs tracking-widest mb-1.5"
                style={{ color: 'var(--ink-faded)' }}
              >
                密碼
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••"
                className="w-full px-3 py-2 text-sm border border-[var(--label-border)]
                  bg-[var(--rice-paper)] focus:outline-none focus:border-[var(--brass)]
                  transition-colors tracking-widest"
                style={{ color: 'var(--ink-black)' }}
              />
            </div>

            {error && (
              <p className="text-xs text-center py-1.5 px-3 border border-[var(--vermilion)]/30 bg-[var(--vermilion)]/5"
                style={{ color: 'var(--vermilion)' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm tracking-widest border border-[var(--vermilion)]/50
                text-[var(--vermilion)] hover:bg-[var(--vermilion)]/10 transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? '登入中⋯' : '登　入'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <span className="text-xs" style={{ color: 'var(--ink-faded)' }}>
              尚未開立賬號？
            </span>
            <Link
              href="/register"
              className="ml-1 text-xs tracking-wider border-b border-transparent
                hover:border-[var(--brass)] transition-colors"
              style={{ color: 'var(--brass)' }}
            >
              立即注冊
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
