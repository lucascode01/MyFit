'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from './AuthProvider';
import { PasswordInput } from '@/components/PasswordInput';
import type { AuthTokens } from '@/types';

type Role = 'user' | 'professional';

export function RegisterForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<Role>('user');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== passwordConfirm) {
      setError('Senhas não conferem.');
      return;
    }
    if (role === 'professional' && !fullName.trim()) {
      setError('Profissionais devem informar o nome completo.');
      return;
    }
    setLoading(true);
    const body: Record<string, string> = {
      email,
      username: username || email.split('@')[0],
      password,
      password_confirm: passwordConfirm,
      first_name: firstName,
      last_name: lastName,
      role,
    };
    if (role === 'professional') {
      body.full_name = fullName;
    }
    const res = await api<AuthTokens>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (!res.success) {
      setError(res.error.message);
      return;
    }
    login(res.data.access, res.data.refresh, res.data.user);
    if (res.data.user.role === 'professional' || res.data.user.role === 'admin') router.push('/dashboard/professional');
    else router.push('/dashboard');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6 sm:p-6 pb-safe-bottom overflow-y-auto">
      <Link href="/" className="mb-6 sm:mb-8 shrink-0">
        <Image src="/logo.png" alt="MY personal" width={200} height={80} className="object-contain w-[180px] sm:w-[200px] h-auto" priority />
      </Link>
      <div className="w-full max-w-sm card p-4 sm:p-6 my-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-center mb-5 sm:mb-6">Cadastro</h1>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <input
            type="email"
            placeholder="E-mail"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Nome de usuário (opcional)"
            className="input-field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="text"
            placeholder="Nome"
            className="input-field"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Sobrenome"
            className="input-field"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <div>
            <label className="block text-sm text-white/70 mb-1">Perfil</label>
            <select
              className="input-field"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              <option value="user">Usuário</option>
              <option value="professional">Profissional</option>
            </select>
          </div>
          {role === 'professional' && (
            <input
              type="text"
              placeholder="Nome completo (obrigatório para profissionais)"
              className="input-field"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          )}
          <PasswordInput
            placeholder="Senha"
            className="input-field w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          <PasswordInput
            placeholder="Confirmar senha"
            className="input-field w-full"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>
        <p className="text-center text-white/60 text-sm mt-4 break-words">
          Já tem conta?{' '}
          <Link href="/login" className="text-brand-orange hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
