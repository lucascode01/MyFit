'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/features/auth/AuthProvider';

export function Header() {
  const { user, logout, isLoading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-white/10 sticky top-0 z-50 bg-brand-black/95 backdrop-blur supports-[backdrop-filter]:bg-brand-black/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <Link
          href={user ? '/dashboard' : '/'}
          className="flex items-center gap-2 shrink-0"
          onClick={() => setMenuOpen(false)}
        >
          <Image
            src="/logo.png"
            alt="MY personal"
            width={120}
            height={48}
            className="object-contain h-8 sm:h-10 w-auto"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-4">
          {!isLoading && (
            <>
              {user ? (
                <>
                  {user.role === 'professional' || user.role === 'admin' ? (
                    <Link href="/dashboard/professional" className="text-white/80 hover:text-white text-sm whitespace-nowrap">
                      Meus vídeos
                    </Link>
                  ) : (
                    <Link href="/dashboard" className="text-white/80 hover:text-white text-sm whitespace-nowrap">
                      Treinos
                    </Link>
                  )}
                  <span className="text-white/50 text-sm max-w-[140px] truncate" title={user.email}>
                    {user.email}
                  </span>
                  <button
                    type="button"
                    onClick={logout}
                    className="text-white/60 hover:text-white text-sm whitespace-nowrap"
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

        {/* Mobile: menu button */}
        <div className="sm:hidden flex items-center gap-2">
          {!isLoading && user && (
            <span className="text-white/50 text-xs max-w-[100px] truncate" title={user.email}>
              {user.email}
            </span>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="p-2 -mr-2 text-white/80 hover:text-white rounded-lg touch-manipulation"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-white/10 bg-brand-black">
          <nav className="px-4 py-3 flex flex-col gap-1">
            {!isLoading && (
              <>
                {user ? (
                  <>
                    {user.role === 'professional' || user.role === 'admin' ? (
                      <Link
                        href="/dashboard/professional"
                        className="py-3 px-3 text-white/80 hover:text-white rounded-lg hover:bg-white/5"
                        onClick={() => setMenuOpen(false)}
                      >
                        Meus vídeos
                      </Link>
                    ) : (
                      <Link
                        href="/dashboard"
                        className="py-3 px-3 text-white/80 hover:text-white rounded-lg hover:bg-white/5"
                        onClick={() => setMenuOpen(false)}
                      >
                        Treinos
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                      className="py-3 px-3 text-left text-white/60 hover:text-white rounded-lg hover:bg-white/5 w-full"
                    >
                      Sair
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="py-3 px-3 text-white/80 hover:text-white rounded-lg hover:bg-white/5"
                      onClick={() => setMenuOpen(false)}
                    >
                      Entrar
                    </Link>
                    <Link
                      href="/register"
                      className="btn-primary text-center block mt-2"
                      onClick={() => setMenuOpen(false)}
                    >
                      Cadastrar
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
