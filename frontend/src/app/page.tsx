import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/Header';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:p-6 text-center container-touch">
        <Image
          src="/logo.png"
          alt="MY personal"
          width={280}
          height={112}
          className="object-contain mb-6 sm:mb-8 w-full max-w-[280px] h-auto"
          priority
        />
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">Treinos de Academia</h1>
        <p className="text-white/70 mb-6 sm:mb-8 max-w-md text-sm sm:text-base">
          Acesse treinos em vídeo com profissionais de educação física. Cadastre-se ou entre para começar.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto max-w-xs sm:max-w-none">
          <Link href="/login" className="btn-primary inline-block text-center w-full sm:w-auto">
            Entrar
          </Link>
          <Link href="/register" className="btn-secondary inline-block text-center w-full sm:w-auto">
            Cadastrar
          </Link>
        </div>
      </main>
    </div>
  );
}
