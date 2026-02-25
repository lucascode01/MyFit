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

function parseFieldErrors(details: unknown): Record<string, string> {
  if (!details || typeof details !== 'object' || Array.isArray(details)) return {};
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(details)) {
    const msg = Array.isArray(val) ? val[0] : val;
    if (typeof msg === 'string') out[key] = msg;
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearErrors();

    if (password !== passwordConfirm) {
      setError('Senhas não conferem.');
      setFieldErrors((prev) => ({ ...prev, password_confirm: 'As senhas não são iguais.' }));
      return;
    }
    if (role === 'professional' && !fullName.trim()) {
      setError('Profissionais devem informar o nome completo.');
      setFieldErrors((prev) => ({ ...prev, full_name: 'Obrigatório para profissionais.' }));
      return;
    }

    const trimmedUsername = (username || email.split('@')[0]).trim();
    if (trimmedUsername && /\s/.test(trimmedUsername)) {
      setError('O nome de usuário não pode conter espaços.');
      setFieldErrors((prev) => ({ ...prev, username: 'Remova os espaços do nome de usuário.' }));
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

    try {
      const res = await api<AuthTokens>('/auth/register/', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setLoading(false);

      if (!res.success) {
        setError(res.error.message);
        const parsed = parseFieldErrors(res.error.details);
        if (Object.keys(parsed).length > 0) setFieldErrors(parsed);
        return;
      }

      login(res.data.access, res.data.refresh, res.data.user);
      if (res.data.user.role === 'professional' || res.data.user.role === 'admin') router.push('/dashboard/professional');
      else router.push('/dashboard');
    } catch (_err) {
      setLoading(false);
      setError('Não foi possível conectar. Verifique sua internet e tente novamente.');
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6 sm:p-6 pb-safe-bottom overflow-y-auto">
      <div className="mb-6 sm:mb-8 shrink-0">
        <Image src="/logo.png" alt="MY personal" width={200} height={80} className="object-contain w-[180px] sm:w-[200px] h-auto" priority />
      </div>
      <div className="w-full max-w-sm card p-4 sm:p-6 my-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-center mb-5 sm:mb-6">Cadastro</h1>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm" role="alert">
              {error}
            </div>
          )}

          <div>
            <input
              type="email"
              placeholder="E-mail"
              className={`input-field ${fieldErrors.email ? 'border-red-500/50' : ''}`}
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: '' })); }}
              required
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'err-email' : undefined}
            />
            {fieldErrors.email && <p id="err-email" className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>}
          </div>

          <div>
            <input
              type="text"
              placeholder="Nome de usuário (opcional)"
              className={`input-field ${fieldErrors.username ? 'border-red-500/50' : ''}`}
              value={username}
              onChange={(e) => { setUsername(e.target.value); setFieldErrors((p) => ({ ...p, username: '' })); }}
              aria-invalid={!!fieldErrors.username}
              aria-describedby={fieldErrors.username ? 'err-username' : undefined}
            />
            {fieldErrors.username && <p id="err-username" className="text-red-400 text-xs mt-1">{fieldErrors.username}</p>}
          </div>

          <div>
            <input
              type="text"
              placeholder="Nome"
              className={`input-field ${fieldErrors.first_name ? 'border-red-500/50' : ''}`}
              value={firstName}
              onChange={(e) => { setFirstName(e.target.value); setFieldErrors((p) => ({ ...p, first_name: '' })); }}
              aria-invalid={!!fieldErrors.first_name}
              aria-describedby={fieldErrors.first_name ? 'err-first_name' : undefined}
            />
            {fieldErrors.first_name && <p id="err-first_name" className="text-red-400 text-xs mt-1">{fieldErrors.first_name}</p>}
          </div>

          <div>
            <input
              type="text"
              placeholder="Sobrenome"
              className={`input-field ${fieldErrors.last_name ? 'border-red-500/50' : ''}`}
              value={lastName}
              onChange={(e) => { setLastName(e.target.value); setFieldErrors((p) => ({ ...p, last_name: '' })); }}
              aria-invalid={!!fieldErrors.last_name}
              aria-describedby={fieldErrors.last_name ? 'err-last_name' : undefined}
            />
            {fieldErrors.last_name && <p id="err-last_name" className="text-red-400 text-xs mt-1">{fieldErrors.last_name}</p>}
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">Perfil</label>
            <select
              className="input-field"
              value={role}
              onChange={(e) => { setRole(e.target.value as Role); setFieldErrors((p) => ({ ...p, full_name: '' })); }}
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
                className={`input-field ${fieldErrors.full_name ? 'border-red-500/50' : ''}`}
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setFieldErrors((p) => ({ ...p, full_name: '' })); }}
                aria-invalid={!!fieldErrors.full_name}
                aria-describedby={fieldErrors.full_name ? 'err-full_name' : undefined}
              />
              {fieldErrors.full_name && <p id="err-full_name" className="text-red-400 text-xs mt-1">{fieldErrors.full_name}</p>}
            </div>
          )}

          <div>
            <PasswordInput
              placeholder="Senha"
              className={`input-field w-full ${fieldErrors.password ? 'border-red-500/50' : ''}`}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: '' })); }}
              minLength={8}
              required
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'err-password' : undefined}
            />
            {fieldErrors.password && <p id="err-password" className="text-red-400 text-xs mt-1">{fieldErrors.password}</p>}
          </div>

          <div>
            <PasswordInput
              placeholder="Confirmar senha"
              className={`input-field w-full ${fieldErrors.password_confirm ? 'border-red-500/50' : ''}`}
              value={passwordConfirm}
              onChange={(e) => { setPasswordConfirm(e.target.value); setFieldErrors((p) => ({ ...p, password_confirm: '' })); }}
              required
              aria-invalid={!!fieldErrors.password_confirm}
              aria-describedby={fieldErrors.password_confirm ? 'err-password_confirm' : undefined}
            />
            {fieldErrors.password_confirm && <p id="err-password_confirm" className="text-red-400 text-xs mt-1">{fieldErrors.password_confirm}</p>}
          </div>
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
