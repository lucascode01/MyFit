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
    try {
      const res = await api<AuthTokens>('/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (!res.success) {
        setError(res.error?.message ?? 'Erro ao entrar.');
        return;
      }
      login(res.data!.access, res.data!.refresh, res.data!.user);
      const role = res.data!.user.role;
      if (role === 'professional' || role === 'admin') router.push('/dashboard/professional');
      else router.push('/dashboard');
    } catch (err) {
      setError('Não foi possível conectar. Verifique a URL da API e se o backend está no ar.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6 sm:p-6 pb-safe-bottom">
      <Link href="/" className="mb-6 sm:mb-8 shrink-0">
        <Image src="/logo.png" alt="MY personal" width={200} height={80} className="object-contain w-[180px] sm:w-[200px] h-auto" priority />
      </Link>
      <div className="w-full max-w-sm card p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-center mb-5 sm:mb-6">Entrar</h1>
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
        <p className="text-center text-white/60 text-sm mt-4 break-words">
          Não tem conta?{' '}
          <Link href="/register" className="text-brand-orange hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
