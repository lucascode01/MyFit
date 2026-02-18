'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthProvider';
import { Header } from '@/components/Header';

export default function ProfessionalDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'professional' && user.role !== 'admin') {
      router.replace('/dashboard');
      return;
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/60">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
