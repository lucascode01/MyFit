'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/features/auth/AuthProvider';

export function Header() {
  const { user, logout, isLoading } = useAuth();

  return (
    <header className="border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2">
          <Image src="/logo.png" alt="MY personal" width={120} height={48} className="object-contain h-10 w-auto" />
        </Link>
        <nav className="flex items-center gap-4">
          {!isLoading && (
            <>
              {user ? (
                <>
                  {user.role === 'professional' || user.role === 'admin' ? (
                    <Link href="/dashboard/professional" className="text-white/80 hover:text-white text-sm">
                      Meus vídeos
                    </Link>
                  ) : (
                    <Link href="/dashboard" className="text-white/80 hover:text-white text-sm">
                      Treinos
                    </Link>
                  )}
                  <span className="text-white/50 text-sm">{user.email}</span>
                  <button
                    type="button"
                    onClick={logout}
                    className="text-white/60 hover:text-white text-sm"
                  >
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-white/80 hover:text-white text-sm">
                    Entrar
                  </Link>
                  <Link href="/register" className="btn-primary text-sm py-1.5 px-3">
                    Cadastrar
                  </Link>
                </>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
