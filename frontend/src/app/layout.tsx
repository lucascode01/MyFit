import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/features/auth/AuthProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'MY personal – Treinos',
  description: 'Treinos de academia com profissionais',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-screen bg-brand-black text-brand-white font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
