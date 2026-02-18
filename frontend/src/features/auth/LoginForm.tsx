'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from './AuthProvider';
import type { AuthTokens } from '@/types';

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await api<AuthTokens>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.success) {
      setError(res.error.message);
      return;
    }
    login(res.data.access, res.data.refresh, res.data.user);
    const role = res.data.user.role;
    if (role === 'professional' || role === 'admin') router.push('/dashboard/professional');
    else router.push('/dashboard');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Link href="/" className="mb-8">
        <Image src="/logo.png" alt="MY personal" width={200} height={80} className="object-contain" priority />
      </Link>
      <div className="w-full max-w-sm card p-6">
        <h1 className="text-xl font-semibold text-center mb-6">Entrar</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="E-mail"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p className="text-center text-white/60 text-sm mt-4">
          Não tem conta?{' '}
          <Link href="/register" className="text-brand-orange hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
