'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (access: string, refresh: string, user: User) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, isLoading: true });

  const login = useCallback((access: string, refresh: string, user: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access', access);
      localStorage.setItem('refresh', refresh);
      localStorage.setItem('user', JSON.stringify(user));
    }
    setState({ user, isLoading: false });
  }, []);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      localStorage.removeItem('user');
    }
    setState({ user: null, isLoading: false });
  }, []);

  const setUser = useCallback((user: User | null) => {
    setState((s) => ({ ...s, user }));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem('user');
    if (raw) {
      try {
        const user = JSON.parse(raw) as User;
        setState({ user, isLoading: false });
      } catch {
        setState({ user: null, isLoading: false });
      }
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
