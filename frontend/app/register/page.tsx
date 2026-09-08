'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { register } from '@/lib/api/auth';
import { useAuth } from '@/components/auth/auth-provider';

export default function RegisterPage() {
  const router = useRouter();
  const { completeLogin } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setSubmitting(true); setError(null);
    try {
      const result = await register({ display_name: displayName, email, password });
      completeLogin(result.access_token, result.user);
      router.replace('/dashboard');
    } catch { setError('Unable to create your account. Try a different email.'); }
    finally { setSubmitting(false); }
  }

  return <main className="min-h-screen grid place-items-center p-4 bg-zinc-950"><form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 space-y-4 shadow-xl">
    <div><h1 className="text-xl font-bold">Create your account</h1><p className="mt-1 text-sm text-zinc-400">Start organizing your meetings.</p></div>
    <label className="block text-sm text-zinc-300">Name<input required autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500" /></label>
    <label className="block text-sm text-zinc-300">Email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500" /></label>
    <label className="block text-sm text-zinc-300">Password<input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500" /></label>
    {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
    <button disabled={submitting} className="w-full rounded-lg bg-violet-600 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60">{submitting ? 'Creating account…' : 'Create account'}</button>
    <p className="text-center text-sm text-zinc-400">Already have an account? <Link className="text-violet-300 underline" href="/login">Sign in</Link></p>
  </form></main>;
}
