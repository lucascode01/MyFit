import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/Header';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <Image
          src="/logo.png"
          alt="MY personal"
          width={280}
          height={112}
          className="object-contain mb-8"
          priority
        />
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Treinos de Academia</h1>
        <p className="text-white/70 mb-8 max-w-md">
          Acesse treinos em vídeo com profissionais de educação física. Cadastre-se ou entre para começar.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/login" className="btn-primary inline-block text-center">
            Entrar
          </Link>
          <Link href="/register" className="btn-secondary inline-block text-center">
            Cadastrar
          </Link>
        </div>
      </main>
    </div>
  );
}
