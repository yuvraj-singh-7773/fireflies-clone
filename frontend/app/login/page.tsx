'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { login } from '@/lib/api/auth';
import { useAuth } from '@/components/auth/auth-provider';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, completeLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const next = searchParams.get('next') || '/dashboard';

  useEffect(() => {
    if (!isLoading && user) router.replace(next.startsWith('/') ? next : '/dashboard');
  }, [isLoading, next, router, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true); setError(null);
    try {
      const result = await login({ email, password });
      completeLogin(result.access_token, result.user);
      router.replace(next.startsWith('/') ? next : '/dashboard');
    } catch { setError('Unable to sign in with those credentials.'); }
    finally { setSubmitting(false); }
  }

  return <main className="min-h-screen grid place-items-center p-4 bg-zinc-950"><form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 space-y-4 shadow-xl">
    <div><h1 className="text-xl font-bold">Sign in to Firefiles</h1><p className="mt-1 text-sm text-zinc-400">Access your meeting workspace.</p></div>
    <label className="block text-sm text-zinc-300">Email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500" /></label>
    <label className="block text-sm text-zinc-300">Password<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500" /></label>
    {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
    <button disabled={submitting} className="w-full rounded-lg bg-violet-600 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60">{submitting ? 'Signing in…' : 'Sign in'}</button>
    <p className="text-center text-sm text-zinc-400">New here? <Link className="text-violet-300 underline" href="/register">Create an account</Link></p>
  </form></main>;
}

export default function LoginPage() {
  return <Suspense fallback={<main className="min-h-screen grid place-items-center bg-zinc-950 text-zinc-400 text-sm">Loading sign in…</main>}><LoginForm /></Suspense>;
}
