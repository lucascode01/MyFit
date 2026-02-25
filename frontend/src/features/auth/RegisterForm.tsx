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

/** Extrai erros por campo do retorno da API (DRF ou formato { field: ["msg"] }). */
function getFieldErrors(details: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (details && typeof details === 'object' && !Array.isArray(details)) {
    for (const [key, val] of Object.entries(details)) {
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string') {
        out[key] = val[0];
      } else if (typeof val === 'string') {
        out[key] = val;
      }
    }
  }
  return out;
}

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function clearErrors() {
    setError('');
    setFieldErrors({});
  }

  function validateUsername(value: string): string | null {
    if (!value.trim()) return null;
    if (/\s/.test(value)) return 'Nome de usuário não pode conter espaços. Use apenas letras, números e underline.';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearErrors();
    if (password !== passwordConfirm) {
      setError('Senhas não conferem.');
      setFieldErrors((prev) => ({ ...prev, password_confirm: 'Senhas não conferem.' }));
      return;
    }
    if (role === 'professional' && !fullName.trim()) {
      setError('Profissionais devem informar o nome completo.');
      setFieldErrors((prev) => ({ ...prev, full_name: 'Profissionais devem informar o nome completo.' }));
      return;
    }
    const usernameErr = validateUsername(username || email.split('@')[0]);
    if (usernameErr) {
      setError(usernameErr);
      setFieldErrors((prev) => ({ ...prev, username: usernameErr }));
      return;
    }
    setLoading(true);
    const body: Record<string, string> = {
      email,
      username: username.trim() ? username.trim().toLowerCase() : email.split('@')[0].toLowerCase(),
      password,
      password_confirm: passwordConfirm,
      first_name: firstName,
      last_name: lastName,
      role,
    };
    if (role === 'professional') {
      body.full_name = fullName;
    }
    try {
      const res = await api<AuthTokens>('/auth/register/', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (!res.success) {
        const byField = getFieldErrors(res.error?.details);
        setFieldErrors(byField);
        setError(res.error?.message || Object.values(byField)[0] || 'Erro ao cadastrar. Tente novamente.');
        return;
      }
      login(res.data!.access, res.data!.refresh, res.data!.user);
      if (res.data!.user.role === 'professional' || res.data!.user.role === 'admin') router.push('/dashboard/professional');
      else router.push('/dashboard');
    } catch {
      setError('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6 sm:p-6 pb-safe-bottom overflow-y-auto">
      <Link href="/" className="mb-6 sm:mb-8 shrink-0">
        <Image src="/logo.png" alt="MY personal" width={200} height={80} className="object-contain w-[180px] sm:w-[200px] h-auto" priority />
      </Link>
      <div className="w-full max-w-sm card p-4 sm:p-6 my-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-center mb-5 sm:mb-6">Cadastro</h1>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <input
              type="email"
              placeholder="E-mail"
              className="input-field"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: '' })); }}
              required
              aria-invalid={!!fieldErrors.email}
            />
            {fieldErrors.email && <p className="text-red-400 text-sm mt-1">{fieldErrors.email}</p>}
          </div>
          <div>
            <input
              type="text"
              placeholder="Nome de usuário (opcional)"
              className="input-field"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setFieldErrors((p) => ({ ...p, username: '' })); }}
              aria-invalid={!!fieldErrors.username}
              autoComplete="username"
            />
            <p className="text-white/50 text-xs mt-1">Sem espaços; use letras minúsculas (ex.: joao123)</p>
            {fieldErrors.username && <p className="text-red-400 text-sm mt-1">{fieldErrors.username}</p>}
          </div>
          <div>
            <input
              type="text"
              placeholder="Nome"
              className="input-field"
              value={firstName}
              onChange={(e) => { setFirstName(e.target.value); setFieldErrors((p) => ({ ...p, first_name: '' })); }}
              aria-invalid={!!fieldErrors.first_name}
            />
            {fieldErrors.first_name && <p className="text-red-400 text-sm mt-1">{fieldErrors.first_name}</p>}
          </div>
          <div>
            <input
              type="text"
              placeholder="Sobrenome"
              className="input-field"
              value={lastName}
              onChange={(e) => { setLastName(e.target.value); setFieldErrors((p) => ({ ...p, last_name: '' })); }}
              aria-invalid={!!fieldErrors.last_name}
            />
            {fieldErrors.last_name && <p className="text-red-400 text-sm mt-1">{fieldErrors.last_name}</p>}
          </div>
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
            <div>
              <input
                type="text"
                placeholder="Nome completo (obrigatório para profissionais)"
                className="input-field"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setFieldErrors((p) => ({ ...p, full_name: '' })); }}
                aria-invalid={!!fieldErrors.full_name}
              />
              {fieldErrors.full_name && <p className="text-red-400 text-sm mt-1">{fieldErrors.full_name}</p>}
            </div>
          )}
          <div>
            <PasswordInput
              placeholder="Senha"
              className="input-field w-full"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: '', password_confirm: '' })); }}
              minLength={8}
              required
            />
            {fieldErrors.password && <p className="text-red-400 text-sm mt-1">{fieldErrors.password}</p>}
          </div>
          <div>
            <PasswordInput
              placeholder="Confirmar senha"
              className="input-field w-full"
              value={passwordConfirm}
              onChange={(e) => { setPasswordConfirm(e.target.value); setFieldErrors((p) => ({ ...p, password_confirm: '' })); }}
              required
            />
            {fieldErrors.password_confirm && <p className="text-red-400 text-sm mt-1">{fieldErrors.password_confirm}</p>}
          </div>
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
